'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import DataTable from '@/components/DataTable';
import StatusBadge from '@/components/StatusBadge';
import { vendorApi } from '@/lib/api';

export default function OrdersPage() {
  const router = useRouter();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    vendorApi.getOrders({}).then((res: any) => setOrders(res.data || res || [])).catch(console.error).finally(() => setLoading(false));
  }, []);

  const columns = [
    { key: 'orderNo', label: 'Order #', render: (item: any) => <span className="font-mono text-sm font-medium">{item.orderNo || item.id?.slice(0, 8)}</span> },
    { key: 'customer', label: 'Customer', render: (item: any) => <span>{item.customer?.name || item.user?.name || 'N/A'}</span> },
    { key: 'items', label: 'Items', render: (item: any) => <span>{(item.items?.length || item.orderItems?.length || 0)} items</span> },
    { key: 'totalAmount', label: 'Total', render: (item: any) => <span>₹{Number(item.totalAmount).toLocaleString()}</span> },
    { key: 'status', label: 'Status', render: (item: any) => <StatusBadge status={item.status} /> },
    { key: 'paymentStatus', label: 'Payment', render: (item: any) => <StatusBadge status={item.paymentStatus} /> },
    { key: 'createdAt', label: 'Date', render: (item: any) => <span className="text-sm text-gray-400">{new Date(item.createdAt).toLocaleDateString()}</span> },
  ];

  return (
    <div className="space-y-6">
      <div><h2 className="text-xl font-bold text-gray-800">Orders</h2><p className="text-sm text-gray-500">View and manage customer orders</p></div>
      <DataTable columns={columns} data={orders} loading={loading} searchable onRowClick={(item) => router.push(`/orders/${item.id}`)} emptyMessage="No orders yet" />
    </div>
  );
}
