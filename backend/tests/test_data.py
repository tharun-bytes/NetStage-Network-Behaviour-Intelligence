import io
import pytest
import pandas as pd
from src.data.loader import load_network_flow_csv, DataLoaderError
from src.data.validation import validate_and_profile_dataset, check_inference_schema_compatibility
from src.data.preprocessing import build_feature_preprocessor, prepare_train_features_and_target

def test_load_valid_csv():
    csv_content = io.BytesIO(b"proto,service,flow_duration,fwd_pkts_tot,Attack_type\ntcp,http,1.2,5,Normal\nudp,dns,0.4,2,Normal\n")
    df, meta = load_network_flow_csv(csv_content)
    assert len(df) == 2
    assert "Attack_type" in df.columns
    assert meta["rows_count"] == 2
    assert meta["columns_count"] == 5

def test_load_empty_csv_raises():
    empty_content = io.BytesIO(b"")
    with pytest.raises(DataLoaderError):
        load_network_flow_csv(empty_content)

def test_validate_and_profile():
    data = {
        "proto": ["tcp", "tcp", "udp", "tcp"],
        "flow_duration": [1.0, 2.0, 0.5, 1.5],
        "fwd_pkts_tot": [10, 20, 5, 15],
        "Attack_type": ["Normal", "Normal", "DOS", "DOS"]
    }
    df = pd.DataFrame(data)
    profile, warnings = validate_and_profile_dataset(df, target_column_candidate="Attack_type")
    assert profile["rows_count"] == 4
    assert profile["columns_count"] == 4
    assert "Normal" in profile["target_distribution"]
    assert "DOS" in profile["target_distribution"]
    assert len(profile["numeric_features"]) == 2
    assert "flow_duration" in profile["numeric_summary"]

def test_schema_compatibility():
    df = pd.DataFrame({"proto": ["tcp"], "flow_duration": [1.0]})
    expected = ["proto", "flow_duration", "fwd_pkts_tot"]
    is_compat, missing, extra = check_inference_schema_compatibility(df, expected)
    assert is_compat is False
    assert "fwd_pkts_tot" in missing

def test_preprocessing_pipeline():
    data = {
        "proto": ["tcp", "udp", "tcp"],
        "flow_duration": [1.0, float("inf"), 2.5],
        "fwd_pkts_tot": [10, 5, 20],
        "Attack_type": ["Normal", "Attack", "Normal"]
    }
    df = pd.DataFrame(data)
    X, y, num_cols, cat_cols = prepare_train_features_and_target(df)
    preprocessor = build_feature_preprocessor(num_cols, cat_cols)
    transformed = preprocessor.fit_transform(X)
    assert transformed.shape[0] == 3
    assert not pd.isna(transformed).any()
