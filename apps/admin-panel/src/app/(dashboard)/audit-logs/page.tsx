'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  ClipboardList, Users, AlertTriangle, Clock,
  ChevronDown, Search, RefreshCw, Calendar,
  XCircle, Filter, ChevronRight, BarChart3
} from 'lucide-react';
import StatsCard from '@/components/StatsCard';
import DataTable from '@/components/DataTable';
import StatusBadge from '@/components/StatusBadge';
import { adminApi } from '@/lib/api';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer
} from 'recharts';

/* ─── Types ─────────────────────────────────────────────── */

interface AuditLog {
  id: string;
  timestamp: string;
  user: { id: string; name: string; email: string } | string | null;
  action: string;
  module: string;
  resource: string;
  resourceId: string;
  status: string;
  ipAddress: string;
  details: Record<string, any> | string | null;
}

interface AuditSummary {
  totalLogs: number;
  todayCount: number;
  failedActions: number;
  activeUsers: number;
  uniqueModules: number;
}

const DEFAULT_SUMMARY: AuditSummary = {
  totalLogs: 0,
  todayCount: 0,
  failedActions: 0,
  activeUsers: 0,
  uniqueModules: 0,
};

/* ─── Filter Constants ──────────────────────────────────── */

const ACTION_OPTIONS = [
  { value: '', label: 'All Actions' },
  { value: 'CREATE', label: 'Create' },
  { value: 'UPDATE', label: 'Update' },
  { value: 'DELETE', label: 'Delete' },
  { value: 'LOGIN', label: 'Login' },
  { value: 'LOGOUT', label: 'Logout' },
  { value: 'APPROVE', label: 'Approve' },
  { value: 'REJECT', label: 'Reject' },
  { value: 'CANCEL', label: 'Cancel' },
  { value: 'REFUND', label: 'Refund' },
  { value: 'EXPORT', label: 'Export' },
];

const MODULE_OPTIONS = [
  { value: '', label: 'All Modules' },
  { value: 'Users', label: 'Users' },
  { value: 'Vendors', label: 'Vendors' },
  { value: 'Products', label: 'Products' },
  { value: 'Orders', label: 'Orders' },
  { value: 'Payments', label: 'Payments' },
  { value: 'Categories', label: 'Categories' },
  { value: 'Delivery', label: 'Delivery' },
  { value: 'Auth', label: 'Auth' },
  { value: 'Settings', label: 'Settings' },
  { value: 'CMS', label: 'CMS' },
  { value: 'Roles', label: 'Roles & Permissions' },
  { value: 'Zones', label: 'Zones' },
  { value: 'Disputes', label: 'Disputes' },
  { value: 'Reports', label: 'Reports' },
];

const DATE_RANGES = [
  { value: '24h', label: 'Last 24 Hours' },
  { value: '7d', label: 'Last 7 Days' },
  { value: '30d', label: 'Last 30 Days' },
  { value: '90d', label: 'Last 90 Days' },
  { value: 'all', label: 'All Time' },
];

/* ─── Helper Components ─────────────────────────────────── */

function ActionBadge({ action }: { action: string }) {
  const colors: Record<string, string> = {
    CREATE: 'bg-emerald-100 text-emerald-700',
    UPDATE: 'bg-blue-100 text-blue-700',
    DELETE: 'bg-red-100 text-red-700',
    LOGIN: 'bg-purple-100 text-purple-700',
    LOGOUT: 'bg-gray-100 text-gray-600',
    APPROVE: 'bg-emerald-100 text-emerald-700',
    REJECT: 'bg-red-100 text-red-700',
    CANCEL: 'bg-amber-100 text-amber-700',
    REFUND: 'bg-rose-100 text-rose-700',
    EXPORT: 'bg-indigo-100 text-indigo-700',
  };

  const cls = colors[action?.toUpperCase()] || 'bg-slate-100 text-slate-700';

  return (
    <span className={`inline-flex px-2 py-0.5 rounded-md text-xs font-medium ${cls}`}>
      {action || '—'}
    </span>
  );
}

