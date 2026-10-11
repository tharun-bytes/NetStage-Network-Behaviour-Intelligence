import datetime
import json
import logging
import os
import uuid
from pathlib import Path
from typing import Any, Optional

import httpx

from backend.app.config import settings
from src.copilot import tools

logger = logging.getLogger("netsage.copilot")

# In-memory conversation session store
CONVERSATIONS: dict[str, dict[str, Any]] = {}

def _init_conversations_from_disk():
    """Load existing persisted conversations from data/conversations."""
    try:
        conv_dir = settings.CONVERSATIONS_DIR
        if not conv_dir.exists():
            conv_dir.mkdir(parents=True, exist_ok=True)
            return
        for f in conv_dir.glob("*.json"):
            try:
                with open(f, "r", encoding="utf-8") as fp:
                    data = json.load(fp)
                    if "conversation_id" in data:
                        CONVERSATIONS[data["conversation_id"]] = data
            except Exception as fe:
                logger.debug(f"Error loading conversation file {f.name}: {fe}")
    except Exception as e:
        logger.warning(f"Failed to initialize conversations from disk: {e}")

_init_conversations_from_disk()

def _persist_conversation(conv: dict[str, Any]) -> None:
    """Save a conversation record to disk."""
    try:
        conv_dir = settings.CONVERSATIONS_DIR
        conv_dir.mkdir(parents=True, exist_ok=True)
        cid = conv.get("conversation_id", "conv_default")
        uid = conv.get("user_id", "guest")
        fpath = conv_dir / f"{uid}_{cid}.json"
        with open(fpath, "w", encoding="utf-8") as fp:
            json.dump(conv, fp, indent=2)
    except Exception as e:
        logger.warning(f"Could not persist conversation: {e}")

def get_or_create_conversation(
    conversation_id: Optional[str] = None,
    title: Optional[str] = None,
    user_id: str = "guest",
) -> dict[str, Any]:
    """Retrieve existing conversation or initialize a new multi-turn session."""
    now = datetime.datetime.now(datetime.timezone.utc).isoformat()
    if conversation_id and conversation_id in CONVERSATIONS:
        conv = CONVERSATIONS[conversation_id]
        if not conv.get("user_id"):
            conv["user_id"] = user_id
        return conv
    
    new_id = conversation_id or f"conv_{uuid.uuid4().hex[:8]}"
    conv = {
        "conversation_id": new_id,
        "user_id": user_id,
        "title": title or "Network Intelligence Session",
        "created_at": now,
        "updated_at": now,
        "messages": [],
        "context_state": {
            "selected_record": None,
            "last_inspected_anomaly": None,
            "last_report_id": None,
        },
    }
    CONVERSATIONS[new_id] = conv
    _persist_conversation(conv)
    return conv

def list_conversations(user_id: str = "guest") -> list[dict[str, Any]]:
    """List conversation sessions belonging to the user, sorted by most recent."""
    res = []
    for cid, c in CONVERSATIONS.items():
        c_user = c.get("user_id", "guest")
        if user_id == "guest" or c_user == user_id or c_user == "guest":
            res.append({
                "conversation_id": cid,
                "title": c.get("title", "Network Intelligence Session"),
                "created_at": c.get("created_at"),
                "updated_at": c.get("updated_at"),
                "message_count": len(c.get("messages", [])),
                "user_id": c_user,
            })
    return sorted(res, key=lambda x: x["updated_at"], reverse=True)

def delete_conversation(conversation_id: str, user_id: str = "guest") -> bool:
    """Delete a conversation session."""
    if conversation_id in CONVERSATIONS:
        conv = CONVERSATIONS[conversation_id]
        c_user = conv.get("user_id", "guest")
        if user_id != "guest" and c_user != user_id and c_user != "guest":
            return False
        del CONVERSATIONS[conversation_id]
        try:
            fpath = settings.CONVERSATIONS_DIR / f"{c_user}_{conversation_id}.json"
            if fpath.exists():
                fpath.unlink()
        except Exception as e:
            logger.warning(f"Failed to delete conversation file: {e}")
        return True
    return False

def clear_all_conversations(user_id: str = "guest") -> None:
    """Clear conversation history for the specified user."""
    to_delete = [
        cid for cid, c in CONVERSATIONS.items()
        if user_id == "guest" or c.get("user_id") == user_id or c.get("user_id") == "guest"
    ]
    for cid in to_delete:
        delete_conversation(cid, user_id=user_id)


