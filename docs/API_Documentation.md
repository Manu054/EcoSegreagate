# EcoSegregate REST API Documentation
## Automated Waste Classification & Hardware Telemetry Specification

### Base URL: `http://127.0.0.1:8000/api`

---

### 1. Health and System Readiness
* **Endpoint:** `GET /health`
* **Response `200 OK`:**
```json
{
  "status": "healthy",
  "service": "Smart Waste Management API",
  "timestamp": "2026-10-28T21:40:00Z",
  "models_ready": "3/3",
  "hardware_simulation": true,
  "emergency_stop": false,
  "memory_usage_pct": 52.4,
  "cpu_usage_pct": 14.1
}
```

---

### 2. Model Registry
* **Endpoint:** `GET /models`
* **Response `200 OK`:** List of CNN models (MobileNetV2, ResNet50, EfficientNetB0) with loading status and parameter counts.

---

### 3. Single Specimen Prediction
* **Endpoint:** `POST /predict`
* **Content-Type:** `multipart/form-data`
* **Form Parameters:**
  * `file`: Binary image file (JPEG, PNG, WEBP, max 10MB)
  * `model_name`: `mobilenet_v2` | `resnet50` | `efficientnet_b0`
* **Response `200 OK`:**
```json
{
  "id": 1,
  "model_name": "mobilenet_v2",
  "predicted_class": "organic",
  "segregation_category": "Biodegradable",
  "confidence": 0.9842,
  "is_uncertain": false,
  "inference_time_ms": 28.00,
  "bin_assigned": "Green Bin (Compost)",
  "servo_angle_deg": 45,
  "hardware_triggered": true,
  "probabilities": {
    "organic": 0.9842,
    "recyclable": 0.0158
  },
  "status": "success",
  "message": "Successfully segregated as Biodegradable (organic). Target: Green Bin (Compost).",
  "calibration_note": "Softmax output values represent relative model activation and are not guaranteed calibrated real-world probabilities."
}
```

---

### 4. Multi-Model Comparison Inference
* **Endpoint:** `POST /predict/compare`
* **Content-Type:** `multipart/form-data`
* **Response `200 OK`:** Runs all three models in parallel and returns consensus category, agreement percentage, and fastest architecture.

---

### 5. Evaluation Metrics & Benchmarks
* **Endpoint:** `GET /metrics`
* **Response `200 OK`:** JSON comparison matrix containing Accuracy, Macro Precision, Recall, F1, Latency, Size, and Parameter counts.

---

### 6. Hardware Actuation & Safety Controls
* **Endpoint:** `GET /hardware/status`
* **Endpoint:** `POST /hardware/emergency-stop`
* **Endpoint:** `POST /hardware/reset`
* **Endpoint:** `POST /hardware/override`
