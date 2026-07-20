'use client';

import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, LifeBuoy, Paperclip, Send, MessageSquare, AlertCircle } from 'lucide-react';

const MOCK_REPLIES = [
  {
    id: '1',
    author: 'Ravi Kumar',
    role: 'Customer',
    message: 'I placed an order 3 days ago but the status still shows "Confirmed". It hasn\'t moved to "Packed" yet. Can you check what\'s happening?',
    timestamp: '2026-07-19T10:30:00Z',
    isAdmin: false,
  },
  {
    id: '2',
    author: 'Admin Support',
    role: 'Support Agent',
    message: 'Thank you for reaching out. I can see Order #ORD-4582 is currently awaiting inventory confirmation from the vendor. I\'ve sent a reminder to the vendor and will update you as soon as there\'s movement. Expected resolution: within 24 hours.',
    timestamp: '2026-07-19T11:15:00Z',
    isAdmin: true,
  },
  {
    id: '3',
    author: 'Ravi Kumar',
    role: 'Customer',
    message: 'Thank you for the update. I\'ll wait for 24 hours then.',
    timestamp: '2026-07-19T11:30:00Z',
    isAdmin: false,
  },
];

export default function SupportTicketDetailPage() {
  const params = useParams();
  const router = useRouter();
  const ticketId = params.id as string;

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

        {/* Status badge placeholder */}
        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-100 text-amber-700 rounded-full text-sm font-medium">
          <AlertCircle className="w-3.5 h-3.5" />
          OPEN
        </span>
      </div>

      {/* Backend notice */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl px-5 py-3 flex items-center gap-3">
        <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
        <p className="text-sm text-amber-700">
          <span className="font-medium">Backend pending:</span> This is a preview of the ticket detail page.
          The Support module backend is assigned to Ashwanth's team.
        </p>
      </div>

      {/* Ticket info card */}
      <div className="bg-white rounded-xl border border-slate-200 p-5">
        <h3 className="text-base font-semibold text-slate-900 mb-1">
          Order status not updating after 3 days
        </h3>
        <p className="text-sm text-slate-500 mb-4">Ticket #{ticketId} · Created 19 Jul 2026</p>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
          <div>
            <span className="text-xs text-slate-400 block">User</span>
            <span className="font-medium text-slate-700">Ravi Kumar</span>
          </div>
          <div>
            <span className="text-xs text-slate-400 block">Assigned To</span>
            <span className="font-medium text-slate-700">—</span>
          </div>
          <div>
            <span className="text-xs text-slate-400 block">Priority</span>
            <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700">HIGH</span>
          </div>
          <div>
            <span className="text-xs text-slate-400 block">Related Order</span>
            <span className="font-mono text-xs text-slate-600">#ORD-4582</span>
          </div>
        </div>
      </div>

      {/* Thread */}
      <div className="bg-white rounded-xl border border-slate-200 p-5">
        <h3 className="text-sm font-semibold text-slate-700 uppercase tracking-wider mb-4 flex items-center gap-2">
          <MessageSquare className="w-4 h-4" />
          Conversation Thread
        </h3>
        <div className="space-y-4">
          {MOCK_REPLIES.map((reply) => (
            <div
              key={reply.id}
              className={`flex gap-3 ${reply.isAdmin ? 'flex-row-reverse' : ''}`}
            >
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-xs font-bold ${
                  reply.isAdmin
                    ? 'bg-emerald-100 text-emerald-700'
                    : 'bg-slate-100 text-slate-600'
                }`}
              >
                {reply.author.charAt(0)}
              </div>
              <div className={`flex-1 max-w-[75%] ${reply.isAdmin ? 'text-right' : ''}`}>
                <div
                  className={`inline-block text-left rounded-xl px-4 py-3 ${
                    reply.isAdmin
                      ? 'bg-emerald-50 border border-emerald-200'
                      : 'bg-slate-50 border border-slate-200'
                  }`}
                >
                  <p className="text-sm text-slate-800">{reply.message}</p>
                </div>
                <div className={`flex items-center gap-2 mt-1 ${reply.isAdmin ? 'justify-end' : ''}`}>
                  <span className="text-xs font-medium text-slate-500">{reply.author}</span>
                  <span className="text-xs text-slate-400">·</span>
                  <span className="text-xs text-slate-400">
                    {new Date(reply.timestamp).toLocaleString('en-IN', {
                      hour: '2-digit', minute: '2-digit', hour12: true,
                    })}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Reply composer (placeholder) */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 opacity-70">
        <h3 className="text-sm font-semibold text-slate-700 mb-3">Reply</h3>
        <textarea
          rows={3}
          disabled
          className="w-full px-4 py-3 border border-slate-200 rounded-lg text-sm text-slate-400 resize-none focus:outline-none"
          placeholder="Type your reply... (available after backend integration)"
        />
        <div className="flex items-center justify-between mt-3">
          <button disabled className="flex items-center gap-2 px-3 py-1.5 text-sm text-slate-400 border border-slate-200 rounded-lg">
            <Paperclip className="w-4 h-4" />
            Attach
          </button>
          <button disabled className="flex items-center gap-2 px-4 py-2 bg-emerald-600/50 text-white rounded-lg text-sm cursor-not-allowed">
            <Send className="w-4 h-4" />
            Send Reply
          </button>
        </div>
      </div>
    </div>
  );
}
