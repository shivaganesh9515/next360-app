'use client';

import { useState, useEffect } from 'react';
import DataTable from '@/components/DataTable';
import { vendorApi } from '@/lib/api';

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    vendorApi.getTransactions({}).then((res: any) => setTransactions(Array.isArray(res) ? res : [])).catch(console.error).finally(() => setLoading(false));
  }, []);

  const columns = [
    { key: 'orderNo', label: 'Order', render: (item: any) => <span className="font-mono text-sm">{item.orderNo}</span> },
    { key: 'customer', label: 'Customer' },
    { key: 'amount', label: 'Amount', render: (item: any) => <span className="font-medium">₹{Number(item.amount).toLocaleString()}</span> },
    { key: 'type', label: 'Type', render: (item: any) => (
      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${item.type === 'SALE' ? 'bg-emerald-100 text-emerald-700' : item.type === 'REFUND' ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'}`}>{item.type}</span>
    )},
    { key: 'date', label: 'Date', render: (item: any) => <span className="text-sm text-gray-400">{new Date(item.date).toLocaleDateString()}</span> },
  ];

  return (
    <div className="space-y-6">
      <div><h2 className="text-xl font-bold text-gray-800">Transactions</h2><p className="text-sm text-gray-500">Complete transaction log</p></div>
      <DataTable columns={columns} data={transactions} loading={loading} searchable emptyMessage="No transactions yet" />
    </div>
  );
}