function ModuleBadge({ module }: { module: string }) {
  const moduleColors: Record<string, string> = {
    Auth: 'bg-violet-100 text-violet-700',
    Users: 'bg-sky-100 text-sky-700',
    Vendors: 'bg-orange-100 text-orange-700',
    Products: 'bg-emerald-100 text-emerald-700',
    Orders: 'bg-blue-100 text-blue-700',
    Payments: 'bg-cyan-100 text-cyan-700',
    Settings: 'bg-slate-100 text-slate-700',
    CMS: 'bg-rose-100 text-rose-700',
    Roles: 'bg-indigo-100 text-indigo-700',
    Zones: 'bg-teal-100 text-teal-700',
    Disputes: 'bg-red-100 text-red-700',
    Delivery: 'bg-amber-100 text-amber-700',
    Reports: 'bg-purple-100 text-purple-700',
    Categories: 'bg-pink-100 text-pink-700',
  };

  const cls = moduleColors[module] || 'bg-slate-100 text-slate-700';

  return (
    <span className={`inline-flex px-2 py-0.5 rounded-md text-xs font-medium ${cls}`}>
      {module || '—'}
    </span>
  );
}

function DetailPanel({ details }: { details: Record<string, any> | string | null }) {
  if (!details) {
    return <span className="text-slate-400 text-xs italic">No details available</span>;
  }

  const parsed: Record<string, any> =
    typeof details === 'string'
      ? (() => { try { return JSON.parse(details); } catch { return { raw: details }; } })()
      : details;

  return (
    <div className="bg-slate-50 rounded-lg p-4 font-mono text-xs border border-slate-200 max-h-64 overflow-y-auto">
      <pre className="whitespace-pre-wrap text-slate-700 leading-relaxed">
        {JSON.stringify(parsed, null, 2)}
      </pre>
    </div>
  );
}

function formatTimestamp(ts: string): { date: string; time: string; full: string } {
  const d = new Date(ts);
  const date = d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  const time = d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
  const full = `${date} ${time}`;
  return { date, time, full };
}

/* ─── Main Page ─────────────────────────────────────────── */

