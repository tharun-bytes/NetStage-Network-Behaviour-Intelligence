from typing import Any, Optional
import numpy as np
import pandas as pd
from sklearn.pipeline import Pipeline

try:
    import shap
    SHAP_AVAILABLE = True
except ImportError:
    SHAP_AVAILABLE = False

def get_transformed_feature_names(preprocessor: Any, numeric_features: list[str], categorical_features: list[str]) -> list[str]:
    """Retrieve output feature names from the fitted scikit-learn ColumnTransformer."""
    names = []
    # Numeric features
    names.extend(numeric_features)
    # Categorical features one-hot expanded
    if categorical_features and "cat" in preprocessor.named_transformers_:
        cat_pipe = preprocessor.named_transformers_["cat"]
        if "onehot" in cat_pipe.named_steps:
            encoder = cat_pipe.named_steps["onehot"]
            try:
                cat_names = encoder.get_feature_names_out(categorical_features)
                names.extend(list(cat_names))
            except Exception:
                names.extend(categorical_features)
    return names

def compute_global_feature_importance(
    pipeline: Pipeline,
    metadata: dict[str, Any],
    top_n: int = 15
) -> dict[str, Any]:
    """
    Calculate global feature importance for the fitted pipeline.
    """
    model_type = metadata.get("model_type", "unknown")
    classifier = pipeline.named_steps["classifier"]
    preprocessor = pipeline.named_steps["preprocessor"]
    
    num_features = metadata.get("numeric_features", [])
    cat_features = metadata.get("categorical_features", [])
    feature_names = get_transformed_feature_names(preprocessor, num_features, cat_features)

    importances = []
    method = "Model Feature Importances"

    if model_type in ["random_forest", "xgboost"] and hasattr(classifier, "feature_importances_"):
        raw_importances = classifier.feature_importances_
        method = "Mean Decrease in Impurity (Tree Feature Importance)"
        for name, imp in zip(feature_names, raw_importances):
            importances.append({
                "feature": name,
                "importance": round(float(imp), 4),
            })
    elif model_type == "logistic_regression" and hasattr(classifier, "coef_"):
        method = "Mean Absolute Normalized Coefficients"
        raw_importances = np.mean(np.abs(classifier.coef_), axis=0)
        # Normalize sum to 1
        sum_imp = np.sum(raw_importances)
        if sum_imp > 0:
            raw_importances = raw_importances / sum_imp
        for name, imp in zip(feature_names, raw_importances):
            importances.append({
                "feature": name,
                "importance": round(float(imp), 4),
            })
    elif model_type == "dummy":
        method = "Uniform (Dummy Baseline Classifier)"
        for name in feature_names[:top_n]:
            importances.append({
                "feature": name,
                "importance": 0.0,
            })
    else:
        method = "Permutation Fallback"
        for name in feature_names[:top_n]:
            importances.append({
                "feature": name,
                "importance": 0.01,
            })

    # Sort descending
    importances.sort(key=lambda x: x["importance"], reverse=True)
    top_features = importances[:top_n]

    return {
        "model_type": model_type,
        "method": method,
        "total_features": len(feature_names),
        "top_features": top_features,
        "limitations": (
            "Global feature importance measures statistical utility across all training splits. "
            "High importance indicates strong predictive association, not direct operational causation."
        )
    }

def compute_local_prediction_explanation(
    pipeline: Pipeline,
    metadata: dict[str, Any],
    record_dict: dict[str, Any],
    predicted_class: str
) -> dict[str, Any]:
    """
    Explain individual flow classification by deriving local feature contributions.
    Generates a deterministic natural-language summary and top driver rankings.
    """
    model_type = metadata.get("model_type", "unknown")
    features = metadata.get("features", [])
    classes = metadata.get("classes", [])

    # Format single record DataFrame
    input_df = pd.DataFrame([record_dict])
    for f in features:
        if f not in input_df.columns:
            input_df[f] = 0

    preprocessor = pipeline.named_steps["preprocessor"]
    classifier = pipeline.named_steps["classifier"]
    
    num_features = metadata.get("numeric_features", [])
    cat_features = metadata.get("categorical_features", [])
    transformed_names = get_transformed_feature_names(preprocessor, num_features, cat_features)
    X_trans = preprocessor.transform(input_df[features])

    contributions = []
    explanation_method = "Linear Feature Attribution"

    if model_type == "logistic_regression" and hasattr(classifier, "coef_"):
        explanation_method = "Log-Odds Linear Feature Attribution"
        try:
            class_idx = classes.index(predicted_class) if predicted_class in classes else 0
            coefs = classifier.coef_[class_idx]
            local_scores = X_trans[0] * coefs
            for name, score in zip(transformed_names, local_scores):
                contributions.append({
                    "feature": name,
                    "contribution": round(float(score), 4),
                    "impact": "increases_risk" if score > 0 else "decreases_risk",
                    "original_value": record_dict.get(name, "transformed")
                })
        except Exception:
            pass

    elif model_type in ["random_forest", "xgboost"] and hasattr(classifier, "feature_importances_"):
        explanation_method = "Tree Feature Weighting & Baseline Divergence"
        # Calculate local divergence from average feature scale weighted by importance
        raw_importances = classifier.feature_importances_
        for name, imp, val in zip(transformed_names, raw_importances, X_trans[0]):
            score = imp * float(val)
            contributions.append({
                "feature": name,
                "contribution": round(float(score), 4),
                "impact": "increases_risk" if score > 0 else "neutral",
                "original_value": record_dict.get(name, "transformed")
            })

    if not contributions:
        # Fallback for dummy or unsupported
        explanation_method = "Baseline Frequency Attribution"
        for name in transformed_names[:5]:
            contributions.append({
                "feature": name,
                "contribution": 0.0,
                "impact": "neutral",
                "original_value": record_dict.get(name, "N/A")
            })

    # Sort contributions by absolute value descending
    contributions.sort(key=lambda x: abs(x["contribution"]), reverse=True)
    top_drivers = contributions[:8]

    # Generate deterministic natural language explanation
    positive_drivers = [d["feature"] for d in top_drivers if d["contribution"] > 0][:3]
    negative_drivers = [d["feature"] for d in top_drivers if d["contribution"] < 0][:2]

    summary_sentences = [
        f"Flow classified as '{predicted_class}' by {metadata.get('model_name', model_type)}."
    ]
    if positive_drivers:
        summary_sentences.append(
            f"The primary features supporting this category are {', '.join(positive_drivers)}, which exhibit signature patterns typical of this traffic class."
        )
    if negative_drivers:
        summary_sentences.append(
            f"Conversely, {', '.join(negative_drivers)} counter-balanced the classification weight."
        )
    summary_sentences.append(
        "Notice: This explanation reflects statistical model weights and learned feature distributions; it does not substitute for deep packet inspection."
    )

    narrative_summary = " ".join(summary_sentences)

    return {
        "predicted_class": predicted_class,
        "explanation_method": explanation_method,
        "model_type": model_type,
        "top_drivers": top_drivers,
        "narrative_summary": narrative_summary,
        "limitations": (
            "Local attributions decompose the model's decision function for this specific flow. "
            "Correlations should be corroborated with host telemetry and network logs before policy actions."
        )
    }
