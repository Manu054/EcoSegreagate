# Quality Assurance and Automated Testing Report
## EcoSegregate Test Verification Protocol

### Test Environment
* **Test Runner:** Pytest 8.4.2
* **Python Runtime:** Python 3.11.4 on Windows 10
* **API Test Client:** `fastapi.testclient.TestClient` (Starlette / HTTPX)
* **Status:** 14 Passed, 0 Failed, 0 Skipped (100% Pass Rate)

---

### Verified Test Cases
1. `test_health_endpoint`: Validates API health, CPU/RAM telemetry, and model readiness count.
2. `test_models_endpoint`: Validates that MobileNetV2, ResNet50, and EfficientNetB0 are correctly registered.
3. `test_invalid_image_upload_type`: Uploads text file disguised as image; verifies rejection with HTTP 400.
4. `test_corrupted_image_upload`: Uploads arbitrary corrupted bytes; verifies `PIL.Image.verify()` triggers HTTP 400.
5. `test_hardware_status_and_simulation`: Verifies diverter arm telemetry, manual override, and safety limits.
6. `test_hardware_emergency_stop_blocks_action`: Confirms that active E-STOP strictly inhibits actuator movement.
7. `test_metrics_endpoint`: Confirms model evaluation results are returned with valid metrics.
8. `test_metrics_single_model`: Checks single model metric query.
9. `test_analytics_summary_and_trends`: Verifies aggregate statistics and 14-day time-series queries.
10. `test_history_flow_and_filtering`: Verifies paginated history retrieval, filtering, and deletion.
11. `test_reports_catalogue`: Verifies approved report catalogue is accessible.
12. `test_report_download_path_traversal_protection`: Attempts directory traversal (`../../etc/passwd`); verifies blocked.
13. `test_prediction_live`: Uploads valid specimen image; verifies classification output, confidence, and target bin.
14. `test_prediction_compare_live`: Executes 3-model comparison on specimen; verifies consensus and latency ranking.
