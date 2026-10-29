import io
import json
import pytest
from fastapi.testclient import TestClient

def test_health_endpoint(client: TestClient):
    response = client.get("/api/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert "models_ready" in data
    assert data["hardware_simulation"] is True
    assert "cpu_usage_pct" in data

def test_models_endpoint(client: TestClient):
    response = client.get("/api/models")
    assert response.status_code == 200
    models = response.json()
    assert len(models) == 3
    model_names = [m["name"] for m in models]
    assert "mobilenet_v2" in model_names
    assert "resnet50" in model_names
    assert "efficientnet_b0" in model_names

def test_invalid_image_upload_type(client: TestClient):
    # Upload text file as image
    files = {"file": ("test.txt", b"plain text content", "text/plain")}
    response = client.post("/api/predict", files=files, data={"model_name": "mobilenet_v2"})
    assert response.status_code == 400
    assert "Invalid file type" in response.json()["detail"]

def test_corrupted_image_upload(client: TestClient, sample_corrupted_image_bytes):
    files = {"file": ("corrupt.jpg", sample_corrupted_image_bytes, "image/jpeg")}
    response = client.post("/api/predict", files=files, data={"model_name": "mobilenet_v2"})
    assert response.status_code == 400
    assert "Corrupted or unreadable" in response.json()["detail"]

def test_hardware_status_and_simulation(client: TestClient):
    # 1. Get initial status
    res = client.get("/api/hardware/status")
    assert res.status_code == 200
    status = res.json()
    assert status["simulation_mode"] is True
    assert status["is_emergency_stopped"] is False

    # 2. Manual override
    override_payload = {"target_bin": "Green Bin (Compost)", "servo_angle_deg": 45}
    override_res = client.post("/api/hardware/override", json=override_payload)
    assert override_res.status_code == 200
    override_data = override_res.json()
    assert override_data["success"] is True
    assert override_data["servo_angle_deg"] == 45

    # 3. Emergency stop
    estop_res = client.post("/api/hardware/emergency-stop")
    assert estop_res.status_code == 200
    assert estop_res.json()["is_emergency_stopped"] is True

    # 4. Action while emergency stopped must be blocked
    blocked_res = client.post("/api/hardware/override", json=override_payload)
    assert blocked_res.json()["success"] is False
    assert "Emergency Stop" in blocked_res.json()["message"]

    # 5. Reset emergency stop
    reset_res = client.post("/api/hardware/reset")
    assert reset_res.status_code == 200
    assert reset_res.json()["is_emergency_stopped"] is False

def test_metrics_endpoint(client: TestClient):
    response = client.get("/api/metrics")
    assert response.status_code == 200
    data = response.json()
    assert "mobilenet_v2" in data
    assert "resnet50" in data
    assert "efficientnet_b0" in data
    # Each model should have a defined status
    for m in ["mobilenet_v2", "resnet50", "efficientnet_b0"]:
        assert data[m]["status"] in ["evaluated", "pending_training"]

def test_metrics_single_model(client: TestClient):
    response = client.get("/api/metrics/mobilenet_v2")
    assert response.status_code == 200
    data = response.json()
    assert data["model_name"] == "mobilenet_v2"
    assert "status" in data

def test_analytics_summary_and_trends(client: TestClient):
    res_summary = client.get("/api/analytics/summary")
    assert res_summary.status_code == 200
    summary = res_summary.json()
    assert "total_predictions" in summary
    assert "biodegradable_count" in summary
    assert "non_biodegradable_count" in summary

    res_trends = client.get("/api/analytics/trends")
    assert res_trends.status_code == 200
    assert isinstance(res_trends.json(), list)

def test_history_flow_and_filtering(client: TestClient):
    # Retrieve history
    res = client.get("/api/history?page=1&page_size=10")
    assert res.status_code == 200
    data = res.json()
    assert "total" in data
    assert "items" in data
    assert isinstance(data["items"], list)

def test_reports_catalogue(client: TestClient):
    res = client.get("/api/reports")
    assert res.status_code == 200
    reports = res.json()
    assert len(reports) >= 5
    filenames = [r["filename"] for r in reports]
    assert "Smart_Waste_Management_Project_Report.md" in filenames
    assert "API_Documentation.md" in filenames
    assert "model_comparison.csv" in filenames

def test_report_download_path_traversal_protection(client: TestClient):
    # Attempt directory traversal
    res = client.get("/api/reports/../../etc/passwd")
    assert res.status_code == 400 or res.status_code == 404

def test_prediction_live(client: TestClient, sample_valid_image_bytes):
    files = {"file": ("test_leaf.jpg", sample_valid_image_bytes, "image/jpeg")}
    response = client.post("/api/predict", files=files, data={"model_name": "mobilenet_v2"})
    assert response.status_code == 200
    data = response.json()
    assert "predicted_class" in data
    assert data["segregation_category"] in ["Biodegradable", "Non-Biodegradable"]
    assert "bin_assigned" in data
    assert "confidence" in data
    assert data["inference_time_ms"] > 0
    assert "calibration_note" in data

def test_prediction_compare_live(client: TestClient, sample_valid_image_bytes):
    files = {"file": ("compare_sample.jpg", sample_valid_image_bytes, "image/jpeg")}
    response = client.post("/api/predict/compare", files=files)
    assert response.status_code == 200
    data = response.json()
    assert "predictions" in data
    assert "mobilenet_v2" in data["predictions"]
    assert "resnet50" in data["predictions"]
    assert "efficientnet_b0" in data["predictions"]
    assert "consensus_category" in data
    assert "agreement_percentage" in data

def test_class_mapping_integrity():
    from backend.app.config import settings
    mapping_path = settings.CLASS_MAPPING_FILE
    assert mapping_path.exists()
    with open(mapping_path, "r", encoding="utf-8") as f:
        data = json.load(f)
    assert "primary_categories" in data
    assert "class_mappings" in data
    assert "organic" in data["class_mappings"]
    assert data["class_mappings"]["organic"]["primary_category"] == "Biodegradable"
    assert "plastic" in data["class_mappings"]
    assert data["class_mappings"]["plastic"]["primary_category"] == "Non-Biodegradable"
