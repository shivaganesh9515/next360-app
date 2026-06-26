'use client';

import { useState, useEffect } from 'react';
import DataTable from '@/components/DataTable';
import { vendorApi } from '@/lib/api';

export default function PayoutsPage() {
  const [payouts, setPayouts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    vendorApi.getPayouts().then((res: any) => setPayouts(Array.isArray(res) ? res : [])).catch(console.error).finally(() => setLoading(false));
  }, []);

  const columns = [
    { key: 'period', label: 'Period' },
    { key: 'amount', label: 'Amount', render: (item: any) => <span className="font-medium">₹{Number(item.amount).toLocaleString()}</span> },
    { key: 'status', label: 'Status', render: (item: any) => (
      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${item.status === 'PAID' ? 'bg-emerald-100 text-emerald-700' : 'bg-yellow-100 text-yellow-700'}`}>{item.status}</span>
    )},
    { key: 'initiatedAt', label: 'Initiated', render: (item: any) => <span className="text-sm text-gray-400">{new Date(item.initiatedAt).toLocaleDateString()}</span> },
    { key: 'paidAt', label: 'Paid Date', render: (item: any) => <span className="text-sm text-gray-400">{item.paidAt ? new Date(item.paidAt).toLocaleDateString() : '-'}</span> },
  ];

  return (
    <div className="space-y-6">
      <div><h2 className="text-xl font-bold text-gray-800">Payouts</h2><p className="text-sm text-gray-500">Payout history to your bank account</p></div>
      <DataTable columns={columns} data={payouts} loading={loading} emptyMessage="No payouts yet" />
    </div>
  );
}
