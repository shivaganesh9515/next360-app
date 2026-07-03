'use client';

import { useState, useEffect } from 'react';
import { ArrowLeft, CreditCard } from 'lucide-react';
import { useRouter } from 'next/navigation';
import DataTable from '@/components/DataTable';
import StatusBadge from '@/components/StatusBadge';
import { adminApi } from '@/lib/api';

export default function VendorPayoutsPage() {
  const router = useRouter();
  const [payouts, setPayouts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => { loadPayouts(); }, [page]);

  const loadPayouts = async () => {
    setLoading(true);
    try {
      const res = await adminApi.getPayouts({ page, limit: 20, type: 'vendor' });
      setPayouts(res?.data || []);
      setTotalPages(res?.meta?.totalPages || 1);
    } catch { setPayouts([]); } finally { setLoading(false); }
  };

  const columns = [
    { key: 'vendor', label: 'Vendor', render: (p: any) => <span className="font-medium text-gray-800">{p.vendor?.storeName || '-'}</span> },
    { key: 'amount', label: 'Amount', render: (p: any) => <span className="font-mono font-bold">₹{(p.amount || 0).toLocaleString()}</span> },
    { key: 'period', label: 'Period', render: (p: any) => p.period || '-' },
    { key: 'status', label: 'Status', render: (p: any) => <StatusBadge status={p.status || 'PENDING'} /> },
    { key: 'razorpayTransferId', label: 'Transfer ID', render: (p: any) => <span className="font-mono text-xs">{p.razorpayTransferId || '-'}</span> },
    { key: 'createdAt', label: 'Date', render: (p: any) => new Date(p.createdAt).toLocaleDateString() },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <button onClick={() => router.back()} className="p-2 hover:bg-gray-100 rounded-lg"><ArrowLeft className="w-5 h-5" /></button>
        <div><h2 className="text-xl font-bold text-gray-800">Vendor Payouts</h2><p className="text-sm text-gray-500">Razorpay Route payouts to vendors</p></div>
      </div>
      <DataTable columns={columns} data={payouts} loading={loading} page={page} totalPages={totalPages} onPageChange={setPage} emptyMessage="No vendor payout records" emptyIcon={<CreditCard className="w-10 h-10" />} />
    </div>
  );
}
