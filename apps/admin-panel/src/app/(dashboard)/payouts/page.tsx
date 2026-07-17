'use client';

import { useState, useEffect } from 'react';
import { CreditCard, DollarSign } from 'lucide-react';
import DataTable from '@/components/DataTable';
import StatusBadge from '@/components/StatusBadge';
import StatsCard from '@/components/StatsCard';
import { adminApi } from '@/lib/api';

export default function PayoutsPage() {
  const [payouts, setPayouts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [summary, setSummary] = useState({ totalPaid: 0, pendingPayouts: 0, failedPayouts: 0 });

  useEffect(() => { loadPayouts(); }, [page]);

  const loadPayouts = async () => {
    setLoading(true);
    try {
      const res = await adminApi.getPayouts({ page, limit: 20 });
      setPayouts((Array.isArray(res) ? res : (res as any)?.data) || []);
      setTotalPages(res?.meta?.totalPages || 1);
      if (res?.summary) setSummary(res.summary);
    } catch { setPayouts([]); } finally { setLoading(false); }
  };

  const columns = [
    { key: 'vendor', label: 'Vendor', render: (p: any) => <span className="font-medium text-gray-800">{p.vendor?.storeName || '-'}</span> },
    { key: 'amount', label: 'Amount', render: (p: any) => <span className="font-mono font-bold">₹{(p.amount || 0).toLocaleString()}</span> },
    { key: 'period', label: 'Period', render: (p: any) => <span className="text-sm">{p.period || '-'}</span> },
    { key: 'status', label: 'Status', render: (p: any) => <StatusBadge status={p.status || 'PENDING'} /> },
    { key: 'razorpayTransferId', label: 'Transfer ID', render: (p: any) => <span className="font-mono text-xs">{p.razorpayTransferId || '-'}</span> },
    { key: 'createdAt', label: 'Date', render: (p: any) => new Date(p.createdAt).toLocaleDateString() },
  ];

  return (
    <div className="space-y-6">
      <div><h2 className="text-xl font-bold text-gray-800">Vendor Payouts</h2><p className="text-sm text-gray-500">Track Razorpay Route payouts to vendors</p></div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatsCard title="Total Paid" value={`₹${summary.totalPaid.toLocaleString()}`} icon={<DollarSign className="w-5 h-5" />} color="emerald" />
        <StatsCard title="Pending Payouts" value={`₹${summary.pendingPayouts.toLocaleString()}`} icon={<CreditCard className="w-5 h-5" />} color="amber" />
        <StatsCard title="Failed" value={summary.failedPayouts.toString()} icon={<CreditCard className="w-5 h-5" />} color="red" />
      </div>

      <DataTable columns={columns} data={payouts} loading={loading} page={page} totalPages={totalPages} onPageChange={setPage} emptyMessage="No payout records" emptyIcon={<CreditCard className="w-10 h-10" />} />
    </div>
  );
}
