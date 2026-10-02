'use client';

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { ArrowLeft, RotateCcw, AlertTriangle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import DataTable from '@/components/DataTable';
import StatusBadge from '@/components/StatusBadge';
import { adminApi } from '@/lib/api';

export default function ReturnsPage() {
  const router = useRouter();
  const [returns, setReturns] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [processingId, setProcessingId] = useState<string | null>(null);

  const requestIdRef = useRef(0);

  // Mirrors the backend `ReturnStatus` enum exactly:
  // PENDING | APPROVED | REJECTED | REFUNDED.
  // Only these values are ever sent as the `status` query param.
  const returnStatuses = ['', 'PENDING', 'APPROVED', 'REJECTED'];
  const returnStatusLabels: Record<string, string> = {
    '': 'All',
    PENDING: 'Pending',
    APPROVED: 'Approved',
    REJECTED: 'Rejected',
  };

  // BACKEND CONTRACT: GET /returns only accepts a `status` query param - it has
  // no page, limit or search support and returns the whole result set as a bare
  // array. So the status tabs filter server-side (that one IS supported), while
  // the search box filters CLIENT-SIDE over the complete returned dataset.
  // No pagination controls are rendered, because there is no pagination to drive.
  useEffect(() => { loadReturns(); }, [statusFilter]);

  const loadReturns = useCallback(async () => {
    const requestId = ++requestIdRef.current;
    setLoading(true);
    try {
      const res = statusFilter
        ? await adminApi.getReturns({ status: statusFilter })
        : await adminApi.getReturns();
      if (requestId !== requestIdRef.current) return;
      setReturns(Array.isArray(res) ? res : []);
      setError(null);
    } catch (err: any) {
      if (requestId !== requestIdRef.current) return;
      setReturns([]);
      setError(err?.message || 'Could not load return requests.');
    } finally {
      if (requestId === requestIdRef.current) setLoading(false);
    }
  }, [statusFilter]);

  // Client-side filter over the full returned dataset (see note above).
  const visibleReturns = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return returns;
    return returns.filter((r) =>
      [r.order?.orderNo, r.user?.name, r.user?.email, r.reason, r.status]
        .some((v) => (v == null ? '' : String(v)).toLowerCase().includes(q))
    );
  }, [returns, search]);

  const handleReturnAction = async (id: string, status: 'APPROVED' | 'REJECTED') => {
    setProcessingId(id);
    try {
      await adminApi.updateReturnStatus(id, status);
      await loadReturns();
    } catch (err: any) {
      alert(err?.message || `Failed to ${status === 'APPROVED' ? 'approve' : 'reject'} return`);
    } finally {
      setProcessingId(null);
    }
  };

  const columns = [
    { key: 'orderNumber', label: 'Order', render: (r: any) => <span className="font-mono text-xs">{r.order?.orderNo || r.orderId?.slice(0, 8)}</span> },
    { key: 'user', label: 'Customer', render: (r: any) => r.user?.name || '-' },
    { key: 'reason', label: 'Reason', render: (r: any) => <span className="text-sm text-gray-600 line-clamp-1">{r.reason || '-'}</span> },
    { key: 'status', label: 'Status', render: (r: any) => <StatusBadge status={r.status} /> },
    { key: 'createdAt', label: 'Requested', render: (r: any) => new Date(r.createdAt).toLocaleDateString() },
    { key: 'actions', label: 'Actions', render: (r: any) => (
      <div className="flex gap-1">
        {r.status === 'PENDING' && <>
          <button disabled={processingId === r.id} onClick={(e) => { e.stopPropagation(); handleReturnAction(r.id, 'APPROVED'); }} className="px-2 py-1 text-xs bg-emerald-100 text-emerald-700 rounded hover:bg-emerald-200 disabled:opacity-50">Approve</button>
          <button disabled={processingId === r.id} onClick={(e) => { e.stopPropagation(); handleReturnAction(r.id, 'REJECTED'); }} className="px-2 py-1 text-xs bg-red-100 text-red-700 rounded hover:bg-red-200 disabled:opacity-50">Reject</button>
        </>}
      </div>
    )},
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <button onClick={() => router.back()} className="p-2 hover:bg-gray-100 rounded-lg"><ArrowLeft className="w-5 h-5" /></button>
        <div><h2 className="text-xl font-bold text-gray-800">Returns</h2><p className="text-sm text-gray-500">Manage return requests</p></div>
      </div>
      <div className="flex gap-2 flex-wrap">
        {returnStatuses.map((s) => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              statusFilter === s ? 'bg-emerald-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {returnStatusLabels[s]}
          </button>
        ))}
      </div>

      {error && (
        <div className="flex items-center gap-2 px-4 py-3 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-700">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
          <button onClick={loadReturns} className="ml-auto text-amber-600 hover:text-amber-800 text-xs font-medium">
            Retry
          </button>
        </div>
      )}

      <DataTable columns={columns} data={visibleReturns} loading={loading} searchable searchPlaceholder="Search returns..." onSearch={setSearch} emptyMessage={<><p>{error ? 'Could not load return requests' : 'No return requests'}</p><p className="text-xs text-gray-400 mt-1">{error ? 'Check your connection and try again.' : 'Customer return requests will appear here once they are submitted.'}</p></>} emptyIcon={<RotateCcw className="w-10 h-10" />} />
    </div>
  );
}
