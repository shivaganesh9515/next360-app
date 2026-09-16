'use client';

import { useState, useEffect } from 'react';
import { DollarSign } from 'lucide-react';
import DataTable from '@/components/DataTable';
import StatusBadge from '@/components/StatusBadge';
import StatsCard from '@/components/StatsCard';
import { adminApi } from '@/lib/api';

export default function CommissionsPage() {
  const [commissions, setCommissions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [summary, setSummary] = useState({ totalCommissions: 0, paidCommissions: 0, pendingCommissions: 0 });

  useEffect(() => { loadCommissions(); }, [page]);

  const loadCommissions = async () => {
    setLoading(true);
    try {
      const res = await adminApi.getCommissions({ page, limit: 20 });
      setCommissions((Array.isArray(res) ? res : (res as any)?.data) || []);
      setTotalPages(res?.meta?.totalPages || 1);
      if (res?.summary) setSummary(res.summary);
    } catch { setCommissions([]); } finally { setLoading(false); }
  };

  const columns = [
    { key: 'vendor', label: 'Vendor', render: (c: any) => <span className="font-medium text-gray-800">{c.vendor?.storeName || '-'}</span> },
    { key: 'orderNumber', label: 'Order', render: (c: any) => <span className="font-mono text-xs">{c.order?.orderNumber || c.orderId?.slice(0, 8)}</span> },
    { key: 'orderAmount', label: 'Order Amt', render: (c: any) => <span className="font-mono">₹{(c.orderAmount || 0).toLocaleString()}</span> },
    { key: 'commissionPct', label: 'Rate', render: (c: any) => <span>{c.commissionPct || 0}%</span> },
    { key: 'commissionAmount', label: 'Commission', render: (c: any) => <span className="font-mono font-bold">₹{(c.commissionAmount || 0).toLocaleString()}</span> },
    { key: 'status', label: 'Status', render: (c: any) => <StatusBadge status={c.status || 'PENDING'} /> },
    { key: 'createdAt', label: 'Date', render: (c: any) => new Date(c.createdAt).toLocaleDateString() },
    // No retry endpoint exists for commission records on the backend, so this
    // stays disabled with an honest tooltip rather than faking a retry.
    { key: 'actions', label: '', render: () => (
      <button
        disabled
        title="Retry is not supported by the backend for commission records"
        className="px-3 py-1.5 text-xs bg-slate-100 text-slate-400 rounded-lg cursor-not-allowed"
      >
        Retry
      </button>
    )},
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-gray-800">Commissions</h2>
        <p className="text-sm text-gray-500">Track platform commissions from orders</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatsCard title="Total Commissions" value={`₹${summary.totalCommissions.toLocaleString()}`} icon={<DollarSign className="w-5 h-5" />} color="emerald" />
        <StatsCard title="Paid Out" value={`₹${summary.paidCommissions.toLocaleString()}`} icon={<DollarSign className="w-5 h-5" />} color="blue" />
        <StatsCard title="Pending" value={`₹${summary.pendingCommissions.toLocaleString()}`} icon={<DollarSign className="w-5 h-5" />} color="amber" />
      </div>

      <DataTable columns={columns} data={commissions} loading={loading} page={page} totalPages={totalPages} onPageChange={setPage} emptyMessage="No commission records" emptyIcon={<DollarSign className="w-10 h-10" />} />
    </div>
  );
}
