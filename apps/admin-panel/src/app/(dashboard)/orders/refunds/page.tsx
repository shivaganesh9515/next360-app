'use client';

import { useState, useEffect } from 'react';
import { ArrowLeft, RefreshCw, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import DataTable from '@/components/DataTable';
import StatusBadge from '@/components/StatusBadge';
import { adminApi } from '@/lib/api';

export default function RefundsPage() {
  const router = useRouter();
  const [refunds, setRefunds] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');
  const [processingId, setProcessingId] = useState<string | null>(null);

  const refundStatuses = ['', 'PENDING', 'REQUESTED', 'APPROVED', 'REJECTED'];
  const refundStatusLabels: Record<string, string> = {
    '': 'All',
    PENDING: 'Pending',
    REQUESTED: 'Requested',
    APPROVED: 'Approved',
    REJECTED: 'Rejected',
  };

  useEffect(() => { loadRefunds(); }, [page, statusFilter]);

  const loadRefunds = async () => {
    setLoading(true);
    try {
      const params: any = { page, limit: 20 };
      if (search) params.search = search;
      if (statusFilter) params.status = statusFilter;
      const res = await adminApi.getRefunds(params);
      setRefunds(Array.isArray(res) ? res : []);
      setTotalPages(res?.meta?.totalPages || 1);
    } catch { setRefunds([]); } finally { setLoading(false); }
  };

  const handleRefundAction = async (id: string, action: 'approve' | 'reject') => {
    setProcessingId(id);
    try {
      await fetch(`/api/returns/${id}/${action}`, { method: 'PATCH' });
      await loadRefunds();
    } catch (err: any) {
      alert(err.message || `Failed to ${action} refund`);
    } finally {
      setProcessingId(null);
    }
  };

  const columns = [
    { key: 'orderNumber', label: 'Order', render: (r: any) => <span className="font-mono text-xs">{r.order?.orderNumber || r.orderId?.slice(0, 8)}</span> },
    { key: 'user', label: 'Customer', render: (r: any) => r.user?.name || '-' },
    { key: 'amount', label: 'Amount', render: (r: any) => <span className="font-mono font-bold">₹{(r.amount || 0).toLocaleString()}</span> },
    { key: 'reason', label: 'Reason', render: (r: any) => <span className="text-sm text-gray-600 line-clamp-1">{r.reason || '-'}</span> },
    { key: 'status', label: 'Status', render: (r: any) => <StatusBadge status={r.status} /> },
    { key: 'createdAt', label: 'Date', render: (r: any) => new Date(r.createdAt).toLocaleDateString() },
    { key: 'actions', label: 'Actions', render: (r: any) => {
      if (r.status === 'PENDING' || r.status === 'REQUESTED') {
        return (
          <div className="flex gap-1">
            <button
              disabled={processingId === r.id}
              onClick={(e) => { e.stopPropagation(); handleRefundAction(r.id, 'approve'); }}
              className="px-2 py-1 text-xs bg-emerald-100 text-emerald-700 rounded hover:bg-emerald-200 disabled:opacity-50 flex items-center gap-1">
              {processingId === r.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCircle className="w-3 h-3" />}
              Approve
            </button>
            <button
              disabled={processingId === r.id}
              onClick={(e) => { e.stopPropagation(); handleRefundAction(r.id, 'reject'); }}
              className="px-2 py-1 text-xs bg-red-100 text-red-700 rounded hover:bg-red-200 disabled:opacity-50 flex items-center gap-1">
              {processingId === r.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <XCircle className="w-3 h-3" />}
              Reject
            </button>
          </div>
        );
      }
      return <span className="text-xs text-gray-400">—</span>;
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
            onClick={() => { setStatusFilter(s); setPage(1); }}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              statusFilter === s ? 'bg-emerald-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {refundStatusLabels[s]}
          </button>
        ))}
      </div>

      <DataTable columns={columns} data={refunds} loading={loading} searchable searchPlaceholder="Search refunds..." onSearch={(q) => { setSearch(q); setPage(1); }} page={page} totalPages={totalPages} onPageChange={setPage} emptyMessage={<><p>No refund records</p><p className="text-xs text-gray-400 mt-1">Refund requests and processing history will appear here.</p></>} emptyIcon={<RefreshCw className="w-10 h-10" />} />
    </div>
  );
}
