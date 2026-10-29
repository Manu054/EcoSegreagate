from typing import Dict, List, Optional, Any
from pydantic import BaseModel, ConfigDict
from datetime import datetime

class SchemaBase(BaseModel):
    model_config = ConfigDict(protected_namespaces=())

class PredictionResponse(SchemaBase):
    id: Optional[int] = None
    model_name: str
    predicted_class: str
    segregation_category: str  # "Biodegradable" | "Non-Biodegradable"
    confidence: float
    is_uncertain: bool
    inference_time_ms: float
    bin_assigned: str
    servo_angle_deg: int
    hardware_triggered: bool
    probabilities: Dict[str, float]
    status: str
    message: str
    calibration_note: str = "Softmax output values represent relative model activation and are not guaranteed calibrated real-world probabilities."
    timestamp: Optional[str] = None
    thumbnail_data: Optional[str] = None

class ComparisonResultItem(SchemaBase):
    model_name: str
    predicted_class: str
    segregation_category: str
    confidence: float
    inference_time_ms: float
    bin_assigned: str
    is_uncertain: bool
    probabilities: Dict[str, float]

class ModelComparisonResponse(SchemaBase):
    predictions: Dict[str, ComparisonResultItem]
    consensus_category: str
    agreement_percentage: float
    all_agree: bool
    fastest_model: str
    highest_confidence_model: str
    recommended_action: str
    bin_assigned: str
    timestamp: str

class ModelInfo(SchemaBase):
    name: str
    display_name: str
    architecture: str
    status: str  # "ready", "weights_missing", "evaluation_ready"
    parameter_count: int
    is_default: bool
    description: str
    input_resolution: str

class MetricDetail(SchemaBase):
    model_name: str
    accuracy: Optional[float] = None
    macro_precision: Optional[float] = None
    macro_recall: Optional[float] = None
    macro_f1: Optional[float] = None
    weighted_precision: Optional[float] = None
    weighted_recall: Optional[float] = None
    weighted_f1: Optional[float] = None
    inference_latency_ms: Optional[float] = None
    model_size_mb: Optional[float] = None
    parameter_count: Optional[int] = None
    training_time_sec: Optional[float] = None
    roc_auc: Optional[float] = None
    pr_auc: Optional[float] = None
    status: str  # "evaluated" | "pending_training"
    hardware_details: Optional[Dict[str, str]] = None
    per_class_metrics: Optional[Dict[str, Any]] = None
    confusion_matrix: Optional[List[List[int]]] = None

class HistoryItem(SchemaBase):
    id: int
    timestamp: str
    filename: Optional[str] = None
    model_name: str
    predicted_class: str
    segregation_category: str
    confidence: float
    inference_time_ms: float
    bin_assigned: str
    servo_angle_deg: int
    hardware_triggered: bool
    is_uncertain: bool
    status: str
    thumbnail_data: Optional[str] = None

class PaginatedHistory(SchemaBase):
    total: int
    page: int
    page_size: int
    items: List[HistoryItem]

class AnalyticsSummary(SchemaBase):
    total_predictions: int
    biodegradable_count: int
    non_biodegradable_count: int
    uncertain_count: int
    category_breakdown: Dict[str, int]
    model_usage: Dict[str, int]
    average_confidence: float
    average_latency_ms: float
    hardware_activations: int

class AnalyticsTrendPoint(SchemaBase):
    date: str
    total: int
    biodegradable: int
    non_biodegradable: int

class HardwareStatus(SchemaBase):
    simulation_mode: bool
    current_bin: str
    servo_angle_deg: int
    is_emergency_stopped: bool
    confidence_threshold: float
    last_action_timestamp: Optional[str] = None
    total_sort_actions: int
    safety_message: str

class HardwareManualOverrideRequest(SchemaBase):
    target_bin: str
    servo_angle_deg: int

class ReportFileInfo(SchemaBase):
    filename: str
    file_type: str
    size_bytes: int
    description: str
    created_at: str
    download_url: str

class TelemetryMetrics(SchemaBase):
    total_detections: int
    biodegradable_count: int
    non_biodegradable_count: int
    biodegradable_pct: float
    non_biodegradable_pct: float
    avg_latency_ms: float
    throughput_per_min: float
    time_window_minutes: int

class TelemetryHealth(SchemaBase):
    api_status: str
    models_ready: str
    hardware_status: str
    last_inference_timestamp: Optional[str] = None
    recent_errors_count: int

class TelemetryDataResponse(SchemaBase):
    latest_detection: Optional[HistoryItem] = None
    recent_activity: List[HistoryItem]
    metrics: TelemetryMetrics
    trend_chart: List[Dict[str, Any]]
    system_health: TelemetryHealth
