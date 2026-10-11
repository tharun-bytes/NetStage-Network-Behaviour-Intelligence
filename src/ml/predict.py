from typing import Any, Optional
import numpy as np
import pandas as pd
from sklearn.pipeline import Pipeline
from src.data.validation import check_inference_schema_compatibility

class PredictionError(Exception):
    """Raised when prediction input validation fails."""
    pass

def predict_network_flows(
    pipeline: Pipeline,
    metadata: dict[str, Any],
    input_df: pd.DataFrame
) -> dict[str, Any]:
    """
    Execute model inference over input records after verifying schema compatibility.
    """
    expected_features = metadata.get("features", [])
    is_compatible, missing_features, extra_features = check_inference_schema_compatibility(
        input_df, expected_features
    )

    if not is_compatible:
        raise PredictionError(
            f"Input dataset is missing mandatory features: {missing_features}. Model requires: {expected_features[:5]}..."
        )

    # Reorder columns to match expected training schema
    X_inference = input_df[expected_features].copy()

    # Raw predictions
    raw_preds = pipeline.predict(X_inference)
    inv_mapping = metadata.get("inv_label_mapping")

    if inv_mapping:
        predictions = [inv_mapping.get(p, str(p)) for p in raw_preds]
    else:
        predictions = [str(p) for p in raw_preds]

    # Probabilities if available
    probabilities = None
    classes = metadata.get("classes", [])
    classifier = pipeline.named_steps.get("classifier")
    
    if hasattr(classifier, "predict_proba"):
        try:
            probs = pipeline.predict_proba(X_inference)
            # Round for cleanliness
            probabilities = np.round(probs, 4).tolist()
        except Exception:
            probabilities = None

    # Compute prediction counts
    pred_series = pd.Series(predictions)
    counts_summary = pred_series.value_counts().to_dict()

    # Create detailed record outputs
    records = []
    for i, pred in enumerate(predictions):
        top_prob = None
        prob_dict = {}
        if probabilities and i < len(probabilities):
            row_probs = probabilities[i]
            if len(row_probs) == len(classes):
                prob_dict = {cls: round(float(row_probs[c_idx]), 4) for c_idx, cls in enumerate(classes)}
                top_prob = round(float(max(row_probs)), 4)

        records.append({
            "index": i,
            "predicted_class": pred,
            "confidence": top_prob,
            "class_probabilities": prob_dict,
        })

    return {
        "total_records": len(input_df),
        "predictions_summary": counts_summary,
        "classes": classes,
        "records": records,
        "missing_features": missing_features,
        "extra_features": extra_features,
    }
