'use client';

import { useState, useEffect } from 'react';
import { CreditCard } from 'lucide-react';
import DataTable from '@/components/DataTable';
import StatusBadge from '@/components/StatusBadge';
import StatsCard from '@/components/StatsCard';
import { adminApi } from '@/lib/api';

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [stats, setStats] = useState({ totalRevenue: 0, onlinePayments: 0, codPayments: 0, failedPayments: 0 });

  useEffect(() => { loadTransactions(); }, [page]);

  const loadTransactions = async () => {
    setLoading(true);
    try {
      const res = await adminApi.getPayments({ page, limit: 20 });
      setTransactions(res?.data || []);
      setTotalPages(res?.meta?.totalPages || 1);
      if (res?.summary) setStats(res.summary);
    } catch { setTransactions([]); } finally { setLoading(false); }
  };

  const columns = [
    { key: 'orderNumber', label: 'Order', render: (t: any) => <span className="font-mono text-xs">{t.order?.orderNumber || t.orderId?.slice(0, 8)}</span> },
    { key: 'method', label: 'Method', render: (t: any) => <StatusBadge status={t.method || 'UNKNOWN'} /> },
    { key: 'amount', label: 'Amount', render: (t: any) => <span className="font-mono font-bold">₹{(t.amount || 0).toLocaleString()}</span> },
    { key: 'status', label: 'Status', render: (t: any) => <StatusBadge status={t.status || 'PENDING'} /> },
    { key: 'razorpayPaymentId', label: 'Payment ID', render: (t: any) => <span className="font-mono text-xs">{t.razorpayPaymentId || '-'}</span> },
    { key: 'createdAt', label: 'Date', render: (t: any) => new Date(t.createdAt).toLocaleString() },
  ];

  return (
    <div className="space-y-6">
      <div><h2 className="text-xl font-bold text-gray-800">Transactions</h2><p className="text-sm text-gray-500">All payment transactions</p></div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatsCard title="Total Revenue" value={`₹${stats.totalRevenue.toLocaleString()}`} icon={<CreditCard className="w-5 h-5" />} color="emerald" />
        <StatsCard title="Online" value={`₹${stats.onlinePayments.toLocaleString()}`} icon={<CreditCard className="w-5 h-5" />} color="blue" />
        <StatsCard title="COD" value={`₹${stats.codPayments.toLocaleString()}`} icon={<CreditCard className="w-5 h-5" />} color="amber" />
        <StatsCard title="Failed" value={stats.failedPayments.toString()} icon={<CreditCard className="w-5 h-5" />} color="red" />
      </div>

      <DataTable columns={columns} data={transactions} loading={loading} page={page} totalPages={totalPages} onPageChange={setPage} emptyMessage="No transactions" emptyIcon={<CreditCard className="w-10 h-10" />} />
    </div>
  );
}
