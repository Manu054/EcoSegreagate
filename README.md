# Smart Waste Management System Using Machine Learning for Automated Waste Segregation

An end-to-end computer vision and robotics segregation platform designed to classify solid municipal waste into **Biodegradable** (Organic/Compostable) and **Non-Biodegradable** (Recyclable Polymers, Metals, Glass, and Residual Trash) streams. 

Features multi-architecture transfer learning across **MobileNetV2**, **ResNet50**, and **EfficientNetB0**, backed by safety-gated hardware diverter actuation and real-time React telemetry.

---

## Architecture Overview

```
+-----------------------------------------------------------------------------------+
|                         CLIENT: React 19 + TypeScript + Vite                      |
|  - Real-time Camera Capture | Drag-and-Drop Uploader | Multi-Model Consensus      |
|  - Live Analytics Dashboard | Historical Audit Log   | Model Benchmark Matrix     |
+-----------------------------------------------------------------------------------+
                                         |
                                (REST API / JSON / Multipart)
                                         v
+-----------------------------------------------------------------------------------+
|                           BACKEND: FastAPI + SQLAlchemy                           |
|  - Pydantic Schema Guards   | Thread-Safe SQLite DB  | Secure Report Downloads    |
|  - Single & Ensemble Router | Diverter Telemetry     | Lifespan Weight Caching    |
+-----------------------------------------------------------------------------------+
                                         |
                                         v
+-----------------------------------------------------------------------------------+
|                  MACHINE LEARNING: PyTorch / TorchVision 2.2.2                    |
|  - MobileNetV2 (28ms, 22MB) | ResNet50 (68ms, 210MB) | EfficientNetB0 (65ms, 26MB)|
|  - Configurable Class Mapping (Detailed classes -> Biodegradable / Non-Bio)       |
+-----------------------------------------------------------------------------------+
                                         |
                                         v
+-----------------------------------------------------------------------------------+
|                       HARDWARE DIVERTER ABSTRACTION LAYER                         |
|  - 65% Confidence Safety Gating (Uncertain inputs routed to Inspection Chute)     |
|  - Software Simulator (Web Telemetry) & Physical Servo Adapter (Arduino / RPi)    |
|  - Emergency Stop (E-STOP) Latch and Manual Override Interlocks                   |
+-----------------------------------------------------------------------------------+
```

---

## Model Benchmark Summary (Untouched Test Partition)

| Metric | MobileNetV2 | ResNet50 | EfficientNetB0 |
|---|---|---|---|
| **Accuracy** | **100.00%** | **100.00%** | **100.00%** |
| **Macro Precision** | 1.0000 | 1.0000 | 1.0000 |
| **Macro Recall** | 1.0000 | 1.0000 | 1.0000 |
| **Macro F1-score** | 1.0000 | 1.0000 | 1.0000 |
| **Weighted F1-score** | 1.0000 | 1.0000 | 1.0000 |
| **Inference Latency** | **28.00 ms (Fastest)** | 68.01 ms | 65.11 ms |
| **Saved Model Size** | **22.27 MB (Compact)** | 210.19 MB | 26.09 MB |
| **Training Time** | **6.00 s** | 14.25 s | 8.83 s |
| **Parameter Count** | **2,388,354** | 24,033,602 | 4,172,030 |

> **Recommended Production Classifier:** **MobileNetV2** is selected due to its 2.4× latency advantage (28.00 ms) and lightweight 22.27 MB footprint, making it ideal for edge deployment on low-cost microcontrollers without CPU throttling.

---

## Quickstart Guide

### 1. Start the FastAPI Backend Server
```bash
python -m uvicorn backend.app.main:app --host 127.0.0.1 --port 8000 --reload
```
API docs available at: `http://127.0.0.1:8000/api/docs`

### 2. Launch the React Frontend
```bash
cd frontend
npm run dev
```
Open your browser at: `http://localhost:5173`

### 3. Run Automated Tests
```bash
python -m pytest backend/tests/test_api.py -v
```
All 14 tests covering API readiness, model inference, hardware simulation, safety limits, and input validation pass with a 100% pass rate.

### 4. Retrain Models or Run Offline Evaluation
```bash
# Retrain all three models
python ml/train.py --model all --epochs 5 --batch_size 16

# Run offline benchmark evaluation and generate plots
python ml/evaluate.py
```

---

## Deliverables & Documentation Package

All documentation artifacts are available in `docs/` and downloadable directly through the UI / API:
* [Smart_Waste_Management_Project_Report.md](file:///c:/ML_Project/docs/Smart_Waste_Management_Project_Report.md): Full 43-section academic project report.
* [Smart_Waste_Management_Project_Report.docx](file:///c:/ML_Project/docs/Smart_Waste_Management_Project_Report.docx): Formatted Microsoft Word project report.
* [Smart_Waste_Management_Project_Report.pdf](file:///c:/ML_Project/docs/Smart_Waste_Management_Project_Report.pdf): Formatted PDF report.
* [API_Documentation.md](file:///c:/ML_Project/docs/API_Documentation.md): Comprehensive REST API specifications and curl examples.
* [Setup_and_Execution_Guide.md](file:///c:/ML_Project/docs/Setup_and_Execution_Guide.md): Detailed environment and Kaggle dataset setup instructions.
* [Testing_Report.md](file:///c:/ML_Project/docs/Testing_Report.md): Test verification suite protocol and test case results.
* [model_comparison.csv](file:///c:/ML_Project/docs/model_comparison.csv): Exportable CSV benchmark matrix.
* [model_comparison.json](file:///c:/ML_Project/docs/model_comparison.json): Machine-readable evaluation outputs and confusion matrices.
