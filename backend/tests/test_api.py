import io
import pytest

def test_root_endpoint(client):
    response = client.get("/")
    assert response.status_code == 200
    data = response.json()
    assert "NetSage" in data["product"]

def test_health_endpoint(client):
    response = client.get("/api/v1/health")
    assert response.status_code == 200
    assert response.json()["status"] == "healthy"

def test_status_endpoint_initial(client):
    response = client.get("/api/v1/status")
    assert response.status_code == 200
    assert "dataset_loaded" in response.json()

def test_load_sample_dataset_and_profile(client):
    response = client.post("/api/v1/datasets/sample")
    assert response.status_code == 200
    profile = response.json()
    assert profile["rows_count"] > 0
    assert profile["target_column"] == "Attack_type"
    assert "target_distribution" in profile

    # Test profile endpoint
    prof_resp = client.get("/api/v1/datasets/profile")
    assert prof_resp.status_code == 200
    assert prof_resp.json()["rows_count"] == profile["rows_count"]

    # Test records endpoint with pagination
    rec_resp = client.get("/api/v1/datasets/records?page=1&page_size=10")
    assert rec_resp.status_code == 200
    rec_data = rec_resp.json()
    assert len(rec_data["records"]) == 10
    assert rec_data["total_records"] == profile["rows_count"]

def test_train_model_and_inference(client):
    # Train Random Forest on sample dataset
    train_resp = client.post("/api/v1/models/train", json={
        "model_type": "random_forest",
        "test_size": 0.2,
        "random_state": 42,
        "run_cv": False
    })
    assert train_resp.status_code == 200
    train_data = train_resp.json()
    model_id = train_data["model_id"]
    assert "accuracy" in train_data["metrics"]

    # Test metrics endpoint
    metrics_resp = client.get(f"/api/v1/models/{model_id}/metrics")
    assert metrics_resp.status_code == 200
    assert metrics_resp.json()["model_id"] == model_id

    # Test single prediction
    test_features = {
        "proto": "tcp",
        "service": "http",
        "flow_duration": 1.25,
        "fwd_pkts_tot": 8,
        "bwd_pkts_tot": 6,
        "fwd_data_pkts_tot": 5,
        "bwd_data_pkts_tot": 4,
        "fwd_pkts_per_sec": 6.4,
        "bwd_pkts_per_sec": 4.8,
        "flow_pkts_per_sec": 11.2,
        "flow_bytes_per_sec": 1500.0,
        "fwd_header_size_tot": 160,
        "bwd_header_size_tot": 120,
        "flow_FIN_flag_count": 1,
        "flow_SYN_flag_count": 1,
        "flow_RST_flag_count": 0,
        "flow_PSH_flag_count": 2,
        "flow_ACK_flag_count": 13,
        "flow_URG_flag_count": 0,
        "flow_CWR_flag_count": 0,
        "flow_ECE_flag_count": 0,
        "fwd_pkts_payload.avg": 85.0,
        "fwd_pkts_payload.max": 150.0,
        "fwd_pkts_payload.min": 20.0,
        "fwd_pkts_payload.std": 30.0,
        "bwd_pkts_payload.avg": 120.0,
        "bwd_pkts_payload.max": 300.0,
        "bwd_pkts_payload.min": 10.0,
        "bwd_pkts_payload.std": 45.0,
        "flow_iat.avg": 0.08,
        "flow_iat.max": 0.25,
        "flow_iat.min": 0.01,
        "flow_iat.std": 0.05,
        "payload_bytes_per_second": 1200.0
    }
    pred_resp = client.post("/api/v1/predictions/single", json={
        "model_id": model_id,
        "features": test_features
    })
    assert pred_resp.status_code == 200
    pred_data = pred_resp.json()
    assert len(pred_data["records"]) == 1
    assert "predicted_class" in pred_data["records"][0]

    # Test global explanation
    exp_resp = client.get(f"/api/v1/explanations/global?model_id={model_id}&top_n=8")
    assert exp_resp.status_code == 200
    assert len(exp_resp.json()["top_features"]) == 8

    # Test local explanation
    local_exp_resp = client.post("/api/v1/explanations/local", json={
        "model_id": model_id,
        "record": test_features,
        "predicted_class": pred_data["records"][0]["predicted_class"]
    })
    assert local_exp_resp.status_code == 200
    assert "narrative_summary" in local_exp_resp.json()

def test_anomaly_detection_endpoint(client):
    anom_resp = client.post("/api/v1/anomalies/detect", json={
        "contamination": 0.05,
        "threshold": 0.5
    })
    assert anom_resp.status_code == 200
    anom_data = anom_resp.json()
    assert "flagged_count" in anom_data
    assert "score_distribution" in anom_data

def test_report_summary_endpoint(client):
    rep_resp = client.get("/api/v1/reports/summary?export_format=json")
    assert rep_resp.status_code == 200
    assert "report_title" in rep_resp.json()

def test_copilot_chat_endpoint(client):
    copilot_resp = client.post("/api/v1/copilot/chat", json={
        "message": "Summarize the traffic distribution and identify top risks",
    })
    assert copilot_resp.status_code == 200
    data = copilot_resp.json()
    assert "reply" in data
    assert "summary" in data
    assert "evidence_references" in data
    assert isinstance(data["evidence_references"], list)
    assert "findings" in data


def test_investigations_workflow(client):
    # Start investigation
    start_resp = client.post("/api/v1/investigations/start", json={
        "title": "Automated Test Forensic Investigation",
        "max_records_to_investigate": 5,
        "anomaly_threshold": 0.5
    })
    assert start_resp.status_code == 200
    inv_data = start_resp.json()
    assert "investigation_id" in inv_data
    assert inv_data["status"] == "completed"
    assert len(inv_data["steps"]) == 3
    inv_id = inv_data["investigation_id"]

    # List investigations
    list_resp = client.get("/api/v1/investigations")
    assert list_resp.status_code == 200
    items = list_resp.json()
    assert any(i["investigation_id"] == inv_id for i in items)

    # Get single investigation
    get_resp = client.get(f"/api/v1/investigations/{inv_id}")
    assert get_resp.status_code == 200
    assert get_resp.json()["investigation_id"] == inv_id

    # Download report markdown
    report_id = inv_data["final_report_json"]["report_id"]
    rep_md = client.get(f"/api/v1/reports/{report_id}?format=markdown")
    assert rep_md.status_code == 200
    assert b"NetSage" in rep_md.content

    # Download report json
    rep_json = client.get(f"/api/v1/reports/{report_id}?format=json")
    assert rep_json.status_code == 200
    assert rep_json.json()["report_id"] == report_id

