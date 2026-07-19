'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { MessageSquare, CheckCircle2, XCircle, Clock } from 'lucide-react';
import StatusBadge from '@/components/StatusBadge';
import { adminApi } from '@/lib/api';

interface Dispute {
  id: string;
  orderId: string;
  orderNo?: string;
  reason: string;
  status: string;
  type: string;
  createdAt: string;
  updatedAt: string;
  customerName?: string;
  vendorName?: string;
  resolution?: string;
}

const TYPE_LABELS: Record<string, string> = {
  RETURN: 'Return Request',
  REFUND: 'Refund Request',
  COMPLAINT: 'Complaint',
  QUALITY: 'Quality Issue',
  DELIVERY: 'Delivery Issue',
};

const STATUS_ICONS: Record<string, any> = {
  PENDING: Clock,
  IN_REVIEW: MessageSquare,
  RESOLVED: CheckCircle2,
  REJECTED: XCircle,
  APPROVED: CheckCircle2,
};

export default function DisputesPage() {
  const [disputes, setDisputes] = useState<Dispute[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  useEffect(() => { loadDisputes(); }, []);

  const loadDisputes = async () => {
    setLoading(true);
    try {
      const res = await adminApi.getDisputes();
      setDisputes(Array.isArray(res) ? res : []);
    } catch {
      setDisputes([]);
    } finally {
      setLoading(false);
    }
  };

  const handleResolve = async (id: string, status: string) => {
    setUpdatingId(id);
    try {
      await adminApi.resolveDispute(id, { status, resolution: 'Resolved by admin' });
      loadDisputes();
    } catch {
      // ignore
    } finally {
      setUpdatingId(null);
    }
  };

  const filtered = filter === 'all'
    ? disputes
    : disputes.filter((d) => d.status === filter);

  const statusCounts = {
    all: disputes.length,
    PENDING: disputes.filter((d) => d.status === 'PENDING').length,
    IN_REVIEW: disputes.filter((d) => d.status === 'IN_REVIEW').length,
    RESOLVED: disputes.filter((d) => d.status === 'RESOLVED').length,
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-slate-900">Disputes & Returns</h2>
        <p className="text-sm text-slate-500">Manage refund requests, returns, and customer complaints</p>
      </div>

      {/* Status Tabs */}
      <div className="flex gap-2" role="tablist" aria-label="Dispute status filter">
        {(['all', 'PENDING', 'IN_REVIEW', 'RESOLVED'] as const).map((tab) => (
          <button
            key={tab}
            role="tab"
            aria-selected={filter === tab}
            onClick={() => setFilter(tab)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-150 cursor-pointer ${
              filter === tab
                ? 'bg-emerald-600 text-white'
                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            {tab === 'all' ? 'All' : tab.replace(/_/g, ' ')}
            <span className="ml-1.5 text-xs opacity-70">{statusCounts[tab]}</span>
          </button>
        ))}
      </div>

      {/* Disputes List */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 bg-slate-100 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
          <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto mb-3" aria-hidden="true" />
          <p className="text-slate-500 font-medium">No disputes found</p>
          <p className="text-sm text-slate-400 mt-1">
            {filter === 'all' ? 'All clear — no disputes or return requests.' : `No disputes with status "${filter.replace(/_/g, ' ').toLowerCase()}".`}
          </p>
        </div>
      ) : (
        <div className="space-y-3" role="list" aria-label="Disputes list">
          {filtered.map((dispute) => {
            const StatusIcon = STATUS_ICONS[dispute.status] || Clock;
            const isPending = dispute.status === 'PENDING' || dispute.status === 'IN_REVIEW';
            return (
              <div
                key={dispute.id}
                className="bg-white rounded-xl border border-slate-200 p-5 hover:shadow-sm transition-all duration-150"
                role="listitem"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <div className={`p-2 rounded-lg ${isPending ? 'bg-amber-50' : 'bg-emerald-50'}`}>
                      <StatusIcon className={`w-4 h-4 ${isPending ? 'text-amber-600' : 'text-emerald-600'}`} aria-hidden="true" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-semibold text-slate-800">
                          {TYPE_LABELS[dispute.type] || dispute.type}
                        </span>
                        <StatusBadge status={dispute.status} />
                        {dispute.orderNo && (
                          <Link
                            href={`/orders/${dispute.orderId}`}
                            className="text-xs text-emerald-600 hover:text-emerald-700 font-medium cursor-pointer transition-colors duration-150"
                          >
                            Order #{dispute.orderNo}
                          </Link>
                        )}
                      </div>
                      <p className="text-sm text-slate-600 mt-1 line-clamp-2">{dispute.reason}</p>
                      <div className="flex items-center gap-4 mt-2 text-xs text-slate-400">
                        {dispute.customerName && <span>Customer: {dispute.customerName}</span>}
                        {dispute.vendorName && <span>Vendor: {dispute.vendorName}</span>}
                        <span>{new Date(dispute.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                      </div>
                      {dispute.resolution && (
                        <p className="text-xs text-slate-500 mt-2 bg-slate-50 rounded-lg px-3 py-2">
                          <span className="font-medium">Resolution:</span> {dispute.resolution}
                        </p>
                      )}
                    </div>
                  </div>
                  {isPending && (
                    <div className="flex gap-2 shrink-0">
                      <button
                        onClick={() => handleResolve(dispute.id, 'RESOLVED')}
                        disabled={updatingId === dispute.id}
                        className="px-3 py-1.5 bg-emerald-600 text-white text-xs font-medium rounded-lg hover:bg-emerald-700 disabled:opacity-50 cursor-pointer transition-colors duration-150"
                      >
                        Resolve
                      </button>
                      <button
                        onClick={() => handleResolve(dispute.id, 'REJECTED')}
                        disabled={updatingId === dispute.id}
                        className="px-3 py-1.5 bg-white border border-slate-200 text-slate-600 text-xs font-medium rounded-lg hover:bg-slate-50 disabled:opacity-50 cursor-pointer transition-colors duration-150"
                      >
                        Reject
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