def call_gemini_api(
    system_instruction: str,
    contents: list[dict[str, Any]],
) -> tuple[Optional[str], Optional[str]]:
    """
    Call Google Gemini API using server-side configuration.
    Never prints or logs the API key.
    Returns (response_text, model_name_used).
    """
    api_key = settings.LLM_API_KEY or os.environ.get("LLM_API_KEY") or os.environ.get("GEMINI_API_KEY")
    if not api_key:
        return None, None
    
    models_to_try = [settings.LLM_MODEL]
    for alt in ["gemini-3.5-flash", "gemini-flash-latest"]:
        if alt not in models_to_try:
            models_to_try.append(alt)

    payload = {
        "systemInstruction": {
            "parts": [{"text": system_instruction}]
        },
        "contents": contents,
        "generationConfig": {
            "temperature": 0.25,
            "maxOutputTokens": 1024,
            "thinkingConfig": {
                "thinkingBudget": 0
            }
        }
    }

    try:
        with httpx.Client(timeout=35.0) as client:
            for model in models_to_try:
                endpoint = f"{settings.LLM_BASE_URL}/models/{model}:generateContent?key={api_key}"
                try:
                    resp = client.post(endpoint, json=payload)
                    if resp.status_code == 200:
                        data = resp.json()
                        candidates = data.get("candidates", [])
                        if candidates and "content" in candidates[0]:
                            parts = candidates[0]["content"].get("parts", [])
                            if parts and "text" in parts[0]:
                                return parts[0]["text"].strip(), model
                    else:
                        logger.warning(f"Gemini API ({model}) returned HTTP {resp.status_code}: {resp.text[:180]}")
                except Exception as me:
                    logger.warning(f"Gemini API ({model}) request error: {type(me).__name__}: {str(me)[:120]}")
    except Exception as e:
        logger.warning(f"Gemini client invocation error: {type(e).__name__}: {str(e)[:120]}")

    return None, None


def build_system_prompt_and_context(
    app_state: Any,
    selected_record: Optional[dict[str, Any]] = None,
    tool_action_notes: Optional[str] = None,
) -> str:
    """Build a comprehensive, telemetry-grounded system prompt."""
    meta = tools.get_dataset_metadata(app_state)
    dist = tools.get_class_distributions(app_state)
    m_info = tools.get_model_status_and_metrics(app_state)

    dataset_summary = "No dataset currently loaded."
    if meta.get("status") == "success":
        top_classes = list(dist.get("distributions", {}).keys())[:4]
        dataset_summary = (
            f"Dataset Name: '{meta.get('dataset_name')}' | Total Flows: {meta.get('total_records'):,} | "
            f"Numeric Features: {len(meta.get('numeric_features', []))} | "
            f"Categorical Features: {len(meta.get('categorical_features', []))} | "
            f"Duplicate Rows: {meta.get('duplicate_rows', 0)} ({meta.get('duplicate_percentage', 0.0):.1f}%) | "
            f"Infinite Values: {meta.get('infinite_values', 0)} | "
            f"Key Categories: {', '.join(top_classes)}"
        )

    model_summary = "No trained classification model active."
    if m_info.get("status") == "success":
        acc = m_info.get("accuracy")
        acc_s = f"{(acc*100):.2f}%" if acc is not None else "N/A"
        f1 = m_info.get("macro_f1", 0.0)
        model_summary = (
            f"Active Model: {m_info.get('model_name')} ({m_info.get('model_type')}) | "
            f"Holdout Accuracy: {acc_s} | Macro F1-Score: {f1:.4f} | "
            f"Test Samples: {m_info.get('total_test_samples')} | "
            f"Classes: {', '.join(m_info.get('classes', []))}"
        )

    anomaly_summary = "Anomaly detector not yet evaluated."
    if getattr(app_state, "anomaly_detector", None) is not None:
        anom_res = tools.get_anomaly_summary_and_top_records(app_state, limit=3)
        if anom_res.get("status") == "success":
            anomaly_summary = (
                f"Isolation Forest Detector: Evaluated {anom_res.get('total_records', 0):,} flows. "
                f"Flagged Anomalies: {anom_res.get('flagged_count', 0)} ({anom_res.get('flagged_percentage', 0.0):.1f}%) "
                f"at threshold {anom_res.get('threshold_used')}."
            )

    record_context = "None selected."
    if selected_record:
        record_context = f"Selected Record Sample Attributes: {json.dumps({k: v for k, v in list(selected_record.items())[:6]})}"

    notes_section = f"\nRECENT AUTOMATED ACTION EXECUTION:\n{tool_action_notes}" if tool_action_notes else ""

    return f"""You are NetSage AI Copilot, a senior Network Behaviour Intelligence and Defensive Cybersecurity Data Analyst.
Your mission is to assist security analysts, network engineers, and data science students in exploring IoT telemetry flows, detecting anomalous events, understanding supervised and unsupervised machine learning decisions, and triaging threats.

CORE BEHAVIORAL DIRECTIVES:
1. Ground every claim directly in the live telemetry and system state provided below. Never fabricate dataset figures, attack labels, or detection metrics.
2. If data is not yet loaded or evaluated, state so transparently and provide actionable guidance on what steps to take inside the platform.
3. Be professional, lucid, and insightful. Keep explanations concise by default, and provide rigorous technical depth whenever requested.
4. Adhere strictly to defensive security analysis: focus on root cause identification, behavioural telemetry indicators, and mitigation recommendations.
5. Emphasize explainability: explain features that influence model predictions (e.g. packet frequencies, inter-arrival times, TCP flags, duration).

CURRENT ACTIVE NETSAGE TELEMETRY & SYSTEM STATE:
- Telemetry Dataset: {dataset_summary}
- Classification Pipeline: {model_summary}
- Unsupervised Outlier Profiling: {anomaly_summary}
- Selected Flow Telemetry: {record_context}
{notes_section}
"""


