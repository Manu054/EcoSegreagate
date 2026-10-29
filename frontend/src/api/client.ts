import {
  PredictionResponse,
  ModelComparisonResponse,
  ModelInfo,
  MetricSummary,
  AnalyticsSummary,
  AnalyticsTrendPoint,
  PaginatedHistory,
  HardwareStatus,
  ReportFile,
  TelemetryDataResponse
} from '../types';

const API_BASE = '/api';


export const apiClient = {
  async getHealth() {
    const res = await fetch(`${API_BASE}/health`);
    if (!res.ok) throw new Error('Health check failed');
    return res.json();
  },

  async getModels(): Promise<ModelInfo[]> {
    const res = await fetch(`${API_BASE}/models`);
    if (!res.ok) throw new Error('Failed to retrieve model registry');
    return res.json();
  },

  async classifyImage(file: File, modelName: string): Promise<PredictionResponse> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('model_name', modelName);

    const res = await fetch(`${API_BASE}/predict`, {
      method: 'POST',
      body: formData,
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'Prediction failed' }));
      throw new Error(err.detail || 'Classification failed');
    }
    return res.json();
  },

  async classifyImageCompare(file: File): Promise<ModelComparisonResponse> {
    const formData = new FormData();
    formData.append('file', file);

    const res = await fetch(`${API_BASE}/predict/compare`, {
      method: 'POST',
      body: formData,
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'Comparison failed' }));
      throw new Error(err.detail || 'Comparison classification failed');
    }
    return res.json();
  },

  async getMetrics(): Promise<Record<string, MetricSummary>> {
    const res = await fetch(`${API_BASE}/metrics`);
    if (!res.ok) throw new Error('Failed to load metrics');
    return res.json();
  },

  async getAnalyticsSummary(): Promise<AnalyticsSummary> {
    const res = await fetch(`${API_BASE}/analytics/summary`);
    if (!res.ok) throw new Error('Failed to load analytics summary');
    return res.json();
  },

  async getAnalyticsTrends(days = 14): Promise<AnalyticsTrendPoint[]> {
    const res = await fetch(`${API_BASE}/analytics/trends?days=${days}`);
    if (!res.ok) throw new Error('Failed to load analytics trends');
    return res.json();
  },

  async getTelemetryData(timeRange = '1h', minConfidence = 0.0, limit = 50): Promise<TelemetryDataResponse> {
    const params = new URLSearchParams({
      time_range: timeRange,
      min_confidence: minConfidence.toString(),
      limit: limit.toString(),
    });
    const res = await fetch(`${API_BASE}/analytics/telemetry?${params.toString()}`);
    if (!res.ok) throw new Error('Failed to load live telemetry feed');
    return res.json();
  },


  async getHistory(
    page = 1,
    pageSize = 15,
    modelName?: string,
    category?: string,
    status?: string
  ): Promise<PaginatedHistory> {
    const params = new URLSearchParams({
      page: page.toString(),
      page_size: pageSize.toString(),
    });
    if (modelName) params.append('model_name', modelName);
    if (category) params.append('category', category);
    if (status) params.append('status', status);

    const res = await fetch(`${API_BASE}/history?${params.toString()}`);
    if (!res.ok) throw new Error('Failed to load prediction history');
    return res.json();
  },

  async deleteHistory(id: number) {
    const res = await fetch(`${API_BASE}/history/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Failed to delete history record');
    return res.json();
  },

  async getReports(): Promise<ReportFile[]> {
    const res = await fetch(`${API_BASE}/reports`);
    if (!res.ok) throw new Error('Failed to load report directory');
    return res.json();
  },

  async getHardwareStatus(): Promise<HardwareStatus> {
    const res = await fetch(`${API_BASE}/hardware/status`);
    if (!res.ok) throw new Error('Failed to get hardware status');
    return res.json();
  },

  async emergencyStop(): Promise<HardwareStatus> {
    const res = await fetch(`${API_BASE}/hardware/emergency-stop`, { method: 'POST' });
    if (!res.ok) throw new Error('Failed to trigger emergency stop');
    return res.json();
  },

  async resetEmergencyStop(): Promise<HardwareStatus> {
    const res = await fetch(`${API_BASE}/hardware/reset`, { method: 'POST' });
    if (!res.ok) throw new Error('Failed to reset emergency stop');
    return res.json();
  },

  async manualOverride(bin: string, angle: number) {
    const res = await fetch(`${API_BASE}/hardware/override`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ target_bin: bin, servo_angle_deg: angle }),
    });
    if (!res.ok) throw new Error('Failed to send manual override');
    return res.json();
  }
};
