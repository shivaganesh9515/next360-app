'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import DataTable from '@/components/DataTable';
import StatusBadge from '@/components/StatusBadge';
import { vendorApi } from '@/lib/api';
import { Bell } from 'lucide-react';

export default function OrdersPage() {
  const router = useRouter();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [newOrderCount, setNewOrderCount] = useState(0);
  const previousCountRef = useRef(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const pulseTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const fetchOrders = useCallback(async (isInitial = false) => {
    try {
      const res = await vendorApi.getOrders({});
      const raw = res.data || res || [];
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

      // Detect new orders for pulse animation (skip on initial load)
      if (!isInitial && previousCountRef.current > 0 && normalized.length > previousCountRef.current) {
        setNewOrderCount(prev => prev + (normalized.length - previousCountRef.current));
        // Auto-clear the pulse after 5 seconds (clear any previous timeout to avoid race)
        if (pulseTimeoutRef.current) clearTimeout(pulseTimeoutRef.current);
        pulseTimeoutRef.current = setTimeout(() => setNewOrderCount(0), 5000);
      }

      previousCountRef.current = normalized.length;
      setOrders(normalized);
    } catch (e) {
      console.error(e);
    } finally {
      if (isInitial) setLoading(false);
    }
  }, []);

  // Initial fetch
  useEffect(() => {
    fetchOrders(true);
  }, [fetchOrders]);

  // 30-second polling interval
  useEffect(() => {
    intervalRef.current = setInterval(() => fetchOrders(false), 30000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [fetchOrders]);

  const columns = [
    { key: 'orderNo', label: 'Order #', render: (item: any) => <span className="font-mono text-sm font-medium">{item.orderNo}</span> },
    { key: 'customer', label: 'Customer', render: () => <span className="text-slate-400 text-xs">—</span> },
    { key: 'items', label: 'Items', render: (item: any) => <span>{(item.items?.length || 0)} items</span> },
    { key: 'totalAmount', label: 'Total', render: (item: any) => <span>₹{Number(item.totalAmount || 0).toLocaleString()}</span> },
    { key: 'status', label: 'Status', render: (item: any) => <StatusBadge status={item.status} /> },
    { key: 'paymentMethod', label: 'Payment', render: (item: any) => <span className="text-xs text-slate-500">{item.paymentMethod || '—'}</span> },
    { key: 'createdAt', label: 'Date', render: (item: any) => <span className="text-sm text-slate-400">{new Date(item.createdAt).toLocaleDateString()}</span> },
  ];

  const handleRowClick = (item: any) => {
    router.push(`/orders/${item.orderId || item.id}`);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Orders</h2>
          <p className="text-sm text-slate-500">View and manage customer orders — auto-refreshes every 30s</p>
        </div>
        <div className="flex items-center gap-2">
          {newOrderCount > 0 && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 border border-emerald-200 rounded-full animate-pulse">
              <Bell className="w-4 h-4 text-emerald-600" />
              <span className="text-sm font-medium text-emerald-700">{newOrderCount} new</span>
            </div>
          )}
          <button
            onClick={() => { setNewOrderCount(0); if (pulseTimeoutRef.current) clearTimeout(pulseTimeoutRef.current); fetchOrders(true); }}
            className="px-3 py-1.5 text-xs text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
            title="Refresh now"
          >
            Refresh
          </button>
        </div>
      </div>
      <DataTable columns={columns} data={orders} loading={loading} searchable onRowClick={handleRowClick} emptyMessage="No orders yet" />
    </div>
  );
}
