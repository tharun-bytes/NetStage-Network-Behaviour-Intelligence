from typing import Optional
import numpy as np
import pandas as pd
from sklearn.base import BaseEstimator, TransformerMixin
from sklearn.compose import ColumnTransformer
from sklearn.impute import SimpleImputer
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import OneHotEncoder, RobustScaler, StandardScaler

EXCLUDE_DEFAULT_LEAKAGE = [
    "id", "flow_id", "src_ip", "dst_ip", "timestamp", "src_mac", "dst_mac",
    "Attack_type_label", "label", "Label"
]

class InfiniteValueCleaner(BaseEstimator, TransformerMixin):
    """Replaces +/- infinite numeric values with NaN before imputation."""
    def fit(self, X, y=None):
        return self

    def transform(self, X):
        X_out = np.array(X, copy=True)
        # Check if numeric
        if np.issubdtype(X_out.dtype, np.number):
            X_out[np.isinf(X_out)] = np.nan
        return X_out

def build_feature_preprocessor(
    numeric_features: list[str],
    categorical_features: list[str],
    scale_numeric: bool = True,
    scaler_type: str = "standard"
) -> ColumnTransformer:
    """
    Construct a reproducible scikit-learn ColumnTransformer for network flow features.
    
    Args:
        numeric_features: List of continuous / discrete flow metric column names.
        categorical_features: List of categorical flow column names (e.g. proto, service).
        scale_numeric: Whether to apply scaling (essential for Logistic Regression).
        scaler_type: 'standard' for StandardScaler, 'robust' for RobustScaler.
    """
    numeric_steps: list[tuple] = [
        ("clean_infs", InfiniteValueCleaner()),
        ("imputer", SimpleImputer(strategy="median")),
    ]
    if scale_numeric:
        scaler = RobustScaler() if scaler_type == "robust" else StandardScaler()
        numeric_steps.append(("scaler", scaler))

    numeric_pipeline = Pipeline(steps=numeric_steps)

    categorical_pipeline = Pipeline(steps=[
        ("imputer", SimpleImputer(strategy="most_frequent")),
        ("onehot", OneHotEncoder(handle_unknown="ignore", sparse_output=False)),
    ])

    transformers = []
    if numeric_features:
        transformers.append(("num", numeric_pipeline, numeric_features))
    if categorical_features:
        transformers.append(("cat", categorical_pipeline, categorical_features))

    preprocessor = ColumnTransformer(
        transformers=transformers,
        remainder="drop"
    )
    return preprocessor

def prepare_train_features_and_target(
    df: pd.DataFrame,
    target_column: str = "Attack_type",
    exclude_columns: Optional[list[str]] = None
) -> tuple[pd.DataFrame, pd.Series, list[str], list[str]]:
    """
    Separate feature matrix X and target y, filtering out leakage fields.
    Returns:
        X: Feature DataFrame
        y: Target Series
        numeric_features: names of numeric columns
        categorical_features: names of categorical columns
    """
    if target_column not in df.columns:
        raise ValueError(f"Target column '{target_column}' not found in DataFrame.")

    exclude = set(exclude_columns or EXCLUDE_DEFAULT_LEAKAGE)
    exclude.add(target_column)

    feature_cols = [c for c in df.columns if c not in exclude]
    X = df[feature_cols].copy()
    y = df[target_column].copy()

    # Drop rows where target is NaN
    valid_mask = ~y.isna()
    X = X[valid_mask]
    y = y[valid_mask]

    numeric_features = [c for c in X.columns if pd.api.types.is_numeric_dtype(X[c])]
    categorical_features = [c for c in X.columns if c not in numeric_features]

    return X, y, numeric_features, categorical_features
