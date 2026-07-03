'use client';

import { useState, useEffect } from 'react';
import { ArrowLeft, RotateCcw } from 'lucide-react';
import { useRouter } from 'next/navigation';
import DataTable from '@/components/DataTable';
import StatusBadge from '@/components/StatusBadge';
import { adminApi } from '@/lib/api';

export default function ReturnsPage() {
  const router = useRouter();
  const [returns, setReturns] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => { loadReturns(); }, [page]);

  const loadReturns = async () => {
    setLoading(true);
    try {
      const res = await adminApi.getReturns({ page, limit: 20 });
      setReturns(res?.data || []);
      setTotalPages(res?.meta?.totalPages || 1);
    } catch { setReturns([]); } finally { setLoading(false); }
  };

  const handleReturnAction = async (id: string, status: string) => {
    try { await adminApi.updateReturnStatus(id, status); loadReturns(); }
    catch (err: any) { alert(err.message); }
  };

  const columns = [
    { key: 'orderNumber', label: 'Order', render: (r: any) => <span className="font-mono text-xs">{r.order?.orderNumber || r.orderId?.slice(0, 8)}</span> },
    { key: 'user', label: 'Customer', render: (r: any) => r.user?.name || '-' },
    { key: 'reason', label: 'Reason', render: (r: any) => <span className="text-sm text-gray-600 line-clamp-1">{r.reason || '-'}</span> },
    { key: 'status', label: 'Status', render: (r: any) => <StatusBadge status={r.status} /> },
    { key: 'createdAt', label: 'Requested', render: (r: any) => new Date(r.createdAt).toLocaleDateString() },
    { key: 'actions', label: 'Actions', render: (r: any) => (
      <div className="flex gap-1">
        {r.status === 'PENDING' && <>
          <button onClick={(e) => { e.stopPropagation(); handleReturnAction(r.id, 'APPROVED'); }} className="px-2 py-1 text-xs bg-emerald-100 text-emerald-700 rounded hover:bg-emerald-200">Approve</button>
          <button onClick={(e) => { e.stopPropagation(); handleReturnAction(r.id, 'REJECTED'); }} className="px-2 py-1 text-xs bg-red-100 text-red-700 rounded hover:bg-red-200">Reject</button>
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
      <DataTable columns={columns} data={returns} loading={loading} page={page} totalPages={totalPages} onPageChange={setPage} emptyMessage="No return requests" emptyIcon={<RotateCcw className="w-10 h-10" />} />
    </div>
  );
}
