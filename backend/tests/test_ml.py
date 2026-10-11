import tempfile
from pathlib import Path
import pytest
import pandas as pd
from src.data.generator import generate_rt_iot2022_synthetic_data
from src.ml.train import train_classification_model
from src.ml.predict import predict_network_flows
from src.ml.anomaly import train_isolation_forest_detector, detect_anomalies
from src.ml.explain import compute_global_feature_importance, compute_local_prediction_explanation
from src.ml.artifacts import save_model_artifact, load_model_artifact

@pytest.fixture(scope="module")
def sample_dataset():
    return generate_rt_iot2022_synthetic_data(n_samples=250, random_state=42)

def test_train_dummy_model(sample_dataset):
    res = train_classification_model(sample_dataset, model_type="dummy", run_cv=False)
    assert "pipeline" in res
    assert "metrics" in res
    assert res["metrics"]["accuracy"] > 0
    assert res["metadata"]["model_type"] == "dummy"

def test_train_random_forest(sample_dataset):
    res = train_classification_model(sample_dataset, model_type="random_forest", run_cv=False)
    pipeline = res["pipeline"]
    metadata = res["metadata"]
    metrics = res["metrics"]
    
    assert metrics["accuracy"] >= 0.7
    assert metrics["macro_f1"] > 0
    assert len(metrics["confusion_matrix"]["labels"]) == len(metadata["classes"])

    # Test inference on test split
    unlabelled = sample_dataset.drop(columns=["Attack_type"]).head(10)
    preds = predict_network_flows(pipeline, metadata, unlabelled)
    assert len(preds["records"]) == 10
    assert preds["total_records"] == 10
    assert "predicted_class" in preds["records"][0]
    assert "confidence" in preds["records"][0]

def test_anomaly_detection(sample_dataset):
    iso_res = train_isolation_forest_detector(sample_dataset, contamination=0.1, random_state=42)
    pipeline = iso_res["pipeline"]
    metadata = iso_res["metadata"]
    
    unlabelled = sample_dataset.drop(columns=["Attack_type"]).head(20)
    anom_res = detect_anomalies(pipeline, metadata, unlabelled)
    assert anom_res["total_records"] == 20
    assert "flagged_count" in anom_res
    assert "score_distribution" in anom_res
    assert len(anom_res["score_distribution"]) == 10

def test_explainability(sample_dataset):
    res = train_classification_model(sample_dataset, model_type="random_forest", run_cv=False)
    pipeline = res["pipeline"]
    metadata = res["metadata"]

    # Global
    global_exp = compute_global_feature_importance(pipeline, metadata, top_n=5)
    assert len(global_exp["top_features"]) == 5
    assert global_exp["top_features"][0]["importance"] >= global_exp["top_features"][1]["importance"]

    # Local
    record = sample_dataset.drop(columns=["Attack_type"]).iloc[0].to_dict()
    local_exp = compute_local_prediction_explanation(pipeline, metadata, record, "Normal")
    assert "narrative_summary" in local_exp
    assert len(local_exp["top_drivers"]) > 0

def test_artifact_persistence(sample_dataset):
    res = train_classification_model(sample_dataset, model_type="dummy", run_cv=False)
    with tempfile.TemporaryDirectory() as tmp_dir:
        tmp_path = Path(tmp_dir)
        model_id = save_model_artifact(res["pipeline"], res["metadata"], res["metrics"], tmp_path)
        assert (tmp_path / f"{model_id}.joblib").exists()
        assert (tmp_path / f"{model_id}_metadata.json").exists()

        loaded_pipe, loaded_meta = load_model_artifact(tmp_path, model_id)
        assert loaded_pipe is not None
        assert loaded_meta["model_id"] == model_id
