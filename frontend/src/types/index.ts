export interface PredictionResponse {
  id?: number;
  model_name: string;
  predicted_class: string;
  segregation_category: 'Biodegradable' | 'Non-Biodegradable';
  confidence: number;
  is_uncertain: boolean;
  inference_time_ms: number;
  bin_assigned: string;
  servo_angle_deg: number;
  hardware_triggered: boolean;
  probabilities: Record<string, number>;
  status: string;
  message: string;
  calibration_note: string;
  timestamp?: string;
  thumbnail_data?: string;
}

export interface ComparisonResultItem {
  model_name: string;
  predicted_class: string;
  segregation_category: string;
  confidence: number;
  inference_time_ms: number;
  bin_assigned: string;
  is_uncertain: boolean;
  probabilities: Record<string, number>;
}

export interface ModelComparisonResponse {
  predictions: Record<string, ComparisonResultItem>;
  consensus_category: string;
  agreement_percentage: number;
  all_agree: boolean;
  fastest_model: string;
  highest_confidence_model: string;
  recommended_action: string;
  bin_assigned: string;
  timestamp: string;
}

export interface ModelInfo {
  name: string;
  display_name: string;
  architecture: string;
  status: 'ready' | 'weights_missing' | 'evaluation_ready';
  parameter_count: number;
  is_default: boolean;
  description: string;
  input_resolution: string;
}

export interface MetricSummary {
  model_name: string;
  display_name: string;
  status: string;
  accuracy: number | null;
  macro_precision: number | null;
  macro_recall: number | null;
  macro_f1: number | null;
  weighted_f1: number | null;
  inference_latency_ms: number | null;
  model_size_mb: number | null;
  parameter_count: number | null;
  training_time_sec: number | null;
  roc_auc?: number | null;
  macro_specificity?: number | null;
  per_class_metrics?: Record<string, {
    precision: number;
    recall: number;
    f1_score: number;
    specificity: number;
    support: number;
  }>;
  confusion_matrix?: number[][];
  weighted_precision?: number | null;
  weighted_recall?: number | null;
  peak_memory_mb?: number | null;
  hardware_details?: Record<string, any>;
  evaluated_at?: string | null;
  message?: string;
}



export interface AnalyticsSummary {
  total_predictions: number;
  biodegradable_count: number;
  non_biodegradable_count: number;
  uncertain_count: number;
  category_breakdown: Record<string, number>;
  model_usage: Record<string, number>;
  average_confidence: number;
  average_latency_ms: number;
  hardware_activations: number;
}

export interface AnalyticsTrendPoint {
  date: string;
  total: number;
  biodegradable: number;
  non_biodegradable: number;
}

export interface HistoryItem {
  id: number;
  timestamp: string;
  filename?: string;
  model_name: string;
  predicted_class: string;
  segregation_category: string;
  confidence: number;
  inference_time_ms: number;
  bin_assigned: string;
  servo_angle_deg: number;
  hardware_triggered: boolean;
  is_uncertain: boolean;
  status: string;
  thumbnail_data?: string;
}

export interface PaginatedHistory {
  total: number;
  page: number;
  page_size: number;
  items: HistoryItem[];
}

export interface HardwareStatus {
  simulation_mode: boolean;
  current_bin: string;
  servo_angle_deg: number;
  is_emergency_stopped: boolean;
  confidence_threshold: number;
  last_action_timestamp?: string;
  total_sort_actions: number;
  safety_message: string;
}

export interface ReportFile {
  filename: string;
  file_type: string;
  size_bytes: number;
  description: string;
  created_at: string;
  download_url: string;
}

export interface TelemetryMetrics {
  total_detections: number;
  biodegradable_count: number;
  non_biodegradable_count: number;
  biodegradable_pct: number;
  non_biodegradable_pct: number;
  avg_latency_ms: number;
  throughput_per_min: number;
  time_window_minutes: number;
}

export interface TelemetryHealth {
  api_status: string;
  models_ready: string;
  hardware_status: string;
  last_inference_timestamp: string | null;
  recent_errors_count: number;
}

export interface TelemetryTrendPoint {
  time: string;
  biodegradable: number;
  non_biodegradable: number;
  total: number;
}

export interface TelemetryDataResponse {
  latest_detection: HistoryItem | null;
  recent_activity: HistoryItem[];
  metrics: TelemetryMetrics;
  trend_chart: TelemetryTrendPoint[];
  system_health: TelemetryHealth;
}

