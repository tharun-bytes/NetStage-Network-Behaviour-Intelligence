from typing import Any, Optional
import numpy as np
import pandas as pd

KNOWN_TARGET_COLUMNS = ["Attack_type", "attack_type", "label", "Label", "class", "Class"]
LEAKAGE_COLUMNS = ["id", "flow_id", "src_ip", "dst_ip", "timestamp", "src_mac", "dst_mac"]

class SchemaValidationError(Exception):
    """Raised when dataset fails required schema integrity checks."""
    pass

def validate_and_profile_dataset(
    df: pd.DataFrame,
    target_column_candidate: Optional[str] = "Attack_type",
    is_training_data: bool = True
) -> tuple[dict[str, Any], list[str]]:
    """
    Perform deep validation and generate a rich statistical profile of the dataset.
    Returns:
        profile: Dictionary containing schema metrics, summary stats, distributions, correlation matrix.
        warnings: List of data quality and potential leakage warnings.
    """
    warnings: list[str] = []
    
    # 1. Basic Shape
    n_rows = len(df)
    n_cols = len(df.columns)
    if n_rows == 0:
        raise SchemaValidationError("Dataset has 0 rows.")

    # 2. Check Duplicates
    n_duplicates = int(df.duplicated().sum())
    if n_duplicates > 0:
        dup_pct = round((n_duplicates / n_rows) * 100, 2)
        warnings.append(f"Detected {n_duplicates} ({dup_pct}%) duplicate rows in the dataset.")

    # 3. Target Column Inspection
    resolved_target = None
    if is_training_data:
        if target_column_candidate and target_column_candidate in df.columns:
            resolved_target = target_column_candidate
        else:
            for cand in KNOWN_TARGET_COLUMNS:
                if cand in df.columns:
                    resolved_target = cand
                    break
        
        if resolved_target is None:
            raise SchemaValidationError(
                f"Missing required target column for training. Expected '{target_column_candidate}' or one of {KNOWN_TARGET_COLUMNS}."
            )
            
        target_series = df[resolved_target]
        missing_targets = int(target_series.isna().sum())
        if missing_targets > 0:
            warnings.append(f"Target column '{resolved_target}' contains {missing_targets} missing (NaN) values.")
            
        target_counts = target_series.value_counts(dropna=False).to_dict()
        target_distribution = {
            str(k): {
                "count": int(v),
                "percentage": round((int(v) / n_rows) * 100, 2)
            }
            for k, v in target_counts.items()
        }
        
        # Check class imbalance
        counts_list = list(target_counts.values())
        if len(counts_list) > 1 and max(counts_list) / max(1, min(counts_list)) > 10:
            warnings.append(f"Severe class imbalance detected: ratio of max to min class is {max(counts_list) / max(1, min(counts_list)):.1f}:1.")
    else:
        target_distribution = {}

    # 4. Check for Data Leakage Columns
    for col in df.columns:
        col_lower = col.lower()
        if any(leak in col_lower for leak in LEAKAGE_COLUMNS):
            warnings.append(f"Potential leakage feature identified: '{col}'. Identifiers or raw IP/MAC headers should be excluded from modeling.")

    # 5. Type Separation & Null/Inf Checks
    feature_cols = [c for c in df.columns if c != resolved_target]
    numeric_cols = []
    categorical_cols = []
    missing_summary = {}
    infinite_values_count = 0
    negative_counts_warning = []

    for col in feature_cols:
        series = df[col]
        missing_count = int(series.isna().sum())
        missing_summary[col] = {
            "missing_count": missing_count,
            "missing_percentage": round((missing_count / n_rows) * 100, 2),
            "dtype": str(series.dtype)
        }

        if pd.api.types.is_numeric_dtype(series):
            numeric_cols.append(col)
            # Check infs
            infs = int(np.isinf(series).sum()) if hasattr(series, "dtype") else 0
            if infs > 0:
                infinite_values_count += infs
                warnings.append(f"Feature '{col}' contains {infs} infinite values.")
            # Check negative values where physical counts/durations should be non-negative
            if ("pkts" in col or "duration" in col or "bytes" in col) and (series < 0).any():
                negative_counts_warning.append(col)
        else:
            categorical_cols.append(col)

    if negative_counts_warning:
        warnings.append(f"Negative values detected in rate or count columns: {negative_counts_warning[:3]}.")

    # 6. Numeric Summary Statistics
    numeric_summary = {}
    if numeric_cols:
        desc = df[numeric_cols].describe().T
        for col_name, stats in desc.iterrows():
            numeric_summary[str(col_name)] = {
                "mean": round(float(stats.get("mean", 0)), 4),
                "std": round(float(stats.get("std", 0)), 4) if not np.isnan(stats.get("std", 0)) else 0.0,
                "min": round(float(stats.get("min", 0)), 4),
                "q25": round(float(stats.get("25%", 0)), 4),
                "median": round(float(stats.get("50%", 0)), 4),
                "q75": round(float(stats.get("75%", 0)), 4),
                "max": round(float(stats.get("max", 0)), 4),
            }

    # 7. Categorical Summary Statistics
    categorical_summary = {}
    for col in categorical_cols:
        val_counts = df[col].value_counts(dropna=False).head(10).to_dict()
        categorical_summary[col] = {
            "unique_count": int(df[col].nunique()),
            "top_categories": {str(k): int(v) for k, v in val_counts.items()}
        }

    # 8. Feature Correlation Analysis (Top correlated pairs)
    top_correlations = []
    if len(numeric_cols) >= 2:
        # Sample if large for performance
        sample_size = min(n_rows, 5000)
        sample_df = df[numeric_cols].sample(sample_size, random_state=42) if n_rows > sample_size else df[numeric_cols]
        corr_matrix = sample_df.corr().abs()
        
        # Extract pairs
        upper_tri = np.triu(np.ones(corr_matrix.shape), k=1).astype(bool)
        corr_pairs = []
        for i in range(len(numeric_cols)):
            for j in range(i + 1, len(numeric_cols)):
                val = corr_matrix.iloc[i, j]
                if not np.isnan(val):
                    corr_pairs.append({
                        "feature_a": numeric_cols[i],
                        "feature_b": numeric_cols[j],
                        "correlation": round(float(val), 4)
                    })
        # Sort by absolute correlation descending
        corr_pairs.sort(key=lambda x: x["correlation"], reverse=True)
        top_correlations = corr_pairs[:12]

    profile = {
        "rows_count": n_rows,
        "columns_count": n_cols,
        "duplicate_rows": n_duplicates,
        "duplicate_percentage": round((n_duplicates / n_rows) * 100, 2),
        "target_column": resolved_target,
        "target_distribution": target_distribution,
        "numeric_feature_count": len(numeric_cols),
        "categorical_feature_count": len(categorical_cols),
        "numeric_features": numeric_cols,
        "categorical_features": categorical_cols,
        "missing_summary": missing_summary,
        "infinite_values_count": infinite_values_count,
        "numeric_summary": numeric_summary,
        "categorical_summary": categorical_summary,
        "top_correlations": top_correlations,
        "warnings_count": len(warnings),
    }

    return profile, warnings

def check_inference_schema_compatibility(
    inference_df: pd.DataFrame,
    expected_features: list[str]
) -> tuple[bool, list[str], list[str]]:
    """
    Validate that an unlabelled or test DataFrame contains all mandatory predictive features.
    Returns:
        is_compatible: bool
        missing_features: list of missing expected features
        extra_features: list of unmodeled features present in upload
    """
    df_cols = set(inference_df.columns)
    expected_set = set(expected_features)
    
    missing = list(expected_set - df_cols)
    extra = list(df_cols - expected_set)
    is_compatible = len(missing) == 0
    return is_compatible, missing, extra
