'use client';

import { useState, useEffect } from 'react';
import DataTable from '@/components/DataTable';
import { vendorApi } from '@/lib/api';

export default function CustomersPage() {
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    vendorApi.getCustomers().then((res: any) => setCustomers(Array.isArray(res) ? res : res.data || []))
      .catch(console.error).finally(() => setLoading(false));
  }, []);

  const columns = [
    { key: 'name', label: 'Name', render: (item: any) => <span className="font-medium">{item.name}</span> },
    { key: 'email', label: 'Email' },
    { key: 'phone', label: 'Phone', render: (item: any) => <span>{item.phone || '-'}</span> },
    { key: 'ordersCount', label: 'Orders', render: (item: any) => <span>{item.ordersCount || 0}</span> },
    { key: 'totalSpent', label: 'Total Spent', render: (item: any) => <span>₹{Number(item.totalSpent || 0).toLocaleString()}</span> },
    { key: 'lastOrderAt', label: 'Last Order', render: (item: any) => <span className="text-sm text-gray-400">{item.lastOrderAt ? new Date(item.lastOrderAt).toLocaleDateString() : '-'}</span> },
  ];

  return (
    <div className="space-y-6">
      <div><h2 className="text-xl font-bold text-gray-800">Customers</h2><p className="text-sm text-gray-500">Your customer base</p></div>
      <DataTable columns={columns} data={customers} loading={loading} searchable emptyMessage="No customers yet" />
    </div>
  );
}
