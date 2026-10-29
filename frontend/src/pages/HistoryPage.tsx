import React, { useEffect, useState } from 'react';
import { 
  Clock, 
  Trash2, 
  Filter, 
  ChevronLeft, 
  ChevronRight, 
  Search, 
  Eye, 
  X, 
  ShieldCheck,
  AlertTriangle
} from 'lucide-react';
import { apiClient } from '../api/client';
import { HistoryItem, PaginatedHistory } from '../types';

export const HistoryPage: React.FC = () => {
  const [data, setData] = useState<PaginatedHistory>({ total: 0, page: 1, page_size: 10, items: [] });
  const [page, setPage] = useState<number>(1);
  const [modelFilter, setModelFilter] = useState<string>('');
  const [categoryFilter, setCategoryFilter] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [selectedItem, setSelectedItem] = useState<HistoryItem | null>(null);

  const loadHistory = async () => {
    setLoading(true);
    try {
      const res = await apiClient.getHistory(
        page,
        10,
        modelFilter || undefined,
        categoryFilter || undefined,
        statusFilter || undefined
      );
      setData(res);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadHistory();
  }, [page, modelFilter, categoryFilter, statusFilter]);

  const handleDelete = async (id: number) => {
    if (!window.confirm('Delete this prediction record?')) return;
    try {
      await apiClient.deleteHistory(id);
      loadHistory();
      if (selectedItem?.id === id) setSelectedItem(null);
    } catch (e) {
      alert('Failed to delete item');
    }
  };

  const totalPages = Math.ceil(data.total / data.page_size) || 1;

  return (
    <div className="space-y-6 py-4 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <Clock className="w-6 h-6 text-emerald-600" />
            Audit History & Classification Log
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Persisted SQLite records of historical inference requests, confidence scores, and diverter actuations.
          </p>
        </div>

        <div className="text-xs text-slate-500 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200">
          Data Retention: <span className="font-semibold text-slate-700">Audit logs stored locally; thumbnails held in SQLite</span>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-wrap items-center gap-4 text-xs">
        <div className="flex items-center gap-1.5 font-semibold text-slate-700">
          <Filter className="w-4 h-4 text-slate-400" />
          <span>Filters:</span>
        </div>

        {/* Model Filter */}
        <select
          value={modelFilter}
          onChange={(e) => {
            setModelFilter(e.target.value);
            setPage(1);
          }}
          className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-slate-700 focus:ring-1 focus:ring-emerald-500"
        >
          <option value="">All Models</option>
          <option value="mobilenet_v2">MobileNetV2</option>
          <option value="resnet50">ResNet50</option>
          <option value="efficientnet_b0">EfficientNetB0</option>
        </select>

        {/* Category Filter */}
        <select
          value={categoryFilter}
          onChange={(e) => {
            setCategoryFilter(e.target.value);
            setPage(1);
          }}
          className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-slate-700 focus:ring-1 focus:ring-emerald-500"
        >
          <option value="">All Streams</option>
          <option value="Biodegradable">Biodegradable</option>
          <option value="Non-Biodegradable">Non-Biodegradable</option>
        </select>

        {/* Status Filter */}
        <select
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value);
            setPage(1);
          }}
          className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-slate-700 focus:ring-1 focus:ring-emerald-500"
        >
          <option value="">All Statuses</option>
          <option value="success">Success</option>
          <option value="uncertain">Uncertain / Inspection</option>
        </select>

        {(modelFilter || categoryFilter || statusFilter) && (
          <button
            onClick={() => {
              setModelFilter('');
              setCategoryFilter('');
              setStatusFilter('');
              setPage(1);
            }}
            className="text-emerald-700 font-semibold hover:underline ml-auto"
          >
            Clear Filters
          </button>
        )}
      </div>

      {/* Table */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 text-slate-700 font-semibold uppercase text-[11px] border-b border-slate-200">
              <tr>
                <th className="px-4 py-3">Timestamp</th>
                <th className="px-4 py-3">Specimen</th>
                <th className="px-4 py-3">Predicted Class</th>
                <th className="px-4 py-3">Stream</th>
                <th className="px-4 py-3">Model</th>
                <th className="px-4 py-3">Confidence</th>
                <th className="px-4 py-3">Diverter Bin</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {data.items.length > 0 ? (
                data.items.map((item) => {
                  const isBio = item.segregation_category === 'Biodegradable';
                  const dateStr = new Date(item.timestamp).toLocaleString();

                  return (
                    <tr key={item.id} className="hover:bg-slate-50/70 transition">
                      <td className="px-4 py-3 font-mono text-[11px] text-slate-500 whitespace-nowrap">
                        {dateStr}
                      </td>
                      <td className="px-4 py-3">
                        {item.thumbnail_data ? (
                          <img
                            src={item.thumbnail_data}
                            alt="Specimen"
                            className="w-9 h-9 rounded-md object-cover border border-slate-200"
                          />
                        ) : (
                          <div className="w-9 h-9 rounded-md bg-slate-100 border border-slate-200 flex items-center justify-center text-[10px] text-slate-400">
                            N/A
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3 font-semibold text-slate-900 capitalize">
                        {item.predicted_class}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                          isBio ? 'bg-emerald-50 text-emerald-800' : 'bg-blue-50 text-blue-800'
                        }`}>
                          {item.segregation_category}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-medium text-slate-700 capitalize">
                        {item.model_name.replace('_', ' ')}
                      </td>
                      <td className="px-4 py-3 font-mono font-bold text-slate-800">
                        {(item.confidence * 100).toFixed(1)}%
                      </td>
                      <td className="px-4 py-3 text-slate-600 font-medium">
                        {item.bin_assigned} ({item.servo_angle_deg}°)
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                          item.status === 'uncertain'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-emerald-100 text-emerald-800'
                        }`}>
                          {item.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right whitespace-nowrap">
                        <button
                          onClick={() => setSelectedItem(item)}
                          className="p-1 text-slate-400 hover:text-emerald-700 transition mr-1"
                          title="View details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(item.id)}
                          className="p-1 text-slate-400 hover:text-red-600 transition"
                          title="Delete record"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={9} className="px-4 py-12 text-center text-slate-400">
                    No prediction records match the selected criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        <div className="p-4 bg-slate-50/70 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
          <span>
            Showing <strong className="text-slate-700">{data.items.length}</strong> of{' '}
            <strong className="text-slate-700">{data.total}</strong> records
          </span>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 transition"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="font-medium text-slate-700">
              Page {page} of {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 transition"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Detail Modal */}
      {selectedItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl max-w-md w-full overflow-hidden shadow-2xl border border-slate-200 p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-sm">Prediction Record #{selectedItem.id}</h3>
              <button
                onClick={() => setSelectedItem(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {selectedItem.thumbnail_data && (
              <div className="w-32 h-32 mx-auto rounded-xl overflow-hidden bg-slate-100 border border-slate-200">
                <img
                  src={selectedItem.thumbnail_data}
                  alt="Specimen"
                  className="w-full h-full object-cover"
                />
              </div>
            )}

            <div className="space-y-2 text-xs text-slate-700">
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-400">Timestamp:</span>
                <span className="font-mono">{new Date(selectedItem.timestamp).toLocaleString()}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-400">Stream:</span>
                <span className="font-bold text-emerald-700">{selectedItem.segregation_category}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-400">Predicted Class:</span>
                <span className="font-semibold capitalize">{selectedItem.predicted_class}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-400">Model Used:</span>
                <span className="capitalize">{selectedItem.model_name.replace('_', ' ')}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-400">Confidence:</span>
                <span className="font-mono font-bold">{(selectedItem.confidence * 100).toFixed(2)}%</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-400">Target Bin:</span>
                <span className="font-semibold">{selectedItem.bin_assigned}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-400">Servo Angle:</span>
                <span className="font-mono">{selectedItem.servo_angle_deg}°</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-400">Inference Latency:</span>
                <span className="font-mono">{selectedItem.inference_time_ms} ms</span>
              </div>
            </div>

            <button
              onClick={() => setSelectedItem(null)}
              className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-xs transition"
            >
              Close Details
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