def process_copilot_turn(
    user_query: str,
    conversation_id: Optional[str] = None,
    context_type: str = "general",
    selected_record: Optional[dict[str, Any]] = None,
    context_data: Optional[dict[str, Any]] = None,
    app_state: Any = None,
    user_id: str = "guest",
) -> dict[str, Any]:
    """
    Execute a conversational intelligence turn. Preserves multi-turn state, invokes real tools,
    interfaces with Gemini LLM with grounded telemetry context, and gracefully falls back to deterministic analysis.
    """
    conv = get_or_create_conversation(conversation_id, user_id=user_id)
    cid = conv["conversation_id"]
    ctx_state = conv["context_state"]

    if selected_record:
        ctx_state["selected_record"] = selected_record
    if context_data and "record" in context_data:
        ctx_state["selected_record"] = context_data["record"]

    # Record user message in history
    now_str = datetime.datetime.now(datetime.timezone.utc).isoformat()
    conv["messages"].append({
        "id": f"msg_{uuid.uuid4().hex[:6]}",
        "sender": "user",
        "text": user_query,
        "timestamp": now_str,
    })
    conv["updated_at"] = now_str

    # Update conversation title if first user message
    if len(conv["messages"]) == 1:
        first_title = user_query.strip()
        if len(first_title) > 35:
            first_title = first_title[:32] + "..."
        conv["title"] = first_title

    q_lower = user_query.lower().strip()

    findings = []
    evidence_refs = []
    recommendations = []
    related_actions = []
    tool_action_notes = None

    # Fallback deterministic text templates
    fallback_reply = ""
    fallback_summary = ""

    # -------------------------------------------------------------
    # 1. Tool Intent Routing & Evidence Collection
    # -------------------------------------------------------------

    # A. "Generate a report" or "investigation"
    if any(k in q_lower for k in ["generate a report", "create report", "make report", "run report", "investigation report"]):
        inv_res = tools.trigger_investigation(app_state, title=f"Copilot Report - {conv['title']}")
        if inv_res.get("status") == "success":
            ctx_state["last_report_id"] = inv_res.get("report_id")
            tool_action_notes = (
                f"Multi-agent investigation completed successfully. Report ID: {inv_res.get('report_id')}, "
                f"Risk Rating: {inv_res.get('risk_rating')}, Analyzed Candidate Flows: {inv_res.get('candidate_count')}."
            )
            fallback_reply = (
                f"I've initiated and completed an autonomous 3-agent forensic investigation on your active telemetry. "
                f"The investigation analyzed {inv_res.get('candidate_count', 0)} candidate anomalous flows, "
                f"assessed the overall risk as **{inv_res.get('risk_rating', 'Medium').upper()}**, and compiled a verified audit report."
            )
            fallback_summary = f"Forensic investigation completed (Risk: {inv_res.get('risk_rating')}). Report ready for download."
            findings.append({
                "category": "Forensic Audit",
                "severity": inv_res.get("risk_rating", "medium").lower(),
                "title": f"Investigation #{inv_res.get('investigation_id')}",
                "description": f"Multi-agent correlation analyzed {inv_res.get('candidate_count', 0)} priority candidate flows.",
                "supporting_features": ["statistical_divergences", "protocol_mix"],
            })
            evidence_refs.extend([
                f"Investigation ID: {inv_res.get('investigation_id')}",
                f"Assessed Risk: {inv_res.get('risk_rating')}",
                f"Flagged Candidate Count: {inv_res.get('candidate_count')}",
            ])
            recommendations.append("Download the Markdown or JSON report for compliance archiving.")
            related_actions.append({
                "id": "view_report",
                "label": "Open Report in Audit View",
                "action_type": "navigate",
                "payload": {"tab": "reports", "report_id": inv_res.get("report_id")},
            })
        else:
            fallback_reply = f"Could not generate report: {inv_res.get('message')}"
            fallback_summary = "Report generation halted."
            recommendations.append("Ensure a dataset is loaded in Data Management first.")

    # B. "Explain the most unusual one" or follow-up on top anomaly
    elif any(k in q_lower for k in ["most unusual one", "top anomaly", "highest anomaly", "explain the most unusual", "worst anomaly", "top outlier"]):
        anom_res = tools.get_anomaly_summary_and_top_records(app_state, limit=1)
        if anom_res.get("status") == "success" and anom_res.get("top_outliers"):
            top = anom_res["top_outliers"][0]
            ctx_state["last_inspected_anomaly"] = top
            attrs = top.get("attributes", {})
            pkts = attrs.get("flow_pkts_per_sec", "N/A")
            syn = attrs.get("flow_SYN_flag_count", "N/A")
            proto = attrs.get("proto", "tcp")
            score = top.get("anomaly_score", 0.0)

            tool_action_notes = (
                f"Top structural outlier isolated: Flow #{top.get('index')} with score {score:.4f}. "
                f"Protocol: {proto}, Packets/sec: {pkts}, SYN flags: {syn}."
            )
            fallback_reply = (
                f"The most extreme structural outlier identified by our Isolation Forest is **Flow Record #{top.get('index')}** "
                f"with an anomaly score of **{score:.3f}** (threshold: {anom_res.get('threshold_used')}). "
                f"This flow communicates over **{proto}** and exhibited an atypical rate of **{pkts} pkts/s** and **{syn} SYN flags**."
            )
            fallback_summary = f"Top anomalous record #{top.get('index')} shows high packet rate and SYN flag saturation."
            findings.append({
                "category": "Structural Outlier",
                "severity": "critical" if score > 0.8 else "high",
                "title": f"Top Outlier Flow #{top.get('index')}",
                "description": f"Isolation path length is significantly shorter than normal traffic baseline.",
                "supporting_features": ["flow_pkts_per_sec", "flow_SYN_flag_count", "flow_iat.avg"],
            })
            evidence_refs.extend([
                f"Record Index: {top.get('index')}",
                f"Anomaly Score: {score:.4f}",
                f"Protocol: {proto}",
                f"Packet Frequency: {pkts}",
            ])
            recommendations.extend([
                "Inspect this flow in the Traffic Explorer to verify target destination.",
                "Compare its IAT distribution against benign IoT MQTT messages.",
            ])
            related_actions.append({
                "id": "inspect_in_traffic",
                "label": "Inspect in Traffic Explorer",
                "action_type": "navigate",
                "payload": {"tab": "traffic", "search": str(top.get("index"))},
            })
        else:
            fallback_reply = "No anomaly records found. Please ensure a dataset is loaded and anomaly scoring has been executed."
            fallback_summary = "No anomaly data available."

    # C. "Did our dataset contain any unusual records?" or general anomaly inquiry
    elif any(k in q_lower for k in ["unusual records", "contain any unusual", "any anomalies", "anomaly results", "what anomalies"]):
        anom_res = tools.get_anomaly_summary_and_top_records(app_state, limit=3)
        if anom_res.get("status") == "success":
            count = anom_res.get("flagged_count", 0)
            pct = anom_res.get("flagged_percentage", 0.0)
            tool_action_notes = f"Isolation forest evaluated {anom_res.get('total_records', 0)} flows. Flagged {count} ({pct:.2f}%)."
            fallback_reply = (
                f"Yes. Unsupervised Isolation Forest analysis evaluated {anom_res.get('total_records', 0):,} flows "
                f"and flagged **{count} records ({pct:.1f}%)** as structural anomalies using a cut-off threshold of {anom_res.get('threshold_used')}."
            )
            fallback_summary = f"Detected {count} anomalous flows ({pct:.1f}% of telemetry volume)."
            findings.append({
                "category": "Behavioral Anomaly",
                "severity": "high" if count > 50 else "medium",
                "title": "Unsupervised Outlier Detection",
                "description": f"{count} flows deviate substantially from typical temporal and packet size distributions.",
                "supporting_features": ["flow_duration", "flow_pkts_per_sec"],
            })
            evidence_refs.extend([
                f"Flagged Anomalies: {count} flows",
                f"Anomaly Percentage: {pct:.2f}%",
                f"Detection Threshold: {anom_res.get('threshold_used')}",
            ])
            recommendations.append("Ask 'Explain the most unusual one' to inspect the top-ranked threat flow.")
            related_actions.append({
                "id": "view_anomalies",
                "label": "View Anomaly Analysis",
                "action_type": "navigate",
                "payload": {"tab": "anomaly"},
            })
        else:
            fallback_reply = f"Unable to check anomalies: {anom_res.get('message')}"
            fallback_summary = "Anomaly query failed."

    # D. "Analyze my current dataset" or dataset summary
    elif any(k in q_lower for k in ["analyze my current dataset", "dataset summary", "summarize dataset", "dataset overview", "describe dataset"]):
        meta = tools.get_dataset_metadata(app_state)
        dist = tools.get_class_distributions(app_state)
        if meta.get("status") == "success":
            top_classes = list(dist.get("distributions", {}).keys())[:4]
            fallback_reply = (
                f"Your active dataset **'{meta.get('dataset_name')}'** contains **{meta.get('total_records'):,} flows** "
                f"with **{len(meta.get('numeric_features'))} numeric** and **{len(meta.get('categorical_features'))} categorical features**. "
                f"It spans **{dist.get('total_classes')} traffic categories** including: {', '.join(top_classes)}. "
                f"Data quality audit found {meta.get('duplicate_rows')} duplicates and {meta.get('infinite_values')} infinite values."
            )
            fallback_summary = f"Dataset '{meta.get('dataset_name')}' loaded with {meta.get('total_records')} flows across {dist.get('total_classes')} categories."
            findings.append({
                "category": "Dataset Audit",
                "severity": "info",
                "title": "Data Hygiene Verification",
                "description": f"Total flows: {meta.get('total_records')}, duplicate rate: {meta.get('duplicate_percentage')}%.",
                "supporting_features": ["duplicate_rows", "infinite_values"],
            })
            evidence_refs.extend([
                f"Dataset: {meta.get('dataset_name')}",
                f"Record Count: {meta.get('total_records')}",
                f"Categories: {dist.get('total_classes')}",
            ])
            recommendations.append("Proceed to Model Lab to train an explainable classifier.")
            related_actions.append({
                "id": "view_explorer",
                "label": "Explore Flow Records",
                "action_type": "navigate",
                "payload": {"tab": "traffic"},
            })
        else:
            fallback_reply = "No dataset is currently loaded. Click 'Load UCI RT-IoT2022 Fixture' on the Overview page to get started."
            fallback_summary = "No active dataset."

    # E. "Explain the model's performance" or model evaluation
    elif any(k in q_lower for k in ["model's performance", "model performance", "explain the model", "how accurate", "evaluate model"]):
        m_info = tools.get_model_status_and_metrics(app_state)
        if m_info.get("status") == "success":
            acc_val = m_info.get("accuracy")
            acc_str = f"{(acc_val * 100):.2f}%" if acc_val is not None else "N/A"
            f1_str = f"{m_info.get('macro_f1', 0.0):.4f}"
            fallback_reply = (
                f"The active model is **{m_info.get('model_name')}** ({m_info.get('model_type')}). "
                f"On the held-out test split ({m_info.get('total_test_samples')} flows), it achieved an overall accuracy of **{acc_str}** "
                f"and an unweighted **Macro F1-Score of {f1_str}** across {len(m_info.get('classes', []))} traffic categories."
            )
            fallback_summary = f"Active classifier exhibits {acc_str} holdout accuracy and {f1_str} Macro-F1."
            findings.append({
                "category": "Model Performance",
                "severity": "info",
                "title": "Holdout Test Benchmark",
                "description": f"Evaluated with stratified holdout partitioning and zero-division metric safeguards.",
                "supporting_features": ["accuracy", "macro_f1", "weighted_f1"],
            })
            evidence_refs.extend([
                f"Model: {m_info.get('model_name')}",
                f"Holdout Accuracy: {acc_str}",
                f"Macro F1: {f1_str}",
            ])
            recommendations.append("Inspect the per-class confusion matrix in the Model Lab.")
            related_actions.append({
                "id": "view_model_lab",
                "label": "Open Model Lab",
                "action_type": "navigate",
                "payload": {"tab": "model_lab"},
            })
        else:
            fallback_reply = "No trained model is currently active. Go to the Model Lab to train Random Forest or XGBoost."
            fallback_summary = "No model active."
            related_actions.append({
                "id": "train_model",
                "label": "Train Model in Model Lab",
                "action_type": "navigate",
                "payload": {"tab": "model_lab"},
            })

    # F. "Compare traffic categories"
    elif any(k in q_lower for k in ["compare traffic", "traffic categories", "classes in dataset", "categories"]):
        dist = tools.get_class_distributions(app_state)
        if dist.get("status") == "success":
            items = list(dist.get("distributions", {}).items())
            sorted_items = sorted(items, key=lambda x: x[1].get("count", 0), reverse=True)
            top_3 = sorted_items[:3]
            least_3 = sorted_items[-2:] if len(sorted_items) >= 2 else sorted_items
            top_desc = ", ".join([f"{k} ({v.get('count')} flows, {v.get('percentage')}%)" for k, v in top_3])
            least_desc = f"{least_3[0][0]}" if least_3 else "none"
            fallback_reply = (
                f"The dataset encompasses {len(items)} distinct categories. The most prevalent traffic types are: "
                f"**{top_desc}**. The minority classes highlight natural multi-class imbalance common in real IoT testbeds."
            )
            fallback_summary = f"Multi-class composition analyzed across {len(items)} categories."
            findings.append({
                "category": "Traffic Distribution",
                "severity": "info",
                "title": "Class Imbalance Profile",
                "description": "Identified predominant high-volume classes and minority attack variants.",
                "supporting_features": ["target_distribution"],
            })
            evidence_refs.extend([f"Total categories: {len(items)}"] + [f"{k}: {v.get('count')}" for k, v in top_3])
            recommendations.append("Filter flows in Traffic Explorer to inspect individual classes.")
        else:
            fallback_reply = "No dataset is currently loaded."
            fallback_summary = "Dataset required."

    # G. Specific record explanation / "Why did the model flag this record?"
    elif ctx_state.get("selected_record") or any(k in q_lower for k in ["why did the model flag", "why this prediction", "explain this record", "explain this anomaly"]):
        rec = ctx_state.get("selected_record") or {}
        exp_res = tools.explain_specific_record(app_state, rec)
        if exp_res.get("status") == "success":
            pred_cls = exp_res.get("predicted_class")
            conf = exp_res.get("confidence")
            conf_str = f" ({conf*100:.1f}% confidence)" if conf else ""
            fallback_reply = (
                f"Model inference categorized this flow as **{pred_cls}**{conf_str}. "
                f"{exp_res.get('narrative_summary')}"
            )
            fallback_summary = f"Flow attributed to {pred_cls} based on top continuous drivers."
            findings.append({
                "category": "Local Explainability",
                "severity": "high" if "dos" in str(pred_cls).lower() or "scan" in str(pred_cls).lower() else "low",
                "title": f"Feature Contribution for {pred_cls}",
                "description": exp_res.get("narrative_summary", "Primary drivers computed."),
                "supporting_features": [d["feature"] for d in exp_res.get("top_drivers", [])[:3]],
            })
            evidence_refs.extend([
                f"Predicted Class: {pred_cls}",
                f"Confidence: {conf_str}",
            ] + [f"{d['feature']}: {d['original_value']} (impact: {d['impact']})" for d in exp_res.get("top_drivers", [])[:3]])
            recommendations.append("Inspect this flow's full waterfall breakdown in the Explainable AI Lab.")
            related_actions.append({
                "id": "view_xai",
                "label": "Open Explainability Lab",
                "action_type": "navigate",
                "payload": {"tab": "explainability"},
            })
        else:
            fallback_reply = f"Could not explain record: {exp_res.get('message')}. Select a record in Traffic Explorer first."
            fallback_summary = "Record explanation unavailable."

    # H. General question
    else:
        meta = tools.get_dataset_metadata(app_state)
        ds_name = meta.get("dataset_name", "None loaded")
        flows_cnt = meta.get("total_records", 0)
        fallback_reply = (
            f"NetSage AI Copilot standing by. I am actively grounded in your active telemetry "
            f"(Dataset: **{ds_name}**, {flows_cnt:,} flows). "
            f"You can ask me to analyze anomalies, explain model predictions, inspect feature contributions, "
            f"or generate multi-agent forensic audit reports."
        )
        fallback_summary = "Conversational Copilot standing by with grounded context."
        evidence_refs.append(f"Active Telemetry Context: {ds_name} ({flows_cnt:,} flows)")
        recommendations.extend([
            "Ask: 'Analyze my current dataset'",
            "Ask: 'Did our dataset contain any unusual records?'",
            "Ask: 'Generate a report'",
        ])

    # -------------------------------------------------------------
    # 2. Invoke Google Gemini LLM with Multi-turn History & Telemetry Grounding
    # -------------------------------------------------------------
    system_prompt = build_system_prompt_and_context(
        app_state=app_state,
        selected_record=ctx_state.get("selected_record"),
        tool_action_notes=tool_action_notes,
    )

    # Format multi-turn conversation history for Gemini
    gemini_contents: list[dict[str, Any]] = []
    # Take the last 8 messages
    history_slice = conv["messages"][-8:]
    for m in history_slice:
        role = "user" if m.get("sender") == "user" else "model"
        text = (m.get("text") or "").strip()
        if not text:
            continue
        if gemini_contents and gemini_contents[-1]["role"] == role:
            gemini_contents[-1]["parts"][0]["text"] += f"\n\n{text}"
        else:
            gemini_contents.append({"role": role, "parts": [{"text": text}]})

    # Ensure conversation starts with user
    while gemini_contents and gemini_contents[0]["role"] != "user":
        gemini_contents.pop(0)

    if not gemini_contents:
        gemini_contents = [{"role": "user", "parts": [{"text": user_query}]}]

    # Call Gemini model with automatic resiliency fallback across available models
    gemini_response, model_used = call_gemini_api(system_prompt, gemini_contents)

    if gemini_response and isinstance(gemini_response, str):
        final_reply = gemini_response
        sentences = [s.strip() for s in gemini_response.split(".") if s.strip()]
        final_summary = (sentences[0] + ".") if sentences else gemini_response[:100]
        if len(final_summary) > 120:
            final_summary = final_summary[:117] + "..."
        is_fallback = False
        provider_name = f"Google Gemini ({model_used or settings.LLM_MODEL})"
    else:
        final_reply = fallback_reply
        final_summary = fallback_summary
        is_fallback = True
        provider_name = "NetSage Grounded Intelligence Engine (Deterministic Fallback)"

    response_dict = {
        "conversation_id": cid,
        "reply": final_reply,
        "summary": final_summary,
        "findings": findings,
        "evidence_references": evidence_refs,
        "uncertainty_notes": (
            "NOTICE: NetSage Copilot analyses are data-grounded assessments conditioned on active telemetry and fitted models. "
            "Anomaly scores reflect tree isolation path lengths, not absolute attack certainty."
        ),
        "recommendations": recommendations,
        "related_actions": related_actions,
        "is_rule_based_fallback": is_fallback,
        "provider": provider_name,
    }

    # Record assistant message in conversation and persist
    conv["messages"].append({
        "id": f"msg_{uuid.uuid4().hex[:6]}",
        "sender": "copilot",
        "text": final_reply,
        "timestamp": datetime.datetime.now(datetime.timezone.utc).isoformat(),
        "data": response_dict,
    })
    _persist_conversation(conv)

    return response_dict
