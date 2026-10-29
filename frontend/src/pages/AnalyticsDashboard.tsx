import React, { useEffect, useState } from 'react';
import { 
  BarChart3, 
  TrendingUp, 
  Layers, 
  Clock, 
  CheckCircle2, 
  AlertTriangle,
  RefreshCw,
  Cpu,
  ShieldCheck,
  Zap
} from 'lucide-react';
import { 
  PieChart, 
  Pie, 
  Cell, 
  Tooltip, 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Legend, 
  AreaChart, 
  Area 
} from 'recharts';
import { apiClient } from '../api/client';
import { AnalyticsSummary, AnalyticsTrendPoint, MetricSummary } from '../types';

export const AnalyticsDashboard: React.FC = () => {
  const [summary, setSummary] = useState<AnalyticsSummary | null>(null);
  const [trends, setTrends] = useState<AnalyticsTrendPoint[]>([]);
  const [metrics, setMetrics] = useState<Record<string, MetricSummary>>({});
  const [loading, setLoading] = useState<boolean>(true);

  const loadData = async () => {
    setLoading(true);
    try {
      const [sumData, trendData, metData] = await Promise.all([
        apiClient.getAnalyticsSummary(),
        apiClient.getAnalyticsTrends(14),
        apiClient.getMetrics(),
      ]);
      setSummary(sumData);
      setTrends(trendData);
      setMetrics(metData);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#8b5cf6', '#ec4899', '#64748b'];

  const categoryChartData = summary?.category_breakdown
    ? Object.entries(summary.category_breakdown).map(([name, value]) => ({ name, value }))
    : [];

  const modelUsageData = summary?.model_usage
    ? Object.entries(summary.model_usage).map(([name, count]) => ({
        name: name.replace('_', ' ').toUpperCase(),
        count,
      }))
    : [];

  return (
    <div className="space-y-8 py-4 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-emerald-600" />
            Live Analytics & Telemetry Dashboard
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Real-time deployment statistics strictly separated from offline validation benchmarks.
          </p>
        </div>

        <button
          onClick={loadData}
          disabled={loading}
          className="px-3.5 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold flex items-center gap-2 shadow-xs transition"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          Refresh Live Metrics
        </button>
      </div>

      {/* SECTION 1: LIVE INFERENCE TELEMETRY */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200">
            Stream 1: Live Application Telemetry
          </span>
          <span className="text-xs text-slate-400">Aggregated from active SQLite records</span>
        </div>

        {summary && summary.total_predictions > 0 ? (
          <>
            {/* KPI Summary Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
                <span className="text-xs font-semibold text-slate-500 block mb-1">Total Predictions</span>
                <p className="text-2xl font-black text-slate-900">{summary.total_predictions}</p>
                <span className="text-[11px] text-slate-400 mt-1 block">Live user + camera requests</span>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
                <span className="text-xs font-semibold text-emerald-600 block mb-1">Biodegradable Items</span>
                <p className="text-2xl font-black text-emerald-700">{summary.biodegradable_count}</p>
                <span className="text-[11px] text-slate-400 mt-1 block">
                  {((summary.biodegradable_count / summary.total_predictions) * 100).toFixed(1)}% of total stream
                </span>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
                <span className="text-xs font-semibold text-blue-600 block mb-1">Non-Biodegradable Items</span>
                <p className="text-2xl font-black text-blue-700">{summary.non_biodegradable_count}</p>
                <span className="text-[11px] text-slate-400 mt-1 block">
                  {((summary.non_biodegradable_count / summary.total_predictions) * 100).toFixed(1)}% of total stream
                </span>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
                <span className="text-xs font-semibold text-amber-600 block mb-1">Avg Latency & Confidence</span>
                <p className="text-2xl font-black text-slate-900 font-mono">
                  {summary.average_latency_ms} <span className="text-xs font-normal text-slate-500">ms</span>
                </p>
                <span className="text-[11px] text-slate-400 mt-1 block font-mono">
                  Mean Conf: {(summary.average_confidence * 100).toFixed(1)}%
                </span>
              </div>
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Pie: Waste Category Breakdown */}
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
                <h3 className="font-bold text-slate-900 text-sm mb-4">
                  Predicted Waste Category Distribution
                </h3>
                {categoryChartData.length > 0 ? (
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={categoryChartData}
                          dataKey="value"
                          nameKey="name"
                          cx="50%"
                          cy="50%"
                          outerRadius={85}
                          label={({ name, percent }: any) => `${name} (${((percent || 0) * 100).toFixed(0)}%)`}
                        >
                          {categoryChartData.map((_, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <p className="text-xs text-slate-400 py-12 text-center">No category distribution data.</p>
                )}
              </div>

              {/* Bar: Model Usage Distribution */}
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
                <h3 className="font-bold text-slate-900 text-sm mb-4">
                  Model Architecture Utilization
                </h3>
                {modelUsageData.length > 0 ? (
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={modelUsageData}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <XAxis dataKey="name" fontSize={11} />
                        <YAxis allowDecimals={false} fontSize={11} />
                        <Tooltip />
                        <Bar dataKey="count" fill="#10b981" radius={[6, 6, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <p className="text-xs text-slate-400 py-12 text-center">No model usage recorded.</p>
                )}
              </div>
            </div>
          </>
        ) : (
          <div className="bg-white border border-dashed border-slate-300 rounded-2xl p-10 text-center">
            <Clock className="w-8 h-8 text-slate-400 mx-auto mb-2" />
            <h4 className="font-bold text-slate-800 text-sm">No Live Prediction Telemetry Yet</h4>
            <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
              Classify specimens in the Segregation Workspace to populate real-time streaming telemetry and category charts.
            </p>
          </div>
        )}
      </div>

      {/* SECTION 2: OFFLINE TEST BENCHMARK METRICS */}
      <div className="space-y-4 pt-6 border-t border-slate-200">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-purple-800 bg-purple-50 px-2.5 py-1 rounded-md border border-purple-200">
            Stream 2: Offline Test-Set Evaluation Metrics
          </span>
          <span className="text-xs text-slate-400">Strictly computed on untouched test split</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {['mobilenet_v2', 'resnet50', 'efficientnet_b0'].map((mKey) => {
            const m = metrics[mKey];
            if (!m) return null;

            return (
              <div key={mKey} className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <h4 className="font-bold text-slate-900 text-sm">{m.display_name}</h4>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    m.status === 'evaluated' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'
                  }`}>
                    {m.status === 'evaluated' ? 'Evaluated' : 'Pending'}
                  </span>
                </div>

                {m.status === 'evaluated' ? (
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div className="p-2 bg-slate-50 rounded-lg">
                      <span className="text-slate-400 block text-[10px]">Test Accuracy</span>
                      <span className="font-mono font-bold text-slate-900 text-base">
                        {m.accuracy !== null ? `${(m.accuracy * 100).toFixed(1)}%` : 'N/A'}
                      </span>
                    </div>
                    <div className="p-2 bg-slate-50 rounded-lg">
                      <span className="text-slate-400 block text-[10px]">Macro F1-Score</span>
                      <span className="font-mono font-bold text-emerald-700 text-base">
                        {m.macro_f1 !== null ? (m.macro_f1).toFixed(4) : 'N/A'}
                      </span>
                    </div>
                    <div className="p-2 bg-slate-50 rounded-lg">
                      <span className="text-slate-400 block text-[10px]">Benchmarked Latency</span>
                      <span className="font-mono font-bold text-slate-900 text-base">
                        {m.inference_latency_ms} ms
                      </span>
                    </div>
                    <div className="p-2 bg-slate-50 rounded-lg">
                      <span className="text-slate-400 block text-[10px]">Saved Model Size</span>
                      <span className="font-mono font-bold text-slate-900 text-base">
                        {m.model_size_mb} MB
                      </span>
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-slate-400 py-4 text-center">Evaluation pending training execution.</p>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
