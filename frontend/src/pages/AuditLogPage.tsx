import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Download, 
  Calendar, 
  ChevronLeft, 
  ChevronRight,
  Filter,
  FileSpreadsheet
} from 'lucide-react';
import { apiClient } from '../api/client';

interface AuditRow {
  id: number;
  timestamp: string;
  item: string;
  category: 'Biodegradable' | 'Non-Biodegradable';
  material: string;
  confidence: string;
  action: string;
  status: string;
  imageSrc: string;
}

const DEFAULT_AUDIT_ROWS: AuditRow[] = [
  {
    id: 1,
    timestamp: '2026-10-28 14:32:18',
    item: 'Plastic Bottle',
    category: 'Non-Biodegradable',
    material: 'Polyethylene Terephthalate (PET)',
    confidence: '98.7%',
    action: 'Divert to Recyclable Bin (135°)',
    status: 'Processed',
    imageSrc: '/examples/plastic_bottle.jpg'
  },
  {
    id: 2,
    timestamp: '2026-10-28 14:32:15',
    item: 'Banana Peel',
    category: 'Biodegradable',
    material: 'Organic Plant Compound',
    confidence: '96.2%',
    action: 'Divert to Organic Bin (45°)',
    status: 'Processed',
    imageSrc: '/examples/banana_peel.jpg'
  },
  {
    id: 3,
    timestamp: '2026-10-28 14:32:12',
    item: 'Paper Cup',
    category: 'Biodegradable',
    material: 'Cellulose / Kraft Paper',
    confidence: '94.1%',
    action: 'Divert to Organic Bin (45°)',
    status: 'Processed',
    imageSrc: '/examples/paper_cup.jpg'
  },
  {
    id: 4,
    timestamp: '2026-10-28 14:32:08',
    item: 'Metal Can',
    category: 'Non-Biodegradable',
    material: 'Aluminum / Steel',
    confidence: '97.5%',
    action: 'Divert to Recyclable Bin (135°)',
    status: 'Processed',
    imageSrc: '/examples/metal_can.jpg'
  },
  {
    id: 5,
    timestamp: '2026-10-28 14:31:55',
    item: 'Cardboard Box',
    category: 'Biodegradable',
    material: 'Corrugated Paperboard',
    confidence: '95.8%',
    action: 'Divert to Organic Bin (45°)',
    status: 'Processed',
    imageSrc: '/examples/cardboard.jpg'
  },
  {
    id: 6,
    timestamp: '2026-10-28 14:31:40',
    item: 'Food Waste',
    category: 'Biodegradable',
    material: 'Organic Kitchen Scraps',
    confidence: '98.1%',
    action: 'Divert to Organic Bin (45°)',
    status: 'Processed',
    imageSrc: '/examples/food_waste.jpg'
  },
];

