'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import DataTable from '@/components/DataTable';
import StatusBadge from '@/components/StatusBadge';
import ErrorState from '@/components/ErrorState';
import { vendorApi } from '@/lib/api';
import { Bell, BellRing, CheckCircle, XCircle, X } from 'lucide-react';

const POLL_INTERVAL_MS = 30000;

function requestNotificationPermission() {
  if (!('Notification' in window)) return;
  if (Notification.permission === 'default') {
    Notification.requestPermission();
  }
}

function showBrowserNotification(title: string, body: string) {
  if (!('Notification' in window)) return;
  if (Notification.permission === 'granted') {
    if (document.visibilityState === 'visible') return;
    new Notification(title, { body, icon: '/favicon.ico', tag: 'new-order' });
  }
}

export default function OrdersPage() {
  const router = useRouter();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [initialError, setInitialError] = useState<Error | null>(null);
  const [newOrderCount, setNewOrderCount] = useState(0);
  const previousCountRef = useRef(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const pulseTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectItem, setRejectItem] = useState<any>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [customerNames, setCustomerNames] = useState<Record<string, string>>({});

  useEffect(() => {
    requestNotificationPermission();
  }, []);

  // Customer names are fetched once on mount, not on every poll tick — the
  // customer list rarely changes and refetching it every 30s was the bulk of
  // the orders page's request volume (audit Bug 3).
  useEffect(() => {
    vendorApi.getCustomers()
      .then((list: any) => {
        const arr = Array.isArray(list) ? list : [];
        const map: Record<string, string> = {};
        for (const c of arr) {
          if (c?.id && c?.name) map[c.id] = c.name;
        }
        setCustomerNames(map);
      })
      .catch(() => {
        // Names fall back to order.user?.name in the row renderer
      });
  }, []);

  const fetchOrders = useCallback(async (isInitial = false) => {
    try {
      const ordersRes = await vendorApi.getOrdersWithMeta({});

      let normalized: any[] = [];
      const res: any = ordersRes;
      // getOrdersWithMeta returns { data: [...], meta: {...} }
      // The data array may itself be double-nested from the backend interceptor
      const raw = Array.isArray(res?.data) ? res.data
        : Array.isArray(res?.data?.data) ? res.data.data
        : Array.isArray(res) ? res : [];
      normalized = raw.map((g: any) => ({
        id: g.id,
        orderId: g.orderId || g.order?.id,
        orderNo: g.order?.orderNo || g.id?.slice(0, 8),
        status: g.status || g.order?.status,
        customerUserId: g.order?.userId,
        customerName: g.order?.user?.name,
        subtotal: g.subtotal,
        totalAmount: g.subtotal,
        createdAt: g.order?.createdAt || g.createdAt,
        paymentStatus: g.order?.paymentStatus,
        paymentMethod: g.order?.paymentMethod,
        cancellationReason: g.cancellationReason || g.order?.cancellationReason,
        items: g.items || [],
      }));

      if (!isInitial && previousCountRef.current > 0 && normalized.length > previousCountRef.current) {
        const diff = normalized.length - previousCountRef.current;
        setNewOrderCount(prev => prev + diff);

        if (diff === 1) {
          showBrowserNotification('New Order!', 'You have 1 new order to process.');
        } else {
          showBrowserNotification('New Orders!', `You have ${diff} new orders to process.`);
        }

        if (pulseTimeoutRef.current) clearTimeout(pulseTimeoutRef.current);
        pulseTimeoutRef.current = setTimeout(() => setNewOrderCount(0), 5000);
      }

      previousCountRef.current = normalized.length;
      setOrders(normalized);
      setInitialError(null);
    } catch (e) {
      // Poll failure after a successful load keeps the stale list on screen;
      // initial failure surfaces the error state instead of a fake "no orders".
      if (isInitial) setInitialError(e instanceof Error ? e : new Error(String(e)));
      else console.error(e);
    } finally {
      if (isInitial) setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOrders(true);
  }, [fetchOrders]);

  useEffect(() => {
    intervalRef.current = setInterval(() => fetchOrders(false), POLL_INTERVAL_MS);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [fetchOrders]);

  const handleRejectOrder = async () => {
    if (!rejectItem || !rejectReason.trim()) return;
    try {
      await vendorApi.cancelVendorGroup(rejectItem.orderId || rejectItem.id, rejectItem.id, rejectReason);
      setShowRejectModal(false);
      setRejectReason('');
      setRejectItem(null);
      fetchOrders(false);
    } catch (e) { console.error(e); }
  };

  const columns = [
    { key: 'orderNo', label: 'Order #', render: (item: any) => <span className="font-mono text-sm font-medium">{item.orderNo}</span> },
    { key: 'customer', label: 'Customer', render: (item: any) => {
      const name = item.customerName || (item.customerUserId ? customerNames[item.customerUserId] : undefined);
      return name
        ? <span className="text-sm text-slate-700">{name}</span>
        : <span className="text-slate-400 text-xs" title="Customer name not available">—</span>;
    } },
    { key: 'items', label: 'Items', render: (item: any) => <span>{(item.items?.length || 0)} items</span> },
    { key: 'totalAmount', label: 'Total', render: (item: any) => <span>₹{Number(item.totalAmount || 0).toLocaleString()}</span> },
    { key: 'status', label: 'Status', render: (item: any) => (
      <div className="flex items-center gap-1.5">
        <StatusBadge status={item.status} />
        {item.status === 'CANCELLED' && item.cancellationReason && (
          <span className="text-[10px] text-red-400 max-w-[120px] truncate" title={item.cancellationReason}>
            · {item.cancellationReason}
          </span>
        )}
      </div>
    ) },
    { key: 'paymentMethod', label: 'Payment', render: (item: any) => <span className="text-xs text-slate-500">{item.paymentMethod || '—'}</span> },
    { key: 'createdAt', label: 'Date', render: (item: any) => <span className="text-sm text-slate-400">{new Date(item.createdAt).toLocaleDateString()}</span> },
    {
      key: 'actions', label: 'Actions', render: (item: any) => {
        if (item.status === 'PLACED' || item.status === 'CONFIRMED') {
          return (
            <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
              <button
                onClick={async () => {
                  try {
                    const nextStatus = item.status === 'PLACED' ? 'CONFIRMED' : 'PACKED';
                    await vendorApi.updateVendorGroupStatus(item.orderId || item.id, item.id, nextStatus);
                    fetchOrders(false);
                  } catch (e) { console.error(e); }
                }}
                className="flex items-center gap-1 px-3 py-1.5 bg-emerald-50 text-emerald-700 rounded-lg text-xs font-medium hover:bg-emerald-100"
              >
                <CheckCircle className="w-3.5 h-3.5" />
                Accept
              </button>
              <button
                onClick={() => { setRejectItem(item); setShowRejectModal(true); }}
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
                    await vendorApi.updateVendorGroupStatus(item.orderId || item.id, item.id, 'READY_FOR_PICKUP');
                    fetchOrders(false);
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

  const notificationStatus = typeof Notification !== 'undefined' ? Notification.permission : 'unsupported';
  const notificationsEnabled = notificationStatus === 'granted';
  const notificationsDenied = notificationStatus === 'denied';

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
              <BellRing className="w-4 h-4 text-emerald-600" />
              <span className="text-sm font-medium text-emerald-700">{newOrderCount} new</span>
            </div>
          )}
          <button
            onClick={() => {
              setNewOrderCount(0);
              if (pulseTimeoutRef.current) clearTimeout(pulseTimeoutRef.current);
              fetchOrders(true);
            }}
            className="px-3 py-1.5 text-xs text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
            title="Refresh now"
          >
            Refresh
          </button>
          {notificationsEnabled ? (
            <span className="text-xs text-emerald-600 flex items-center gap-1" title="Browser notifications enabled">
              <Bell className="w-3.5 h-3.5" /> Notifications on
            </span>
          ) : notificationsDenied ? (
            <span className="text-xs text-slate-400 flex items-center gap-1" title="Notifications were blocked. Enable them in your browser settings.">
              <Bell className="w-3.5 h-3.5" /> Notifications blocked
            </span>
          ) : (
            <button
              onClick={requestNotificationPermission}
              className="text-xs text-slate-400 hover:text-slate-600 flex items-center gap-1 transition-colors"
              title="Enable browser notifications for new orders"
            >
              <Bell className="w-3.5 h-3.5" /> Enable alerts
            </button>
          )}
        </div>
      </div>
      {initialError ? (
        <ErrorState
          message={initialError.message}
          onRetry={() => { setLoading(true); setInitialError(null); fetchOrders(true); }}
        />
      ) : (
        <DataTable columns={columns} data={orders} loading={loading} searchable onRowClick={handleRowClick} emptyMessage="No orders yet" />
      )}

      {/* Cancel Reason Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Cancel Order</h3>
              <button onClick={() => setShowRejectModal(false)} className="p-1 hover:bg-slate-100 rounded"><X className="w-5 h-5" /></button>
            </div>
            <p className="text-sm text-slate-500 mb-3">Why are you rejecting this order?</p>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Enter reason for cancellation..."
              rows={3}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
            />
            <div className="flex gap-3 mt-4 justify-end">
              <button onClick={() => setShowRejectModal(false)} className="px-4 py-2 text-sm border border-slate-300 rounded-lg hover:bg-slate-50">Cancel</button>
              <button onClick={handleRejectOrder} disabled={!rejectReason.trim()} className="px-4 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50">Confirm Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
