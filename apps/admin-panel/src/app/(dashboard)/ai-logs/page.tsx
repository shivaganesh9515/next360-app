'use client';

import { useState, useEffect } from 'react';
import { adminApi } from '@/lib/api';
import StatusBadge from '@/components/StatusBadge';

interface AiLog {
  id: string;
  type: string;
  input: string;
  output: string;
  userId: string;
  user?: { id: string; name: string; email: string };
  createdAt: string;
}

export default function AiLogsPage() {
  const [logs, setLogs] = useState<AiLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ type: '', userId: '', startDate: '', endDate: '' });
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => { fetchLogs(); }, [page, filters]);

  const fetchLogs = async () => {
    try {
      const params: Record<string, any> = { page, limit: 20 };
      if (filters.type) params.type = filters.type;
      if (filters.userId) params.userId = filters.userId;
      if (filters.startDate) params.startDate = filters.startDate;
      if (filters.endDate) params.endDate = filters.endDate;

      const res = await adminApi.getAILogs(params);
      const data = res as any;
      setLogs(data.logs || data.data || (Array.isArray(data) ? data : []));
      setTotalPages(data.totalPages || 1);
    } catch {
      // AI logs unavailable
    } finally {
      setLoading(false);
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'CHAT': return 'blue';
      case 'SCANNER': return 'green';
      case 'RECOMMENDATION': return 'purple';
      case 'HEALTH_INSIGHT': return 'orange';
      default: return 'gray';
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-slate-900">AI Logs</h2>
        <p className="text-sm text-slate-500">Track AI feature usage across the platform</p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-slate-200 p-4">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <select
            value={filters.type}
            onChange={(e) => { setFilters({ ...filters, type: e.target.value }); setPage(1); }}
            className="px-3 py-2 border border-slate-200 rounded-lg text-sm"
          >
            <option value="">All Types</option>
            <option value="CHAT">Chat</option>
            <option value="SCANNER">Scanner</option>
            <option value="RECOMMENDATION">Recommendation</option>
            <option value="HEALTH_INSIGHT">Health Insight</option>
          </select>
          <input
            type="date"
            value={filters.startDate}
            onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
            className="px-3 py-2 border border-slate-200 rounded-lg text-sm"
            placeholder="Start date"
          />
          <input
            type="date"
            value={filters.endDate}
            onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
            className="px-3 py-2 border border-slate-200 rounded-lg text-sm"
            placeholder="End date"
          />
          <button
            onClick={() => { setPage(1); fetchLogs(); }}
            className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm hover:bg-emerald-700 transition-colors"
          >
            Apply
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100">
                <th className="text-left py-3 px-4 font-medium text-slate-500 text-xs uppercase">User</th>
                <th className="text-left py-3 px-4 font-medium text-slate-500 text-xs uppercase">Type</th>
                <th className="text-left py-3 px-4 font-medium text-slate-500 text-xs uppercase">Input</th>
                <th className="text-left py-3 px-4 font-medium text-slate-500 text-xs uppercase">Output</th>
                <th className="text-left py-3 px-4 font-medium text-slate-500 text-xs uppercase">Date</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={5} className="py-12 text-center text-slate-400">Loading...</td></tr>
              ) : logs.length === 0 ? (
                <tr><td colSpan={5} className="py-12 text-center text-slate-400">No logs found</td></tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                    <td className="py-3 px-4">
                      <div className="font-medium text-slate-800">{log.user?.name || 'Unknown'}</div>
                      <div className="text-xs text-slate-400">{log.user?.email}</div>
                    </td>
                    <td className="py-3 px-4"><StatusBadge status={log.type} color={getTypeColor(log.type)} /></td>
                    <td className="py-3 px-4"><div className="text-slate-600 max-w-[200px] truncate">{log.input}</div></td>
                    <td className="py-3 px-4"><div className="text-slate-600 max-w-[200px] truncate">{log.output}</div></td>
                    <td className="py-3 px-4 whitespace-nowrap text-slate-400 tabular-nums">
                      {new Date(log.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-slate-100">
            <p className="text-sm text-slate-500">Page <span className="font-medium">{page}</span> of <span className="font-medium">{totalPages}</span></p>
            <div className="flex gap-2">
              <button onClick={() => setPage(Math.max(1, page - 1))} disabled={page === 1} className="px-3 py-1.5 text-sm border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-40 transition-colors">Previous</button>
              <button onClick={() => setPage(Math.min(totalPages, page + 1))} disabled={page === totalPages} className="px-3 py-1.5 text-sm border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-40 transition-colors">Next</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
