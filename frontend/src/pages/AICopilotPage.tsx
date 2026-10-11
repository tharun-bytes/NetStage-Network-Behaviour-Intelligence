import React, { useState } from "react";
import {
  AlertTriangle,
  Bot,
  BrainCircuit,
  CheckCircle2,
  ChevronRight,
  Info,
  Lightbulb,
  MessageSquare,
  Send,
  ShieldAlert,
  Sparkles,
  Terminal,
} from "lucide-react";
import { api } from "../api/client";
import { useApp } from "../context/AppContext";
import { CopilotChatResponse, CopilotFinding } from "../types";

const SUGGESTED_PROMPTS = [
  "Summarize dataset traffic distribution and identify highest risk categories.",
  "What anomalies are most prevalent and what flow features drive them?",
  "How accurate is the active classifier on DDoS and brute-force attacks?",
  "Recommend defensive network hardening steps based on current flow patterns.",
];

export const AICopilotPage: React.FC<{ onNavigate?: (tab: string) => void }> = ({ onNavigate }) => {
  const { profile, activeModelDetail } = useApp();
  const [messages, setMessages] = useState<
    Array<{
      sender: "user" | "copilot";
      text: string;
      data?: CopilotChatResponse;
      timestamp: string;
    }>
  >([
    {
      sender: "copilot",
      text: "NetSage AI Security Copilot ready. I provide explainable analysis across your IoT flow records, anomaly scores, and model classifications. What would you like to investigate?",
      timestamp: new Date().toLocaleTimeString(),
    },
  ]);
  const [inputMessage, setInputMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [selectedContext, setSelectedContext] = useState<"general" | "anomalies" | "models">("general");

  const handleSend = async (msgToSend?: string) => {
    const text = (msgToSend || inputMessage).trim();
    if (!text || loading) return;

    const userEntry = {
      sender: "user" as const,
      text,
      timestamp: new Date().toLocaleTimeString(),
    };
    setMessages((prev) => [...prev, userEntry]);
    if (!msgToSend) setInputMessage("");
    setLoading(true);

    try {
      const response = await api.chatWithCopilot(text, selectedContext);
      setMessages((prev) => [
        ...prev,
        {
          sender: "copilot",
          text: response.reply,
          data: response,
          timestamp: new Date().toLocaleTimeString(),
        },
      ]);
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        {
          sender: "copilot",
          text: `Analysis error: ${err.message || "Failed to reach security copilot engine."}`,
          timestamp: new Date().toLocaleTimeString(),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const getSeverityBadge = (severity: string) => {
    switch (severity.toLowerCase()) {
      case "critical":
        return "bg-rose-950/80 text-rose-300 border-rose-800";
      case "high":
        return "bg-amber-950/80 text-amber-300 border-amber-800";
      case "medium":
        return "bg-yellow-950/80 text-yellow-300 border-yellow-800";
      default:
        return "bg-cyan-950/80 text-cyan-300 border-cyan-800";
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-xl border border-slate-800 bg-[#111827] p-6 shadow-sm">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-xl border border-indigo-700/60 shadow-lg shadow-indigo-950/50">
              <img
                src="/assets/netsage/ai-analysis-core.jpg"
                alt="AI Analysis Core"
                className="h-full w-full object-cover"
              />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-white tracking-tight">AI Security Copilot</h2>
                <span className="inline-flex items-center gap-1 rounded bg-indigo-950/90 px-2 py-0.5 text-[10px] font-mono font-medium text-indigo-300 border border-indigo-800/60">
                  <Sparkles className="h-3 w-3" /> Grounded In Telemetry
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Explainable conversational intelligence powered by multi-class classifiers, Isolation Forest anomalies, and statistical baselines.
              </p>
            </div>
          </div>

          {/* Context Selector */}
          <div className="flex items-center gap-1.5 rounded-lg border border-slate-800 bg-slate-900/90 p-1 text-xs">
            {(["general", "anomalies", "models"] as const).map((ctx) => (
              <button
                key={ctx}
                onClick={() => setSelectedContext(ctx)}
                className={`rounded px-2.5 py-1 font-medium capitalize transition-all ${
                  selectedContext === ctx
                    ? "bg-cyan-950 text-cyan-300 border border-cyan-800/80 shadow-sm"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                {ctx}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Chat & Evidence Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chat History & Input Column (2 cols) */}
        <div className="lg:col-span-2 flex flex-col h-[650px] rounded-xl border border-slate-800/90 bg-[#0d121f] overflow-hidden shadow-md">
          {/* Messages Scroll Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((m, idx) => (
              <div
                key={idx}
                className={`flex gap-3 text-xs leading-relaxed ${
                  m.sender === "user" ? "justify-end" : "justify-start"
                }`}
              >
                {m.sender === "copilot" && (
                  <div className="h-7 w-7 rounded-lg bg-indigo-950 border border-indigo-800/60 flex items-center justify-center text-indigo-400 shrink-0">
                    <Bot className="h-4 w-4" />
                  </div>
                )}

                <div
                  className={`max-w-[85%] rounded-xl p-3.5 shadow-sm space-y-2.5 ${
                    m.sender === "user"
                      ? "bg-cyan-950/80 border border-cyan-800/70 text-cyan-50"
                      : "bg-[#131b2e] border border-slate-800 text-slate-200"
                  }`}
                >
                  <div className="flex items-center justify-between gap-3 text-[10px] text-slate-400">
                    <span className="font-semibold text-slate-300">
                      {m.sender === "user" ? "Security Analyst" : "NetSage Copilot"}
                    </span>
                    <span className="font-mono">{m.timestamp}</span>
                  </div>

                  <p className="whitespace-pre-wrap">{m.text}</p>

                  {/* If Copilot Structured Output is attached */}
                  {m.data && (
                    <div className="space-y-3 pt-2 border-t border-slate-800/80">
                      {/* Findings list */}
                      {m.data.findings && m.data.findings.length > 0 && (
                        <div className="space-y-1.5">
                          <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block">
                            Key Telemetry Findings
                          </span>
                          {m.data.findings.map((f: CopilotFinding, fi: number) => (
                            <div
                              key={fi}
                              className="rounded-lg bg-slate-900/90 border border-slate-800 p-2.5 space-y-1 text-xs"
                            >
                              <div className="flex items-center justify-between">
                                <span className="font-semibold text-slate-200">{f.title}</span>
                                <span
                                  className={`rounded px-1.5 py-0.5 text-[9px] font-mono border ${getSeverityBadge(
                                    f.severity
                                  )}`}
                                >
                                  {f.severity.toUpperCase()}
                                </span>
                              </div>
                              <p className="text-[11px] text-slate-400 leading-relaxed">{f.description}</p>
                              {f.supporting_features.length > 0 && (
                                <div className="flex flex-wrap gap-1 pt-1">
                                  {f.supporting_features.map((feat, feati) => (
                                    <span
                                      key={feati}
                                      className="rounded bg-slate-800/80 px-1.5 py-0.5 font-mono text-[9px] text-slate-300 border border-slate-700/60"
                                    >
                                      {feat}
                                    </span>
                                  ))}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Evidence References */}
                      {m.data.evidence_references && m.data.evidence_references.length > 0 && (
                        <div className="rounded-lg bg-slate-900/60 border border-slate-800/70 p-2 text-[11px]">
                          <span className="text-[10px] font-mono text-slate-400 block mb-1">
                            Evidence Grounding:
                          </span>
                          <ul className="list-disc list-inside text-slate-400 space-y-0.5">
                            {m.data.evidence_references.map((ev, evi) => (
                              <li key={evi} className="font-mono text-[10px] text-cyan-300">
                                {ev}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Recommended Actions */}
                      {m.data.recommendations && m.data.recommendations.length > 0 && (
                        <div className="rounded-lg bg-emerald-950/30 border border-emerald-900/50 p-2 text-[11px]">
                          <span className="text-[10px] font-mono text-emerald-400 flex items-center gap-1 mb-1">
                            <Lightbulb className="h-3 w-3" /> Recommended Actions:
                          </span>
                          <ul className="list-disc list-inside text-slate-300 space-y-0.5">
                            {m.data.recommendations.map((rec, reci) => (
                              <li key={reci} className="text-slate-300">
                                {rec}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Engine Tag */}
                      <div className="flex items-center justify-between text-[9px] font-mono text-slate-500 pt-1">
                        <span>Engine: {m.data.provider}</span>
                        <span>Zero Hallucination Grounding</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex gap-3 text-xs leading-relaxed justify-start">
                <div className="h-7 w-7 rounded-lg bg-indigo-950 border border-indigo-800/60 flex items-center justify-center text-indigo-400 shrink-0 animate-pulse">
                  <Bot className="h-4 w-4" />
                </div>
                <div className="rounded-xl p-3.5 bg-[#131b2e] border border-slate-800 text-slate-400 space-y-1">
                  <span className="inline-flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-cyan-400 animate-ping" />
                    Synthesizing network telemetry and running inference...
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Quick Prompts Drawer */}
          <div className="border-t border-slate-800 bg-[#0c101c] p-2.5">
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
              {SUGGESTED_PROMPTS.map((prompt, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSend(prompt)}
                  disabled={loading}
                  className="shrink-0 rounded-lg border border-slate-800 bg-slate-900/80 px-2.5 py-1 text-[11px] text-slate-300 hover:border-cyan-800 hover:text-cyan-300 transition-colors disabled:opacity-50"
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>

          {/* Input Box */}
          <div className="border-t border-slate-800 bg-[#111827] p-3 flex items-center gap-2">
            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSend()}
              placeholder="Ask NetSage Copilot about attack classes, anomalous flows, or feature importance..."
              className="flex-1 rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-white placeholder-slate-500 focus:border-cyan-500 focus:outline-none"
              disabled={loading}
            />
            <button
              onClick={() => handleSend()}
              disabled={loading || !inputMessage.trim()}
              className="inline-flex items-center justify-center rounded-lg bg-cyan-600 px-4 py-2 text-xs font-semibold text-white shadow-md hover:bg-cyan-500 transition-all disabled:opacity-50"
            >
              <Send className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        {/* Telemetry Context Dossier (1 col) */}
        <div className="space-y-4">
          {/* Active Dataset Status */}
          <div className="rounded-xl border border-slate-800 bg-[#111827] p-4 space-y-3">
            <h3 className="text-xs font-semibold text-white uppercase tracking-wider flex items-center gap-1.5 font-mono">
              <Terminal className="h-3.5 w-3.5 text-cyan-400" /> Grounding Context
            </h3>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between items-center py-1 border-b border-slate-800">
                <span className="text-slate-400">Dataset</span>
                <span className="font-mono text-slate-200">
                  {profile ? profile.source_name : "None Loaded"}
                </span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-slate-800">
                <span className="text-slate-400">Flow Count</span>
                <span className="font-mono text-cyan-300">
                  {profile ? profile.rows_count.toLocaleString() : "0"}
                </span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-slate-800">
                <span className="text-slate-400">Active Model</span>
                <span className="font-mono text-emerald-400">
                  {activeModelDetail ? activeModelDetail.metadata.model_name : "None"}
                </span>
              </div>
              <div className="flex justify-between items-center py-1">
                <span className="text-slate-400">Accuracy</span>
                <span className="font-mono text-slate-200">
                  {activeModelDetail
                    ? `${(activeModelDetail.metrics.accuracy * 100).toFixed(1)}%`
                    : "N/A"}
                </span>
              </div>
            </div>

            {onNavigate && (
              <button
                onClick={() => onNavigate("agents")}
                className="w-full mt-2 inline-flex items-center justify-center gap-1.5 rounded-lg border border-indigo-800/80 bg-indigo-950/60 px-3 py-2 text-xs font-semibold text-indigo-300 hover:bg-indigo-900/60 transition-colors"
              >
                Launch Multi-Agent Investigation <ChevronRight className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          {/* Model Safety & Interpretability Guidelines */}
          <div className="rounded-xl border border-slate-800 bg-[#111827] p-4 space-y-2.5 text-xs">
            <h4 className="font-semibold text-white flex items-center gap-1.5">
              <ShieldAlert className="h-4 w-4 text-amber-400" /> Defensive Protocol Guard
            </h4>
            <p className="text-slate-400 leading-relaxed text-[11px]">
              NetSage copilot synthesizes passive statistical patterns and supervised models. It does not execute commands, packet injection, or intrusive scans.
            </p>
            <div className="rounded bg-slate-900 p-2 text-[10px] text-slate-400 border border-slate-800 font-mono">
              Confidence scores are derived from empirical classifier probabilities and Isolation Forest outlier margins.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
