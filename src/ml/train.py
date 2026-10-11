import time
from typing import Any, Optional
import numpy as np
import pandas as pd
from sklearn.dummy import DummyClassifier
from sklearn.ensemble import RandomForestClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.model_selection import StratifiedKFold, cross_val_score, train_test_split
from sklearn.pipeline import Pipeline

from src.data.preprocessing import (
    build_feature_preprocessor,
    prepare_train_features_and_target,
)
from src.ml.metrics import compute_classification_metrics

# Optional XGBoost import
try:
    from xgboost import XGBClassifier
    XGBOOST_AVAILABLE = True
except ImportError:
    XGBOOST_AVAILABLE = False

SUPPORTED_MODELS = ["dummy", "logistic_regression", "random_forest", "xgboost"]

def get_classifier_estimator(model_type: str, random_state: int = 42) -> tuple[Any, bool]:
    """
    Return estimator instance and a boolean indicating whether numeric scaling is required.
    """
    if model_type == "dummy":
        return DummyClassifier(strategy="most_frequent"), False
    elif model_type == "logistic_regression":
        return LogisticRegression(
            max_iter=1000,
            C=1.0,
            multi_class="multinomial",
            solver="lbfgs",
            random_state=random_state
        ), True
    elif model_type == "random_forest":
        return RandomForestClassifier(
            n_estimators=120,
            max_depth=16,
            min_samples_split=4,
            random_state=random_state,
            n_jobs=-1
        ), False
    elif model_type == "xgboost":
        if not XGBOOST_AVAILABLE:
            raise ValueError("XGBoost is not installed in the current environment.")
        return XGBClassifier(
            n_estimators=100,
            max_depth=6,
            learning_rate=0.1,
            eval_metric="mlogloss",
            random_state=random_state,
            n_jobs=-1
        ), False
    else:
        raise ValueError(f"Unsupported model type '{model_type}'. Choose from {SUPPORTED_MODELS}.")

def train_classification_model(
    df: pd.DataFrame,
    model_type: str = "random_forest",
    target_column: str = "Attack_type",
    test_size: float = 0.2,
    random_state: int = 42,
    run_cv: bool = True
) -> dict[str, Any]:
    """
    Train a complete scikit-learn Pipeline with strict holdout splitting,
    optional cross-validation, and holdout test metrics evaluation.
    """
    start_train_time = time.time()

    # 1. Prepare features and target
    X, y, num_features, cat_features = prepare_train_features_and_target(
        df, target_column=target_column
    )
    classes = sorted(list(y.unique()))
    
    # 2. Stratified train/test split
    # Check if any class has fewer than 2 instances for stratification
    class_counts = y.value_counts()
    min_count = class_counts.min()
    stratify = y if min_count >= 2 else None

    X_train, X_test, y_train, y_test = train_test_split(
        X, y,
        test_size=test_size,
        random_state=random_state,
        stratify=stratify
    )

    # 3. Build Model Pipeline
    estimator, scale_numeric = get_classifier_estimator(model_type, random_state=random_state)
    preprocessor = build_feature_preprocessor(
        numeric_features=num_features,
        categorical_features=cat_features,
        scale_numeric=scale_numeric,
        scaler_type="standard"
    )

    # Note: For XGBoost with string labels, we map labels internally or use LabelEncoder
    label_mapping = {cls_name: i for i, cls_name in enumerate(classes)}
    inv_label_mapping = {i: cls_name for i, cls_name in enumerate(classes)}
    
    if model_type == "xgboost":
        y_train_encoded = y_train.map(label_mapping).values
        y_test_encoded = y_test.map(label_mapping).values
    else:
        y_train_encoded = y_train.values
        y_test_encoded = y_test.values

    pipeline = Pipeline(steps=[
        ("preprocessor", preprocessor),
        ("classifier", estimator)
    ])

    # 4. Optional Cross-Validation on Training Split Only
    cv_mean_f1 = None
    cv_std_f1 = None
    if run_cv and len(X_train) >= 30 and min_count >= 3:
        try:
            cv_splits = min(5, int(class_counts.min()))
            if cv_splits >= 2:
                skf = StratifiedKFold(n_splits=cv_splits, shuffle=True, random_state=random_state)
                cv_scores = cross_val_score(
                    pipeline, X_train, y_train_encoded, cv=skf, scoring="f1_weighted", n_jobs=-1
                )
                cv_mean_f1 = round(float(np.mean(cv_scores)), 4)
                cv_std_f1 = round(float(np.std(cv_scores)), 4)
        except Exception:
            cv_mean_f1 = None

    # 5. Fit Pipeline on full training set
    pipeline.fit(X_train, y_train_encoded)
    train_duration = round(time.time() - start_train_time, 3)

    # 6. Inference and Evaluation on Held-Out Test Set
    infer_start = time.time()
    y_test_pred_raw = pipeline.predict(X_test)
    inference_duration = round(time.time() - infer_start, 4)

    y_test_prob = None
    if hasattr(pipeline.named_steps["classifier"], "predict_proba"):
        try:
            y_test_prob = pipeline.predict_proba(X_test)
        except Exception:
            y_test_prob = None

    if model_type == "xgboost":
        # Convert numeric predictions back to original class strings
        y_test_pred = np.array([inv_label_mapping.get(p, str(p)) for p in y_test_pred_raw])
        y_test_eval = y_test.values
    else:
        y_test_pred = y_test_pred_raw
        y_test_eval = y_test.values

    metrics = compute_classification_metrics(
        y_true=y_test_eval,
        y_pred=y_test_pred,
        y_prob=y_test_prob,
        classes=classes
    )
    metrics["training_duration_seconds"] = train_duration
    metrics["inference_duration_seconds"] = inference_duration
    metrics["cv_weighted_f1_mean"] = cv_mean_f1
    metrics["cv_weighted_f1_std"] = cv_std_f1

    metadata = {
        "model_type": model_type,
        "model_name": {
            "dummy": "Baseline Dummy Classifier",
            "logistic_regression": "Multinomial Logistic Regression",
            "random_forest": "Random Forest Classifier",
            "xgboost": "XGBoost Gradient Boosted Trees",
        }.get(model_type, model_type),
        "target_column": target_column,
        "classes": classes,
        "features": list(X.columns),
        "numeric_features": num_features,
        "categorical_features": cat_features,
        "train_samples_count": len(X_train),
        "test_samples_count": len(X_test),
        "random_state": random_state,
        "test_size": test_size,
        "label_mapping": label_mapping if model_type == "xgboost" else None,
        "inv_label_mapping": inv_label_mapping if model_type == "xgboost" else None,
    }

    return {
        "pipeline": pipeline,
        "metadata": metadata,
        "metrics": metrics,
        "test_X_sample": X_test.head(10).to_dict(orient="records"),
    }
