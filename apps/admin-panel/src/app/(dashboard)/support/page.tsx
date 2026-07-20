'use client';

import { useState } from 'react';
import {
  LifeBuoy, MessageSquare, Clock, CheckCircle2,
  AlertCircle, Inbox, ArrowUpRight
} from 'lucide-react';
import StatsCard from '@/components/StatsCard';

const STATUS_TABS = [
  { value: 'open', label: 'Open', icon: AlertCircle },
  { value: 'assigned', label: 'Assigned', icon: Inbox },
  { value: 'resolved', label: 'Resolved', icon: CheckCircle2 },
  { value: 'all', label: 'All', icon: Inbox },
];

const MOCK_TICKETS = [
  { id: 'TKT-001', subject: 'Unable to complete vendor KYC verification', user: 'Green Earth Farms', status: 'OPEN', priority: 'HIGH', date: '2026-07-19T10:30:00Z', assigned: '—' },
  { id: 'TKT-002', subject: 'Payment settlement delay for Order #ORD-4582', user: 'Organic Valley', status: 'ASSIGNED', priority: 'HIGH', date: '2026-07-19T08:15:00Z', assigned: 'Admin Support' },
  { id: 'TKT-003', subject: 'Product image upload failing with 413 error', user: 'Pure Living Co.', status: 'OPEN', priority: 'MEDIUM', date: '2026-07-18T16:45:00Z', assigned: '—' },
  { id: 'TKT-004', subject: 'Wrong delivery address for Order #ORD-4561', user: 'Ravi Kumar', status: 'RESOLVED', priority: 'LOW', date: '2026-07-18T11:20:00Z', assigned: 'Tech Support' },
  { id: 'TKT-005', subject: 'Request to update commission rate from 15% to 12%', user: 'Eco Essentials', status: 'ASSIGNED', priority: 'MEDIUM', date: '2026-07-17T09:00:00Z', assigned: 'Accounts' },
];

const STATUS_STYLES: Record<string, string> = {
  OPEN: 'bg-amber-100 text-amber-700',
  ASSIGNED: 'bg-blue-100 text-blue-700',
  RESOLVED: 'bg-emerald-100 text-emerald-700',
  CLOSED: 'bg-slate-100 text-slate-600',
};

const PRIORITY_STYLES: Record<string, string> = {
  HIGH: 'bg-red-100 text-red-700',
  MEDIUM: 'bg-amber-100 text-amber-700',
  LOW: 'bg-slate-100 text-slate-600',
};

function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

export default function SupportPage() {
  const [activeTab, setActiveTab] = useState('open');

  return (
    <div className="space-y-6 admin-animate-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Support Tickets</h2>
          <p className="text-sm text-slate-500">Manage customer and vendor support requests</p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 bg-amber-50 border border-amber-200 rounded-lg">
          <AlertCircle className="w-4 h-4 text-amber-600" />
          <span className="text-xs text-amber-700 font-medium">
            Backend integration pending — showing preview data
          </span>
        </div>
      </div>

      {/* Summary cards (preview) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 opacity-80">
        <StatsCard label="Open Tickets" value="24" icon={<LifeBuoy className="w-5 h-5" />} color="amber" />
        <StatsCard label="Resolved Today" value="8" icon={<CheckCircle2 className="w-5 h-5" />} color="emerald" />
        <StatsCard label="Avg Response Time" value="2.4h" icon={<Clock className="w-5 h-5" />} color="blue" />
        <StatsCard label="Pending Your Action" value="12" icon={<Inbox className="w-5 h-5" />} color="purple" />
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

      {/* Tickets table (preview) */}
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
              {MOCK_TICKETS.map((ticket) => (
                <tr
                  key={ticket.id}
                  className="border-b border-slate-50 last:border-0 hover:bg-slate-50/50 transition-colors cursor-pointer group"
                  onClick={() => window.location.href = `/support/${ticket.id}`}
                >
                  <td className="px-4 py-3">
                    <span className="font-mono text-xs font-medium text-slate-700">{ticket.id}</span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-slate-700 group-hover:text-emerald-700 transition-colors">
                        {ticket.subject}
                      </span>
                      <ArrowUpRight className="w-3 h-3 text-slate-300 group-hover:text-emerald-500 transition-colors shrink-0" />
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-600">{ticket.user}</td>
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
                  <td className="px-4 py-3 text-sm text-slate-500">{ticket.assigned}</td>
                  <td className="px-4 py-3 text-right text-sm text-slate-400 tabular-nums">{formatDate(ticket.date)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Backend notice */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl px-5 py-4">
        <div className="flex items-start gap-3">
          <MessageSquare className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-blue-800">Support Module — Backend Pending</p>
            <p className="text-xs text-blue-600 mt-1">
              The Support module is assigned to Ashwanth's team for backend implementation. 
              Once the API endpoints are available, this page will display real data from the backend.
              Planned features include: ticket creation, threaded replies, status updates,
              assignee management, priority escalation, and search/filter.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
