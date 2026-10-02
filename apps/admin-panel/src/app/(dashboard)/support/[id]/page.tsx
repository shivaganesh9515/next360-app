'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft, Send, MessageSquare, AlertCircle, Loader2, CheckCircle2, UserCheck
} from 'lucide-react';
import {
  adminApi,
  SUPPORT_TICKET_STATUS,
  type SupportTicketDetail,
  type SupportTicketReply,
} from '@/lib/api';
import { useAuth } from '@/lib/auth';

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

/**
 * The four values SupportTicket actually stores (schema.prisma: `status`
 * defaults to OPEN, and SupportService.assign writes ASSIGNED). Deliberately
 * excludes IN_PROGRESS, which appears in the unused UpdateTicketStatusDto but
 * is not a status the schema documents.
 */
const STATUS_OPTIONS = [
  SUPPORT_TICKET_STATUS.OPEN,
  SUPPORT_TICKET_STATUS.ASSIGNED,
  SUPPORT_TICKET_STATUS.RESOLVED,
  SUPPORT_TICKET_STATUS.CLOSED,
];

function formatTime(dateStr: string) {
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
}

function formatFullDate(dateStr: string) {
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

/** A thread entry — either the ticket's opening message or one of its replies. */
interface ThreadEntry {
  id: string;
  author: string;
  role: string;
  message: string;
  timestamp: string;
  isAdmin: boolean;
}

export default function SupportTicketDetailPage() {
  const params = useParams();
  const router = useRouter();
  const ticketId = params.id as string;
  const { user: adminUser } = useAuth();

  const [ticket, setTicket] = useState<SupportTicketDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [assigning, setAssigning] = useState(false);

  const loadTicket = useCallback(async () => {
    setLoading(true);
    try {
      const data = await adminApi.getSupportTicket(ticketId);
      setTicket(data);
      setError(null);
    } catch (err: any) {
      setTicket(null);
      setError(err?.message || 'Could not load this ticket.');
    } finally {
      setLoading(false);
    }
  }, [ticketId]);

  useEffect(() => { loadTicket(); }, [loadTicket]);

  const handleReply = async () => {
    const message = draft.trim();
    if (!message || sending) return;
    setSending(true);
    setActionError(null);
    try {
      await adminApi.replyTicket(ticketId, message);
      setDraft('');
      // Refetch rather than splicing the created reply in: SupportService
      // .addReply returns the bare TicketReply without its nested `user`, so
      // appending it would render an authorless bubble.
      await loadTicket();
    } catch (err: any) {
      setActionError(err?.message || 'Failed to send reply.');
    } finally {
      setSending(false);
    }
  };

  const handleStatusChange = async (status: string) => {
    if (updatingStatus || status === ticket?.status) return;
    setUpdatingStatus(true);
    setActionError(null);
    try {
      await adminApi.updateTicketStatus(ticketId, status);
      await loadTicket();
    } catch (err: any) {
      setActionError(err?.message || 'Failed to update status.');
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleAssignToMe = async () => {
    if (!adminUser?.id || assigning) return;
    setAssigning(true);
    setActionError(null);
    try {
      // This endpoint forces status back to ASSIGNED server-side, so the
      // refetch is what makes the badge agree with the stored record.
      await adminApi.assignTicket(ticketId, adminUser.id);
      await loadTicket();
    } catch (err: any) {
      setActionError(err?.message || 'Failed to assign ticket.');
    } finally {
      setAssigning(false);
    }
  };

  const replies: SupportTicketReply[] = ticket?.replies ?? [];

  // The ticket's own `message` is the customer's opening description and is not
  // part of `replies[]`, so prepend it to render a complete thread.
  const thread: ThreadEntry[] = [];
  if (ticket) {
    thread.push({
      id: `${ticket.id}-opening`,
      author: ticket.user?.name || ticket.user?.email || 'Unknown',
      // SupportService.findOne selects the ticket owner without their role, so
      // the opening message is labelled generically. Only replies carry `role`,
      // which is what identifies an agent message.
      role: 'Requester',
      message: ticket.message,
      timestamp: ticket.createdAt,
      isAdmin: false,
    });
    for (const reply of replies) {
      thread.push({
        id: reply.id,
        author: reply.user?.name || 'Unknown',
        role: reply.user?.role || 'User',
        message: reply.message,
        timestamp: reply.createdAt,
        isAdmin: reply.user?.role === 'ADMIN',
      });
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3 text-sm text-slate-400">
          <Loader2 className="w-5 h-5 animate-spin" />
          Loading ticket…
        </div>
        <div className="h-32 bg-white rounded-xl border border-slate-200 animate-pulse" />
        <div className="h-64 bg-white rounded-xl border border-slate-200 animate-pulse" />
      </div>
    );
  }

  if (error || !ticket) {
    return (
      <div className="space-y-4">
        <button
          onClick={() => router.push('/support')}
          className="flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Support
        </button>
        <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-xl">
          <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5 shrink-0" />
          <div>
            <p className="text-sm font-medium text-amber-800">{error || 'Ticket not found.'}</p>
            <button
              onClick={loadTicket}
              className="mt-2 text-xs font-medium text-amber-700 hover:text-amber-900"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 admin-animate-in">
      {/* Back button + header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => router.back()}
          className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-slate-600" />
        </button>
        <div className="flex-1">
          <div className="flex items-center gap-2 text-sm text-slate-500 mb-1">
            <span className="hover:text-emerald-600 transition-colors cursor-pointer" onClick={() => router.push('/support')}>
              Support
            </span>
            <span>/</span>
            <span className="text-slate-800 font-medium font-mono">{ticketId}</span>
          </div>
          <h2 className="text-xl font-bold text-slate-900">Ticket Detail</h2>
        </div>

        {/* Status badge + status control */}
        <div className="flex items-center gap-2">
          <select
            value={ticket.status}
            disabled={updatingStatus}
            onChange={(e) => handleStatusChange(e.target.value)}
            aria-label="Ticket status"
            className="px-3 py-1.5 bg-white border border-slate-200 rounded-full text-sm font-medium text-slate-700 disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            {STATUS_OPTIONS.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
            {/* Surface any stored status the options above don't cover. */}
            {!STATUS_OPTIONS.includes(ticket.status as any) && (
              <option value={ticket.status}>{ticket.status}</option>
            )}
          </select>
          <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium ${STATUS_STYLES[ticket.status] || STATUS_STYLES.OPEN}`}>
            <AlertCircle className="w-3.5 h-3.5" />
            {ticket.status}
          </span>
        </div>
      </div>

      {/* Action error */}
      {actionError && (
        <div className="flex items-center gap-2 px-4 py-3 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-700">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{actionError}</span>
        </div>
      )}

      {/* Ticket info card */}
      <div className="bg-white rounded-xl border border-slate-200 p-5">
        <h3 className="text-base font-semibold text-slate-900 mb-1">{ticket.subject}</h3>
        <p className="text-sm text-slate-500 mb-4">
          Ticket #{ticket.id} · Created {formatFullDate(ticket.createdAt)}
        </p>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
          <div>
            <span className="text-xs text-slate-400 block">User</span>
            <span className="font-medium text-slate-700">
              {ticket.user?.name || ticket.user?.email || '—'}
            </span>
          </div>
          <div>
            <span className="text-xs text-slate-400 block">Assigned To</span>
            <span className="font-medium text-slate-700 font-mono text-xs">
              {ticket.assignedToId
                ? (ticket.assignedToId === adminUser?.id ? 'You' : `${ticket.assignedToId.slice(0, 8)}…`)
                : '—'}
            </span>
          </div>
          <div>
            <span className="text-xs text-slate-400 block">Priority</span>
            <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${PRIORITY_STYLES[ticket.priority] || PRIORITY_STYLES.LOW}`}>
              {ticket.priority}
            </span>
          </div>
          <div>
            <span className="text-xs text-slate-400 block">Related Order</span>
            <span className="font-mono text-xs text-slate-600">
              {ticket.orderId ? `#${ticket.orderId.slice(0, 8)}` : '—'}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 mt-4 pt-4 border-t border-slate-100">
          <button
            onClick={handleAssignToMe}
            disabled={assigning || !adminUser?.id || ticket.assignedToId === adminUser?.id}
            className="flex items-center gap-2 px-3 py-1.5 text-sm bg-white border border-slate-200 rounded-lg text-slate-700 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {assigning ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserCheck className="w-4 h-4" />}
            {ticket.assignedToId === adminUser?.id ? 'Assigned to you' : 'Assign to me'}
          </button>
          <span className="text-xs text-slate-400">
            Category: {ticket.category}
          </span>
        </div>
      </div>

      {/* Thread */}
      <div className="bg-white rounded-xl border border-slate-200 p-5">
        <h3 className="text-sm font-semibold text-slate-700 uppercase tracking-wider mb-4 flex items-center gap-2">
          <MessageSquare className="w-4 h-4" />
          Conversation Thread
          <span className="font-normal normal-case tracking-normal text-slate-400">
            ({thread.length})
          </span>
        </h3>
        <div className="space-y-4">
          {thread.length === 0 && (
            <p className="text-sm text-slate-400">No messages on this ticket yet.</p>
          )}
          {thread.map((entry) => (
            <div
              key={entry.id}
              className={`flex gap-3 ${entry.isAdmin ? 'flex-row-reverse' : ''}`}
            >
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-xs font-bold ${
                  entry.isAdmin
                    ? 'bg-emerald-100 text-emerald-700'
                    : 'bg-slate-100 text-slate-600'
                }`}
              >
                {entry.author.charAt(0).toUpperCase()}
              </div>
              <div className={`flex-1 max-w-[75%] ${entry.isAdmin ? 'text-right' : ''}`}>
                <div
                  className={`inline-block text-left rounded-xl px-4 py-3 ${
                    entry.isAdmin
                      ? 'bg-emerald-50 border border-emerald-200'
                      : 'bg-slate-50 border border-slate-200'
                  }`}
                >
                  <p className="text-sm text-slate-800 whitespace-pre-wrap">{entry.message}</p>
                </div>
                <div className={`flex items-center gap-2 mt-1 ${entry.isAdmin ? 'justify-end' : ''}`}>
                  <span className="text-xs font-medium text-slate-500">{entry.author}</span>
                  <span className="text-xs text-slate-400">·</span>
                  <span className="text-xs text-slate-400">{entry.role}</span>
                  <span className="text-xs text-slate-400">·</span>
                  <span className="text-xs text-slate-400">{formatTime(entry.timestamp)}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Reply composer */}
      <div className="bg-white rounded-xl border border-slate-200 p-5">
        <h3 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
          <Send className="w-4 h-4" />
          Reply
        </h3>
        <textarea
          rows={3}
          value={draft}
          disabled={sending}
          onChange={(e) => setDraft(e.target.value)}
          className="w-full px-4 py-3 border border-slate-200 rounded-lg text-sm text-slate-800 resize-none focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:opacity-60"
          placeholder="Type your reply…"
        />
        <div className="flex items-center justify-between mt-3">
          <span className="text-xs text-slate-400">
            {draft.trim().length === 0 ? 'Reply is sent to the ticket thread.' : `${draft.trim().length} characters`}
          </span>
          <button
            onClick={handleReply}
            disabled={sending || draft.trim().length === 0}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            {sending ? 'Sending…' : 'Send Reply'}
          </button>
        </div>
      </div>

      {/* Status history footer */}
      <div className="flex items-center gap-2 text-xs text-slate-400">
        <CheckCircle2 className="w-3.5 h-3.5" />
        Last updated {formatFullDate(ticket.updatedAt)}
      </div>
    </div>
  );
}