'use client';

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { ArrowLeft, RefreshCw, CheckCircle, XCircle, Loader2, AlertTriangle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import DataTable from '@/components/DataTable';
import StatusBadge from '@/components/StatusBadge';
import { adminApi } from '@/lib/api';

export default function RefundsPage() {
  const router = useRouter();
  const [refunds, setRefunds] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [processingId, setProcessingId] = useState<string | null>(null);

  const requestIdRef = useRef(0);

  // Mirrors the backend `ReturnStatus` enum exactly:
  // PENDING | APPROVED | REJECTED | REFUNDED.
  // The previous list included REQUESTED, which does not exist on the backend
  // and therefore could never match a row.
  const refundStatuses = ['', 'PENDING', 'APPROVED', 'REJECTED', 'REFUNDED'];
  const refundStatusLabels: Record<string, string> = {
    '': 'All',
    PENDING: 'Pending',
    APPROVED: 'Approved',
    REJECTED: 'Rejected',
    REFUNDED: 'Refunded',
  };

  // BACKEND CONTRACT: GET /returns/refunds takes NO query parameters. The
  // service hardcodes `status IN ('PENDING','APPROVED','REFUNDED')` and returns
  // the whole set as a bare array, so sending page/limit/status/search would be
  // silently ignored. The status tabs and the search box below therefore filter
  // the returned rows CLIENT-SIDE, which is safe here because the endpoint
  // always returns the complete dataset in one response.
  useEffect(() => { loadRefunds(); }, []);

  const loadRefunds = useCallback(async () => {
    const requestId = ++requestIdRef.current;
    setLoading(true);
    try {
      const res = await adminApi.getRefunds();
      if (requestId !== requestIdRef.current) return;
      setRefunds(Array.isArray(res) ? res : []);
      setError(null);
    } catch (err: any) {
      if (requestId !== requestIdRef.current) return;
      setRefunds([]);
      setError(err?.message || 'Could not load refunds.');
    } finally {
      if (requestId === requestIdRef.current) setLoading(false);
    }
  }, []);

  // Client-side filter over the full returned dataset (see note above).
  const visibleRefunds = useMemo(() => {
    const q = search.trim().toLowerCase();
    return refunds.filter((r) => {
      if (statusFilter && r.status !== statusFilter) return false;
      if (!q) return true;
      return [r.order?.orderNo, r.user?.name, r.user?.email, r.reason, r.status]
        .some((v) => (v == null ? '' : String(v)).toLowerCase().includes(q));
    });
  }, [refunds, statusFilter, search]);

  const handleRefundAction = async (id: string, status: 'APPROVED' | 'REJECTED') => {
    setProcessingId(id);
    try {
      // Uses the existing adminApi method for the real backend route
      // `PATCH /returns/:id`. The previous code called
      // `fetch('/api/returns/:id/approve'|'reject')`, which hit the Next.js
      // app instead of the API base, sent no Authorization header, and checked
      // no response status - so it silently did nothing and the admin saw a
      // spinner resolve with no change.
      await adminApi.updateReturnStatus(id, status);
      await loadRefunds();
    } catch (err: any) {
      alert(err?.message || `Failed to ${status === 'APPROVED' ? 'approve' : 'reject'} refund`);
    } finally {
      setProcessingId(null);
    }
  };

  const columns = [
    { key: 'orderNumber', label: 'Order', render: (r: any) => <span className="font-mono text-xs">{r.order?.orderNo || r.orderId?.slice(0, 8)}</span> },
    { key: 'user', label: 'Customer', render: (r: any) => r.user?.name || '-' },
    { key: 'amount', label: 'Amount', render: (r: any) => {
      // The field is `refundAmount`, not `amount`. Prisma Decimal
      // (@db.Decimal(10,2)) serialises as a JSON string, so coerce with Number()
      // before formatting. Guard null/undefined/'' explicitly first, because
      // Number(null) is 0 and would render a misleading "₹0".
      const raw = r.refundAmount;
      const amount = raw === null || raw === undefined || raw === '' ? NaN : Number(raw);
      return (
        <span className="font-mono font-bold">
          {Number.isFinite(amount) ? `₹${amount.toLocaleString('en-IN')}` : '—'}
        </span>
      );
    } },
    { key: 'reason', label: 'Reason', render: (r: any) => <span className="text-sm text-gray-600 line-clamp-1">{r.reason || '-'}</span> },
    { key: 'status', label: 'Status', render: (r: any) => <StatusBadge status={r.status} /> },
    { key: 'createdAt', label: 'Date', render: (r: any) => new Date(r.createdAt).toLocaleDateString() },
    { key: 'actions', label: 'Actions', render: (r: any) => {
      // Only PENDING returns can be actioned - the backend rejects processing
      // anything that is not PENDING ("Return is already ...").
      if (r.status !== 'PENDING') {
        return <span className="text-xs text-gray-400">—</span>;
      }
      return (
        <div className="flex gap-1">
          <button
            disabled={processingId === r.id}
            onClick={(e) => { e.stopPropagation(); handleRefundAction(r.id, 'APPROVED'); }}
            className="px-2 py-1 text-xs bg-emerald-100 text-emerald-700 rounded hover:bg-emerald-200 disabled:opacity-50 flex items-center gap-1">
            {processingId === r.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCircle className="w-3 h-3" />}
            Approve
          </button>
          <button
            disabled={processingId === r.id}
            onClick={(e) => { e.stopPropagation(); handleRefundAction(r.id, 'REJECTED'); }}
            className="px-2 py-1 text-xs bg-red-100 text-red-700 rounded hover:bg-red-200 disabled:opacity-50 flex items-center gap-1">
            {processingId === r.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <XCircle className="w-3 h-3" />}
            Reject
          </button>
        </div>
      );
    }},
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <button onClick={() => router.back()} className="p-2 hover:bg-gray-100 rounded-lg"><ArrowLeft className="w-5 h-5" /></button>
        <div><h2 className="text-xl font-bold text-gray-800">Refunds</h2><p className="text-sm text-gray-500">Track refund requests and processing</p></div>
      </div>
      <div className="flex gap-2 flex-wrap">
        {refundStatuses.map((s) => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              statusFilter === s ? 'bg-emerald-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {refundStatusLabels[s]}
          </button>
        ))}
      </div>

      {error && (
        <div className="flex items-center gap-2 px-4 py-3 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-700">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
          <button onClick={loadRefunds} className="ml-auto text-amber-600 hover:text-amber-800 text-xs font-medium">
            Retry
          </button>
        </div>
      )}

      <DataTable columns={columns} data={visibleRefunds} loading={loading} searchable searchPlaceholder="Search refunds..." onSearch={setSearch} emptyMessage={<><p>{error ? 'Could not load refunds' : 'No refund records'}</p><p className="text-xs text-gray-400 mt-1">{error ? 'Check your connection and try again.' : 'Refund requests and processing history will appear here.'}</p></>} emptyIcon={<RefreshCw className="w-10 h-10" />} />
    </div>
  );
}
