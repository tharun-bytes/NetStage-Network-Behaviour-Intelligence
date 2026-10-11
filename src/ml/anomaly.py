from typing import Any, Optional
import numpy as np
import pandas as pd
from sklearn.ensemble import IsolationForest
from sklearn.pipeline import Pipeline
from src.data.preprocessing import build_feature_preprocessor, prepare_train_features_and_target

class AnomalyDetectionError(Exception):
    """Raised when anomaly detection fitting or evaluation fails."""
    pass

def train_isolation_forest_detector(
    df: pd.DataFrame,
    contamination: float = 0.05,
    random_state: int = 42,
    target_column: Optional[str] = "Attack_type"
) -> dict[str, Any]:
    """
    Train an unsupervised Isolation Forest model on flow features.
    Labels are STRICTLY removed prior to fitting.
    """
    if target_column and target_column in df.columns:
        X, _, num_features, cat_features = prepare_train_features_and_target(
            df, target_column=target_column
        )
    else:
        # Unlabelled dataset
        num_features = [c for c in df.columns if pd.api.types.is_numeric_dtype(df[c])]
        cat_features = [c for c in df.columns if c not in num_features]
        X = df.copy()

    preprocessor = build_feature_preprocessor(
        numeric_features=num_features,
        categorical_features=cat_features,
        scale_numeric=True,
        scaler_type="standard"
    )

    iso_forest = IsolationForest(
        n_estimators=100,
        contamination=contamination,
        random_state=random_state,
        n_jobs=-1
    )

    pipeline = Pipeline(steps=[
        ("preprocessor", preprocessor),
        ("detector", iso_forest)
    ])

    # Fit pipeline purely on unsupervised feature matrix
    pipeline.fit(X)

    metadata = {
        "model_type": "isolation_forest",
        "contamination": contamination,
        "features": list(X.columns),
        "numeric_features": num_features,
        "categorical_features": cat_features,
        "training_samples_count": len(X),
        "random_state": random_state,
    }

    return {
        "pipeline": pipeline,
        "metadata": metadata
    }

def detect_anomalies(
    pipeline: Pipeline,
    metadata: dict[str, Any],
    df: pd.DataFrame,
    custom_threshold: Optional[float] = None
) -> dict[str, Any]:
    """
    Run anomaly scoring on input flows.
    Computes normalized anomaly score (0.0 to 1.0, where higher indicates greater abnormality)
    and binary is_anomaly flag.
    """
    features = metadata.get("features", [])
    missing = [f for f in features if f not in df.columns]
    if missing:
        raise AnomalyDetectionError(f"Missing mandatory features for anomaly scoring: {missing[:5]}")

    X = df[features].copy()
    
    # decision_function yields raw scores: lower values mean more anomalous.
    # Typically ranges between -0.5 and +0.5.
    raw_decision_scores = pipeline.named_steps["detector"].decision_function(
        pipeline.named_steps["preprocessor"].transform(X)
    )
    
    # Invert and normalize to [0, 1] range:
    # 0 = very normal, 1 = severe anomaly
    # Using min-max normalization based on standard isolation forest bounds
    normalized_scores = np.clip(0.5 - (raw_decision_scores), 0.0, 1.0)
    
    # Threshold: default to where decision_function < 0 (i.e. normalized_score > 0.5)
    threshold = custom_threshold if custom_threshold is not None else 0.5
    is_anomaly = normalized_scores >= threshold

    flagged_count = int(np.sum(is_anomaly))
    flagged_percentage = round((flagged_count / len(df)) * 100, 2)

    # Score distribution histogram bins (0 to 1 in 10 bins)
    hist, bin_edges = np.histogram(normalized_scores, bins=10, range=(0.0, 1.0))
    score_distribution = []
    for i in range(len(hist)):
        score_distribution.append({
            "bin_range": f"{bin_edges[i]:.1f}-{bin_edges[i+1]:.1f}",
            "bin_min": round(float(bin_edges[i]), 2),
            "bin_max": round(float(bin_edges[i+1]), 2),
            "count": int(hist[i]),
        })

    # Compile flagged records with top contributing deviation features
    flagged_records = []
    for idx in range(len(df)):
        if is_anomaly[idx]:
            record_dict = df.iloc[idx].to_dict()
            # Clean non-serializable objects
            clean_record = {str(k): (float(v) if isinstance(v, (np.floating, float)) else str(v)) for k, v in record_dict.items()}
            flagged_records.append({
                "index": idx,
                "anomaly_score": round(float(normalized_scores[idx]), 4),
                "is_anomaly": True,
                "attributes": clean_record,
            })
            if len(flagged_records) >= 50:  # Cap at top 50 in response payload
                break

    # Feature comparison: Compare mean of flagged records vs non-flagged records for key metrics
    feature_comparisons = []
    num_cols = [c for c in ["flow_duration", "flow_pkts_per_sec", "flow_bytes_per_sec", "flow_SYN_flag_count", "flow_iat.avg"] if c in df.columns]
    
    for col in num_cols:
        all_vals = df[col].astype(float)
        anom_vals = df.loc[is_anomaly, col].astype(float) if flagged_count > 0 else []
        norm_vals = df.loc[~is_anomaly, col].astype(float) if (len(df) - flagged_count) > 0 else []
        
        feature_comparisons.append({
            "feature": col,
            "overall_mean": round(float(all_vals.mean()), 4) if len(all_vals) > 0 else 0.0,
            "anomalous_mean": round(float(np.mean(anom_vals)), 4) if len(anom_vals) > 0 else 0.0,
            "baseline_mean": round(float(np.mean(norm_vals)), 4) if len(norm_vals) > 0 else 0.0,
        })

    return {
        "total_records": len(df),
        "flagged_count": flagged_count,
        "flagged_percentage": flagged_percentage,
        "threshold": threshold,
        "score_distribution": score_distribution,
        "feature_comparisons": feature_comparisons,
        "flagged_records": flagged_records,
        "interpretation": (
            "Higher anomaly scores (closer to 1.0) signify structural deviation from learned baseline flow topology. "
            "Note: Anomaly flags reflect rare or unusual behavioural patterns and do not inherently confirm malicious intent."
        )
    }
