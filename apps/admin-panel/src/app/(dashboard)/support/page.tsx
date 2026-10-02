'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  LifeBuoy, MessageSquare, AlertCircle, Inbox, ArrowUpRight,
  CheckCircle2, Loader2
} from 'lucide-react';
import StatsCard from '@/components/StatsCard';
import { adminApi, type SupportTicket } from '@/lib/api';

/**
 * Tab `value` drives the UI selection; `apiStatus` is what gets sent to
 * GET /support/tickets. The two differ because SupportService.findAll filters
 * with an exact `where.status = status` match against the uppercase values it
 * stores — sending a lowercase 'open' returns zero rows, and 'all' is only
 * treated as "no filter" when it equals 'ALL'.
 */
const STATUS_TABS = [
  { value: 'open', apiStatus: 'OPEN', label: 'Open', icon: AlertCircle },
  { value: 'assigned', apiStatus: 'ASSIGNED', label: 'Assigned', icon: Inbox },
  { value: 'resolved', apiStatus: 'RESOLVED', label: 'Resolved', icon: CheckCircle2 },
  { value: 'all', apiStatus: 'ALL', label: 'All', icon: Inbox },
];

const STATUS_STYLES: Record<string, string> = {
  OPEN: 'bg-amber-100 text-amber-700',
  ASSIGNED: 'bg-blue-100 text-blue-700',
  RESOLVED: 'bg-emerald-100 text-emerald-700',
  CLOSED: 'bg-slate-100 text-slate-600',
};

const PRIORITY_STYLES: Record<string, string> = {
  URGENT: 'bg-red-100 text-red-700',
  HIGH: 'bg-red-100 text-red-700',
  MEDIUM: 'bg-amber-100 text-amber-700',
  LOW: 'bg-slate-100 text-slate-600',
};

function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

/**
 * The list endpoint selects only `assignedToId`, never the assignee's profile,
 * so there is no name to display here — show a short id rather than inventing
 * one. The detail endpoint does resolve the full ticket.
 */
function formatAssignee(assignedToId: string | null) {
  if (!assignedToId) return '—';
  return `${assignedToId.slice(0, 8)}…`;
}