export default function AuditLogsPage() {
  /* ── State ── */
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [summary, setSummary] = useState<AuditSummary>(DEFAULT_SUMMARY);
  const [loading, setLoading] = useState(true);
  const [summaryLoading, setSummaryLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');

  // Filters
  const [actionFilter, setActionFilter] = useState('');
  const [moduleFilter, setModuleFilter] = useState('');
  const [dateRange, setDateRange] = useState('7d');

  // Detail expand
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const toggleExpand = (id: string) => {
    setExpandedId(prev => (prev === id ? null : id));
  };

  /* ── Load summary ── */
  const loadSummary = useCallback(async () => {
    setSummaryLoading(true);
    try {
      const res = await adminApi.getAuditLogsSummary({ period: dateRange });
      const d = res?.data || res || {};
      setSummary({
        totalLogs: d.totalLogs ?? d.total ?? 0,
        todayCount: d.todayCount ?? d.today ?? 0,
        failedActions: d.failedCount ?? d.failedActions ?? d.errors ?? 0,
        activeUsers: d.activeUsers ?? d.uniqueUsers ?? 0,
        uniqueModules: d.uniqueModules ?? d.modules ?? 0,
      });
    } catch {
      setSummary(DEFAULT_SUMMARY);
    } finally {
      setSummaryLoading(false);
    }
  }, [dateRange]);

  /* ── Load logs ── */
  const loadLogs = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params: Record<string, any> = {
        page,
        limit: 20,
      };
      if (actionFilter) params.action = actionFilter;
      if (moduleFilter) params.module = moduleFilter;
      if (dateRange !== 'all') params.period = dateRange;
      if (searchQuery) params.search = searchQuery;

      const res = await adminApi.getAuditLogs(params);
      const logList = Array.isArray(res) ? res : (res?.data || []);
      setLogs(logList);
      setTotalPages(res?.meta?.totalPages || Math.max(1, Math.ceil(logList.length / 20)));
    } catch (err: any) {
      setError(err.message || 'Failed to load audit logs');
      setLogs([]);
    } finally {
      setLoading(false);
    }
  }, [page, actionFilter, moduleFilter, dateRange, searchQuery]);

  useEffect(() => {
    loadSummary();
  }, [loadSummary]);

  useEffect(() => {
    loadLogs();
  }, [loadLogs]);

  /* ── Reset page when filters change ── */
  useEffect(() => {
    setPage(1);
  }, [actionFilter, moduleFilter, dateRange]);

  /* ── Compute action chart data (derived from logs) ── */
  const actionChartData = useMemo(() => {
    const counts: Record<string, number> = {};
    logs.forEach(log => {
      const action = log.action || 'UNKNOWN';
      counts[action] = (counts[action] || 0) + 1;
    });
    return Object.entries(counts)
      .map(([action, count]) => ({ action, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8);
  }, [logs]);

  /* ── Handlers ── */
  const handleRefresh = () => {
    loadSummary();
    loadLogs();
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    setPage(1);
  };

  /* ── Columns ── */
  const columns = [
    {
      key: 'timestamp',
      label: 'Timestamp',
      render: (log: AuditLog) => {
        const { full } = formatTimestamp(log.timestamp);
        return (
          <span className="text-sm text-slate-700 font-mono text-xs tabular-nums whitespace-nowrap">
            {full}
          </span>
        );
      },
      headerRender: () => (
        <div className="flex items-center gap-1.5">
          <Clock className="w-3.5 h-3.5 text-slate-400" />
          <span>Timestamp</span>
        </div>
      ),
    },
    {
      key: 'user',
      label: 'User',
      render: (log: AuditLog) => {
        const userName =
          typeof log.user === 'object' && log.user !== null
            ? (log.user as any).name || (log.user as any).email || '—'
            : typeof log.user === 'string'
              ? log.user
              : '—';
        return <span className="text-sm text-slate-700 font-medium">{userName}</span>;
      },
    },
    {
      key: 'action',
      label: 'Action',
      render: (log: AuditLog) => <ActionBadge action={log.action} />,
    },
    {
      key: 'module',
      label: 'Module',
      render: (log: AuditLog) => <ModuleBadge module={log.module} />,
    },
    {
      key: 'resource',
      label: 'Resource',
      render: (log: AuditLog) => (
        <div className="flex flex-col">
          <span className="text-sm text-slate-700">{log.resource || '—'}</span>
          {log.resourceId && (
            <span className="text-xs text-slate-400 font-mono truncate max-w-[120px]">
              {log.resourceId.slice(0, 12)}…
            </span>
          )}
        </div>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      render: (log: AuditLog) => (
        log.status === 'SUCCESS' || log.status === 'COMPLETED'
          ? <StatusBadge status="ACTIVE" />
          : log.status === 'FAILURE' || log.status === 'FAILED' || log.status === 'ERROR'
            ? <StatusBadge status="CANCELLED" />
            : <StatusBadge status={log.status || 'PENDING'} />
      ),
    },
    {
      key: 'ipAddress',
      label: 'IP Address',
      render: (log: AuditLog) => (
        <span className="text-xs font-mono text-slate-400 tabular-nums">
          {log.ipAddress || '—'}
        </span>
      ),
    },
  ];

  return (
    <div className="space-y-6 admin-animate-in">
      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Audit Logs</h2>
          <p className="text-sm text-slate-500">
            Track all administrative actions and system changes
          </p>
        </div>
        <button
          onClick={handleRefresh}
          disabled={loading || summaryLoading}
          className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-600 hover:bg-slate-50 hover:border-slate-300 disabled:opacity-50 transition-all duration-150"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* ── Summary Cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          label="Total Logs"
          value={summaryLoading ? '...' : summary.totalLogs.toLocaleString()}
          icon={<ClipboardList className="w-5 h-5" />}
          color="blue"
          loading={summaryLoading}
        />
        <StatsCard
          label="Today's Activity"
          value={summaryLoading ? '...' : summary.todayCount.toLocaleString()}
          icon={<Clock className="w-5 h-5" />}
          color="emerald"
          loading={summaryLoading}
        />
        <StatsCard
          label="Failed Actions"
          value={summaryLoading ? '...' : summary.failedActions.toLocaleString()}
          icon={<AlertTriangle className="w-5 h-5" />}
          color={summary.failedActions > 0 ? 'red' : 'amber'}
          loading={summaryLoading}
        />
        <StatsCard
          label="Active Users"
          value={summaryLoading ? '...' : summary.activeUsers.toLocaleString()}
          icon={<Users className="w-5 h-5" />}
          color="purple"
          loading={summaryLoading}
        />
      </div>

      {/* ── Action Distribution Chart ── */}
      <div className="bg-white rounded-xl border border-slate-200 p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-slate-700">Top Actions Today</h3>
          {!loading && logs.length > 0 && (
            <span className="text-xs text-slate-400 tabular-nums">
              {actionChartData.reduce((sum, d) => sum + d.count, 0)} total
            </span>
          )}
        </div>
        {!loading && logs.length > 0 && actionChartData.length > 0 ? (
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={actionChartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="action" tick={{ fontSize: 11, fill: '#94A3B8' }} stroke="#E2E8F0" />
              <YAxis tick={{ fontSize: 11, fill: '#94A3B8' }} stroke="#E2E8F0" allowDecimals={false} />
              <Tooltip
                contentStyle={{ borderRadius: 8, border: '1px solid #E2E8F0', fontSize: 12, boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                formatter={(value: any) => [value ?? 0, 'Actions']}
              />
              <Bar dataKey="count" fill="#10B981" radius={[4, 4, 0, 0]} name="Count" />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-[200px] flex flex-col items-center justify-center text-slate-400">
            <BarChart3 className="w-8 h-8 mb-2 opacity-40" />
            <p className="text-xs">No action data available</p>
          </div>
        )}
      </div>

      {/* ── Filters ── */}
      <div className="flex items-center gap-3 flex-wrap">
        {/* Action filter */}
        <div className="relative">
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
          <select
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            className="appearance-none pl-9 pr-8 py-2 text-sm border border-slate-200 rounded-lg bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all duration-150"
          >
            {ACTION_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
          <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
        </div>

        {/* Module filter */}
        <div className="relative">
          <select
            value={moduleFilter}
            onChange={(e) => setModuleFilter(e.target.value)}
            className="appearance-none pl-3 pr-8 py-2 text-sm border border-slate-200 rounded-lg bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all duration-150"
          >
            {MODULE_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
          <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
        </div>

        {/* Date range */}
        <div className="relative">
          <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="appearance-none pl-9 pr-8 py-2 text-sm border border-slate-200 rounded-lg bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all duration-150"
          >
            {DATE_RANGES.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
          <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
        </div>

        {/* Active filter indicator */}
        {(actionFilter || moduleFilter) && (
          <button
            onClick={() => { setActionFilter(''); setModuleFilter(''); }}
            className="flex items-center gap-1.5 px-3 py-2 text-xs text-slate-500 hover:text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
          >
            <XCircle className="w-3.5 h-3.5" />
            Clear filters
          </button>
        )}

        {/* Result count */}
        <div className="ml-auto text-xs text-slate-400 tabular-nums">
          {!loading && `${logs.length} log(s)`}
        </div>
      </div>

      {/* ── Error State ── */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 flex items-center justify-between admin-animate-in">
          <div className="flex items-center gap-2 text-sm text-red-700">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
          <button
            onClick={handleRefresh}
            className="text-xs text-red-600 hover:text-red-800 font-medium underline"
          >
            Retry
          </button>
        </div>
      )}

      {/* ── Search + Table ── */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        {/* Inline search */}
        <div className="p-4 border-b border-slate-100">
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              placeholder="Search by user, action, resource..."
              className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all duration-150"
            />
          </div>
        </div>

        {/* Table */}
        {loading ? (
          <div className="p-6 space-y-3">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-12 bg-slate-100 rounded-lg animate-pulse" />
            ))}
          </div>
        ) : logs.length === 0 ? (
          <div className="py-16 text-center text-slate-400 admin-animate-in">
            <ClipboardList className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p className="text-sm font-medium text-slate-500">No audit logs found</p>
            <p className="text-xs mt-1 text-slate-400 max-w-sm mx-auto">
              {searchQuery || actionFilter || moduleFilter
                ? 'Try adjusting your filters or search query'
                : 'Audit logs will appear here as administrators perform actions on the platform'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/50">
                  <th className="w-10 px-3 py-3"></th>
                  {columns.map((col) => (
                    <th
                      key={col.key}
                      className="text-left px-3 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider"
                    >
                      {col.headerRender ? col.headerRender() : col.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => (
                  <tr key={log.id} className="group">
                    <td className="px-3 py-2.5">
                      <button
                        onClick={() => toggleExpand(log.id)}
                        className="p-1 rounded hover:bg-slate-100 transition-colors"
                        aria-label={expandedId === log.id ? 'Collapse details' : 'Expand details'}
                      >
                        <ChevronRight
                          className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-150 ${
                            expandedId === log.id ? 'rotate-90' : ''
                          }`}
                        />
                      </button>
                    </td>
                    {columns.map((col) => (
                      <td key={col.key} className="px-3 py-2.5 text-sm text-slate-700">
                        {col.render ? col.render(log) : (log as any)[col.key]}
                      </td>
                    ))}
                  </tr>
                ))}
                {/* Expanded detail rows */}
                {logs
                  .filter((log) => expandedId === log.id)
                  .map((log) => (
                    <tr key={`detail-${log.id}`} className="admin-animate-in">
                      <td colSpan={8} className="px-6 py-4 bg-slate-50/50 border-b border-slate-100">
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                          <div className="lg:col-span-2">
                            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                              Details
                            </p>
                            <DetailPanel details={log.details} />
                          </div>
                          <div className="space-y-2">
                            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                              Metadata
                            </p>
                            <div className="bg-white rounded-lg border border-slate-200 p-3 space-y-2 text-xs">
                              <div className="flex justify-between">
                                <span className="text-slate-400">Log ID</span>
                                <span className="font-mono text-slate-700">{log.id?.slice(0, 16)}…</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-slate-400">Resource ID</span>
                                <span className="font-mono text-slate-700">{log.resourceId ? `${log.resourceId.slice(0, 16)}…` : '—'}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-slate-400">Timestamp</span>
                                <span className="text-slate-700">{formatTimestamp(log.timestamp).full}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-slate-400">IP Address</span>
                                <span className="font-mono text-slate-700">{log.ipAddress || '—'}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        )}

        {/* ── Pagination ── */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-slate-100">
            <span className="text-sm text-slate-500 tabular-nums">
              Page <span className="font-medium text-slate-700">{page}</span> of{' '}
              <span className="font-medium text-slate-700">{totalPages}</span>
            </span>
            <div className="flex gap-1">
              <button
                onClick={() => setPage(Math.max(1, page - 1))}
                disabled={page <= 1}
                className="px-3 py-1.5 text-sm border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-150"
              >
                Previous
              </button>
              <button
                onClick={() => setPage(Math.min(totalPages, page + 1))}
                disabled={page >= totalPages}
                className="px-3 py-1.5 text-sm border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-150"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