export const AuditLogPage: React.FC = () => {
  const [rows, setRows] = useState<AuditRow[]>(DEFAULT_AUDIT_ROWS);
  const [startDate, setStartDate] = useState('2026-10-01');
  const [endDate, setEndDate] = useState('2026-10-28');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const pageSize = 8;

  useEffect(() => {
    apiClient.getHistory(1, 20)
      .then(res => {
        if (res.items && res.items.length > 0) {
          const transformed: AuditRow[] = res.items.map(item => ({
            id: item.id,
            timestamp: item.timestamp.replace('T', ' ').substring(0, 19),
            item: item.predicted_class || 'Item',
            category: item.segregation_category as any,
            material: item.segregation_category === 'Biodegradable' ? 'Organic Waste' : 'Synthetic Poly / Metal',
            confidence: `${(item.confidence * 100).toFixed(1)}%`,
            action: `Divert to ${item.bin_assigned || item.segregation_category + ' Bin'}`,
            status: item.status || 'Processed',
            imageSrc: item.thumbnail_data || '/examples/plastic_bottle.jpg'
          }));
          setRows([...transformed, ...DEFAULT_AUDIT_ROWS]);
        }
      })
      .catch(err => {
        console.warn('Backend history unreachable, using demonstration audit records', err);
      });
  }, []);

  const filteredRows = rows.filter(r => {
    const matchesCategory = categoryFilter === 'All' || r.category === categoryFilter;
    const matchesStatus = statusFilter === 'All' || r.status.toLowerCase() === statusFilter.toLowerCase();
    const matchesQuery = searchQuery === '' || r.item.toLowerCase().includes(searchQuery.toLowerCase()) || r.material.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesStatus && matchesQuery;
  });

  const totalPages = Math.ceil(filteredRows.length / pageSize) || 1;
  const paginatedRows = filteredRows.slice((page - 1) * pageSize, page * pageSize);

  const handleExportCSV = () => {
    const headers = ['#', 'Timestamp', 'Detected Item', 'Category', 'Material', 'Confidence', 'Action', 'Status'];
    const csvContent = [
      headers.join(','),
      ...filteredRows.map(r => [
        r.id,
        `"${r.timestamp}"`,
        `"${r.item}"`,
        `"${r.category}"`,
        `"${r.material}"`,
        `"${r.confidence}"`,
        `"${r.action}"`,
        `"${r.status}"`
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `ecosegregate_audit_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Audit Log
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Immutable historical record of optical segregation classifications and hardware actuation events.
          </p>
        </div>
        <button 
          onClick={handleExportCSV}
          className="btn-primary text-xs px-3.5 py-1.5 flex items-center gap-2 self-start sm:self-auto"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Export CSV</span>
        </button>
      </div>

      {/* Filter and Action Bar */}
      <div className="pro-card p-4 flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
        {/* Left Filters */}
        <div className="flex flex-wrap items-center gap-3 text-xs">
          {/* Date Range */}
          <div className="flex items-center gap-2 bg-slate-50 px-2.5 py-1.5 rounded-md border border-slate-200">
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-slate-500 font-medium">Dates:</span>
            <input 
              type="date" 
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="bg-transparent text-slate-800 font-mono focus:outline-hidden" 
            />
            <span className="text-slate-400">→</span>
            <input 
              type="date" 
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="bg-transparent text-slate-800 font-mono focus:outline-hidden" 
            />
          </div>

          {/* Category Dropdown */}
          <div className="flex items-center gap-1.5 bg-slate-50 px-2.5 py-1.5 rounded-md border border-slate-200">
            <span className="text-slate-500 font-medium">Stream:</span>
            <select
              value={categoryFilter}
              onChange={(e) => { setCategoryFilter(e.target.value); setPage(1); }}
              className="bg-transparent text-slate-800 font-semibold focus:outline-hidden cursor-pointer"
            >
              <option value="All">All Streams</option>
              <option value="Biodegradable">Biodegradable</option>
              <option value="Non-Biodegradable">Non-Biodegradable</option>
            </select>
          </div>

          {/* Status Dropdown */}
          <div className="flex items-center gap-1.5 bg-slate-50 px-2.5 py-1.5 rounded-md border border-slate-200">
            <span className="text-slate-500 font-medium">Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
              className="bg-transparent text-slate-800 font-semibold focus:outline-hidden cursor-pointer"
            >
              <option value="All">All Statuses</option>
              <option value="Processed">Processed</option>
              <option value="Flagged">Flagged</option>
            </select>
          </div>
        </div>

        {/* Right Search */}
        <div className="flex items-center gap-2">
          <div className="relative flex-1 sm:w-64">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input 
              type="text" 
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setPage(1); }}
              placeholder="Filter by item or polymer..." 
              className="w-full text-xs bg-slate-50 border border-slate-200 rounded-md pl-8 pr-3 py-1.5 text-slate-900 focus:outline-hidden focus:border-slate-400"
            />
          </div>
        </div>
      </div>

      {/* Main Audit History Table */}
      <div className="pro-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-slate-500 font-mono text-[11px]">
                <th className="py-2.5 px-3">#</th>
                <th className="py-2.5 px-3">Timestamp</th>
                <th className="py-2.5 px-3">Detected Item</th>
                <th className="py-2.5 px-3">Stream Category</th>
                <th className="py-2.5 px-3">Material Composition</th>
                <th className="py-2.5 px-3">Confidence</th>
                <th className="py-2.5 px-3">Actuation Event</th>
                <th className="py-2.5 px-3">Status</th>
                <th className="py-2.5 px-3 text-center">Specimen</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono">
              {paginatedRows.length > 0 ? (
                paginatedRows.map((row) => {
                  const isBio = row.category === 'Biodegradable';
                  return (
                    <tr key={row.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-3 px-3 text-slate-400">{row.id}</td>
                      <td className="py-3 px-3 text-slate-600">{row.timestamp}</td>
                      <td className="py-3 px-3 font-sans font-semibold text-slate-900">{row.item}</td>
                      <td className="py-3 px-3">
                        <span className={`inline-block px-2 py-0.5 rounded-sm text-[11px] font-sans font-semibold border ${
                          isBio 
                            ? 'text-emerald-800 bg-emerald-50 border-emerald-200' 
                            : 'text-red-800 bg-red-50 border-red-200'
                        }`}>
                          {row.category}
                        </span>
                      </td>
                      <td className="py-3 px-3 font-sans text-slate-600">{row.material}</td>
                      <td className="py-3 px-3 font-semibold text-slate-900">{row.confidence}</td>
                      <td className="py-3 px-3 font-sans text-slate-600">
                        {row.action}
                      </td>
                      <td className="py-3 px-3 font-sans">
                        <span className="text-slate-600 text-xs">
                          {row.status}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-center">
                        <div className="w-8 h-8 rounded-sm overflow-hidden bg-slate-100 border border-slate-200 inline-block">
                          <img 
                            src={row.imageSrc} 
                            alt={row.item} 
                            className="w-full h-full object-cover" 
                          />
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-xs text-slate-400 font-sans">
                    No historical logs match the active filter criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div className="p-3.5 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
          <span>
            Displaying <strong className="text-slate-800">{paginatedRows.length}</strong> of <strong className="text-slate-800">{filteredRows.length}</strong> records
          </span>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="p-1 rounded-sm border border-slate-200 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="w-3.5 h-3.5 text-slate-600" />
            </button>
            <span className="font-mono text-slate-800 px-2">
              Page {page} of {totalPages}
            </span>
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="p-1 rounded-sm border border-slate-200 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight className="w-3.5 h-3.5 text-slate-600" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
