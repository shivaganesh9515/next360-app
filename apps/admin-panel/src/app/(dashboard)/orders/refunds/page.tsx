'use client';

import { useState, useEffect } from 'react';
import { ArrowLeft, RefreshCw } from 'lucide-react';
import { useRouter } from 'next/navigation';
import DataTable from '@/components/DataTable';
import StatusBadge from '@/components/StatusBadge';
import { adminApi } from '@/lib/api';

export default function RefundsPage() {
  const router = useRouter();
  const [refunds, setRefunds] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => { loadRefunds(); }, [page]);

  const loadRefunds = async () => {
    setLoading(true);
    try {
      const res = await adminApi.getRefunds({ page, limit: 20 });
      setRefunds(res?.data || []);
      setTotalPages(res?.meta?.totalPages || 1);
    } catch { setRefunds([]); } finally { setLoading(false); }
  };

  const columns = [
    { key: 'orderNumber', label: 'Order', render: (r: any) => <span className="font-mono text-xs">{r.order?.orderNumber || r.orderId?.slice(0, 8)}</span> },
    { key: 'user', label: 'Customer', render: (r: any) => r.user?.name || '-' },
    { key: 'amount', label: 'Amount', render: (r: any) => <span className="font-mono font-bold">₹{(r.amount || 0).toLocaleString()}</span> },
    { key: 'reason', label: 'Reason', render: (r: any) => <span className="text-sm text-gray-600 line-clamp-1">{r.reason || '-'}</span> },
    { key: 'status', label: 'Status', render: (r: any) => <StatusBadge status={r.status} /> },
    { key: 'createdAt', label: 'Date', render: (r: any) => new Date(r.createdAt).toLocaleDateString() },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <button onClick={() => router.back()} className="p-2 hover:bg-gray-100 rounded-lg"><ArrowLeft className="w-5 h-5" /></button>
        <div><h2 className="text-xl font-bold text-gray-800">Refunds</h2><p className="text-sm text-gray-500">Track refund requests and processing</p></div>
      </div>
      <DataTable columns={columns} data={refunds} loading={loading} page={page} totalPages={totalPages} onPageChange={setPage} emptyMessage="No refund records" emptyIcon={<RefreshCw className="w-10 h-10" />} />
    </div>
  );
}