export default function SupportPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('open');

  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const activeTabMeta = STATUS_TABS.find((t) => t.value === activeTab) ?? STATUS_TABS[0];

  const loadTickets = useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminApi.getSupportTickets(activeTabMeta.apiStatus);
      // normalizePayload collapses the double-wrapped { data, meta } page object
      // into the array itself, with meta/total/totalPages attached to it.
      const list = Array.isArray(res) ? res : [];
      setTickets(list);
      // The count for the active filter. SupportService returns the total
      // *inside* `meta` ({ total, page, limit, totalPages }), so `meta.total` is
      // the authoritative read — normalizePayload only attaches a top-level
      // `total` when the page object carries one itself, which this one does not.
      const metaTotal = (res as any)?.meta?.total ?? (res as any)?.total;
      setTotal(typeof metaTotal === 'number' ? metaTotal : list.length);
      setError(null);
    } catch (err: any) {
      // Surface the failure instead of falling back to an empty table, which
      // would render an "empty state" and disguise a 401/403/500 as no data.
      setTickets([]);
      setTotal(0);
      setError(err?.message || 'Could not load support tickets.');
    } finally {
      setLoading(false);
    }
  }, [activeTabMeta.apiStatus]);

  useEffect(() => { loadTickets(); }, [loadTickets]);

  // Derived from the rows actually returned. The controller never forwards
  // page/limit, so the response is capped at 20 — these describe the current
  // filter only, which the caption above the cards states explicitly.
  const unassignedCount = tickets.filter((t) => !t.assignedToId).length;
  const awaitingReplyCount = tickets.filter((t) => (t._count?.replies ?? 0) === 0).length;
  const replyCount = tickets.reduce((sum, t) => sum + (t._count?.replies ?? 0), 0);

  return (
    <div className="space-y-6 admin-animate-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Support Tickets</h2>
          <p className="text-sm text-slate-500">Manage customer and vendor support requests</p>
        </div>
        <button
          onClick={loadTickets}
          disabled={loading}
          className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-50 transition-colors"
        >
          {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Inbox className="w-3.5 h-3.5" />}
          Refresh
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-center gap-2 px-4 py-3 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-700">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
          <button
            onClick={loadTickets}
            className="ml-auto text-amber-600 hover:text-amber-800 text-xs font-medium"
          >
            Retry
          </button>
        </div>
      )}

      {/* Summary cards — scoped to the active filter */}
      <div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatsCard label={`${activeTabMeta.label} Tickets`} value={total} icon={<LifeBuoy className="w-5 h-5" />} color="amber" loading={loading} />
          <StatsCard label="Unassigned" value={unassignedCount} icon={<AlertCircle className="w-5 h-5" />} color="purple" loading={loading} />
          <StatsCard label="Awaiting Reply" value={awaitingReplyCount} icon={<MessageSquare className="w-5 h-5" />} color="blue" loading={loading} />
          <StatsCard label="Total Replies" value={replyCount} icon={<CheckCircle2 className="w-5 h-5" />} color="emerald" loading={loading} />
        </div>
        <p className="text-xs text-slate-400 mt-2">
          Counts reflect the “{activeTabMeta.label}” filter
          {activeTabMeta.value === 'all' ? ' and the first page of results' : ''}.
        </p>
      </div>

      {/* Status tabs */}
      <div className="flex gap-1 bg-slate-100 p-1 rounded-lg w-fit">
        {STATUS_TABS.map((tab) => (
          <button
            key={tab.value}
            onClick={() => setActiveTab(tab.value)}
            className={`flex items-center gap-2 px-4 py-2 text-sm rounded-md transition-colors ${
              activeTab === tab.value
                ? 'bg-white text-emerald-700 shadow-sm font-medium'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tickets table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/50">
                <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">Ticket</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">Subject</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">User</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">Status</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">Priority</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">Assigned To</th>
                <th className="text-right px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">Date</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td colSpan={7} className="px-4 py-10 text-center text-sm text-slate-400">
                    <Loader2 className="w-5 h-5 mx-auto mb-2 animate-spin" />
                    Loading tickets…
                  </td>
                </tr>
              )}

              {!loading && error && (
                <tr>
                  <td colSpan={7} className="px-4 py-10 text-center text-sm text-slate-400">
                    Could not load tickets.
                  </td>
                </tr>
              )}

              {!loading && !error && tickets.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-10 text-center text-sm text-slate-400">
                    No {activeTabMeta.label.toLowerCase()} tickets.
                  </td>
                </tr>
              )}

              {!loading && !error && tickets.map((ticket) => (
                <tr
                  key={ticket.id}
                  className="border-b border-slate-50 last:border-0 hover:bg-slate-50/50 transition-colors cursor-pointer group"
                  onClick={() => router.push(`/support/${ticket.id}`)}
                >
                  <td className="px-4 py-3">
                    <span className="font-mono text-xs font-medium text-slate-700">
                      {ticket.id.slice(0, 8)}…
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-slate-700 group-hover:text-emerald-700 transition-colors">
                        {ticket.subject}
                      </span>
                      {(ticket._count?.replies ?? 0) > 0 && (
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-slate-100 text-slate-500 text-[10px] font-medium shrink-0">
                          <MessageSquare className="w-2.5 h-2.5" />
                          {ticket._count?.replies}
                        </span>
                      )}
                      <ArrowUpRight className="w-3 h-3 text-slate-300 group-hover:text-emerald-500 transition-colors shrink-0" />
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-600">
                    {ticket.user?.name || ticket.user?.email || '—'}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_STYLES[ticket.status] || STATUS_STYLES.OPEN}`}>
                      {ticket.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${PRIORITY_STYLES[ticket.priority] || PRIORITY_STYLES.LOW}`}>
                      {ticket.priority}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-500 font-mono text-xs">
                    {formatAssignee(ticket.assignedToId)}
                  </td>
                  <td className="px-4 py-3 text-right text-sm text-slate-400 tabular-nums">
                    {formatDate(ticket.createdAt)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}