'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import DataTable from '@/components/DataTable';
import StatusBadge from '@/components/StatusBadge';
import { vendorApi } from '@/lib/api';
import { CheckCircle, XCircle } from 'lucide-react';

const POLL_INTERVAL_MS = 30000; // 30-second auto-refresh per CLAUDE.md spec

export default function OrdersPage() {
  const router = useRouter();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchOrders = () => {
    vendorApi.getOrders({}).then((res: any) => {
      // Backend returns { data: [...vendorGroups], meta: {...} }
      const raw = res.data || res || [];
      // Normalize OrderVendorGroup items to have flat fields for DataTable
      const normalized = (Array.isArray(raw) ? raw : []).map((g: any) => ({
        id: g.id,
        orderId: g.orderId || g.order?.id,
        orderNo: g.order?.orderNo || g.id?.slice(0, 8),
        status: g.status || g.order?.status,
        subtotal: g.subtotal,
        totalAmount: g.subtotal,
        createdAt: g.order?.createdAt || g.createdAt,
        paymentStatus: g.order?.paymentStatus,
        paymentMethod: g.order?.paymentMethod,
        items: g.items || [],
      }));
      setOrders(normalized);
    }).catch(() => {}).finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchOrders();
    // Auto-refresh every 30 seconds so vendors see new orders without manual refresh
    intervalRef.current = setInterval(fetchOrders, POLL_INTERVAL_MS);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  const columns = [
    { key: 'orderNo', label: 'Order #', render: (item: any) => <span className="font-mono text-sm font-medium">{item.orderNo}</span> },
    { key: 'customer', label: 'Customer', render: () => <span className="text-slate-400 text-xs">—</span> },
    { key: 'items', label: 'Items', render: (item: any) => <span>{(item.items?.length || 0)} items</span> },
    { key: 'totalAmount', label: 'Total', render: (item: any) => <span>₹{Number(item.totalAmount || 0).toLocaleString()}</span> },
    { key: 'status', label: 'Status', render: (item: any) => <StatusBadge status={item.status} /> },
    { key: 'paymentMethod', label: 'Payment', render: (item: any) => <span className="text-xs text-slate-500">{item.paymentMethod || '—'}</span> },
    { key: 'createdAt', label: 'Date', render: (item: any) => <span className="text-sm text-slate-400">{new Date(item.createdAt).toLocaleDateString()}</span> },
    {
      key: 'actions', label: 'Actions', render: (item: any) => {
        // Show Accept/Reject for new orders (PLACED or CONFIRMED)
        // Show Ready for Pickup for PACKED orders
        if (item.status === 'PLACED' || item.status === 'CONFIRMED') {
          return (
            <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
              <button
                onClick={async () => {
                  try {
                    await vendorApi.updateOrderStatus(item.orderId || item.id, item.status === 'PLACED' ? 'CONFIRMED' : 'PACKED');
                    fetchOrders();
                  } catch (e) { console.error(e); }
                }}
                className="flex items-center gap-1 px-3 py-1.5 bg-emerald-50 text-emerald-700 rounded-lg text-xs font-medium hover:bg-emerald-100"
              >
                <CheckCircle className="w-3.5 h-3.5" />
                Accept
              </button>
              <button
                onClick={async () => {
                  try {
                    // Cancel the vendor group (not the entire order) since this
                    // row is an OrderVendorGroup — cancelling the whole order
                    // would affect other vendors' items.
                    await vendorApi.cancelVendorGroup(item.orderId || item.id, item.id, 'Vendor rejected');
                    fetchOrders();
                  } catch (e) { console.error(e); }
                }}
                className="flex items-center gap-1 px-3 py-1.5 bg-red-50 text-red-700 rounded-lg text-xs font-medium hover:bg-red-100"
              >
                <XCircle className="w-3.5 h-3.5" />
                Reject
              </button>
            </div>
          );
        }
        if (item.status === 'PACKED') {
          return (
            <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
              <button
                onClick={async () => {
                  try {
                    await vendorApi.updateOrderStatus(item.orderId || item.id, 'READY_FOR_PICKUP');
                    fetchOrders();
                  } catch (e) { console.error(e); }
                }}
                className="flex items-center gap-1 px-3 py-1.5 bg-amber-50 text-amber-700 rounded-lg text-xs font-medium hover:bg-amber-100"
              >
                <CheckCircle className="w-3.5 h-3.5" />
                Ready for Pickup
              </button>
            </div>
          );
        }
        return null;
      },
    },
  ];

  const handleRowClick = (item: any) => {
    router.push(`/orders/${item.orderId || item.id}`);
  };

  // Intentionally empty — the reject button inline-calls vendorApi.cancelVendorGroup
  // instead of this callback because it needs the group ID, not the order ID.

  return (
    <div className="space-y-6">
      <div><h2 className="text-xl font-bold text-slate-900">Orders</h2><p className="text-sm text-slate-500">View and manage customer orders</p></div>
      <DataTable columns={columns} data={orders} loading={loading} searchable onRowClick={handleRowClick} emptyMessage="No orders yet" />
    </div>
  );
}
