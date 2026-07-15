'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ShoppingCart } from 'lucide-react';
import DataTable from '@/components/DataTable';
import StatusBadge from '@/components/StatusBadge';
import { adminApi } from '@/lib/api';

export default function OrdersPage() {
  const router = useRouter();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');

  const statuses = ['', 'PLACED', 'CONFIRMED', 'PACKED', 'ASSIGNED_TO_DELIVERY', 'PICKED_UP', 'OUT_FOR_DELIVERY', 'DELIVERED', 'CANCELLED'];

  const statusLabels: Record<string, string> = {
    '': 'All',
    PLACED: 'Placed',
    CONFIRMED: 'Confirmed',
    PACKED: 'Packed',
    ASSIGNED_TO_DELIVERY: 'Assigned to Delivery',
    PICKED_UP: 'Picked Up',
    OUT_FOR_DELIVERY: 'Out for Delivery',
    DELIVERED: 'Delivered',
    CANCELLED: 'Cancelled',
  };

  useEffect(() => { loadOrders(); }, [page, statusFilter]);

  const loadOrders = async () => {
    setLoading(true);
    try {
      const params: any = { page, limit: 20 };
      if (search) params.search = search;
      if (statusFilter) params.status = statusFilter;
      const res = await adminApi.getOrders(params);
      setOrders(res?.data || []);
      setTotalPages(res?.meta?.totalPages || 1);
    } catch { setOrders([]); } finally { setLoading(false); }
  };

  const columns = [
    { key: 'orderNumber', label: 'Order #', render: (o: any) => <span className="font-mono text-sm font-bold text-emerald-700">{o.orderNumber || o.id?.slice(0, 8)}</span> },
    { key: 'customer', label: 'Customer', render: (o: any) => o.user?.name || o.customerName || '-' },
    { key: 'total', label: 'Total', render: (o: any) => <span className="font-mono font-bold">₹{(o.total || 0).toLocaleString()}</span> },
    { key: 'vendorCount', label: 'Vendors', render: (o: any) => o.vendorGroups?.length || 0 },
    { key: 'status', label: 'Status', render: (o: any) => <StatusBadge status={o.status} /> },
    { key: 'createdAt', label: 'Date', render: (o: any) => new Date(o.createdAt).toLocaleDateString() },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-800">All Orders</h2>
          <p className="text-sm text-gray-500">View and manage all orders across vendors</p>
        </div>
      </div>

      <div className="flex gap-3 flex-wrap">
        {statuses.map(s => (
          <button key={s} onClick={() => { setStatusFilter(s); setPage(1); }}
            className={`px-3 py-1.5 text-xs rounded-lg border transition-colors ${statusFilter === s ? 'bg-emerald-600 text-white border-emerald-600' : 'border-gray-200 text-gray-600 hover:bg-gray-100'}`}>
            {statusLabels[s] || s}
          </button>
        ))}
      </div>

      <DataTable columns={columns} data={orders} loading={loading} searchable searchPlaceholder="Search orders..." onSearch={(q) => { setSearch(q); setPage(1); }} page={page} totalPages={totalPages} onPageChange={setPage} onRowClick={(o) => router.push(`/orders/${o.id}`)} emptyMessage={<><p>No orders found</p><p className="text-xs text-gray-400 mt-1">Orders will appear here once customers place them.</p></>} emptyIcon={<ShoppingCart className="w-10 h-10" />} />
    </div>
  );
}
