'use client';

import { useState, useEffect } from 'react';
import DataTable from '@/components/DataTable';
import { vendorApi } from '@/lib/api';

export default function CustomersPage() {
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    vendorApi.getCustomers().then((res: any) => {
      // Backend returns array of { id, name, email, phone, totalOrders, totalSpent, lastOrderDate }
      const raw = Array.isArray(res) ? res : res?.data || [];
      const mapped = raw.map((c: any) => ({
        id: c.id,
        name: c.name || c.user?.name || '—',
        email: c.email || c.user?.email || '—',
        phone: c.phone || c.user?.phone || '-',
        ordersCount: c.totalOrders || c.ordersCount || 0,
        totalSpent: c.totalSpent || 0,
        lastOrderAt: c.lastOrderDate || c.lastOrderAt,
      }));
      setCustomers(mapped);
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const columns = [
    { key: 'name', label: 'Name', render: (item: any) => <span className="font-medium">{item.name}</span> },
    { key: 'email', label: 'Email' },
    { key: 'phone', label: 'Phone', render: (item: any) => <span>{item.phone || '-'}</span> },
    { key: 'ordersCount', label: 'Orders', render: (item: any) => <span>{item.ordersCount || 0}</span> },
    { key: 'totalSpent', label: 'Total Spent', render: (item: any) => <span>₹{Number(item.totalSpent || 0).toLocaleString()}</span> },
    { key: 'lastOrderAt', label: 'Last Order', render: (item: any) => <span className="text-sm text-slate-400">{item.lastOrderAt ? new Date(item.lastOrderAt).toLocaleDateString() : '-'}</span> },
  ];

  return (
    <div className="space-y-6">
      <div><h2 className="text-xl font-bold text-slate-900">Customers</h2><p className="text-sm text-slate-500">Your customer base</p></div>
      <DataTable columns={columns} data={customers} loading={loading} searchable emptyMessage="No customers yet" />
    </div>
  );
}
