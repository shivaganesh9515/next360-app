'use client';

import { useState, useEffect } from 'react';
import { ArrowLeft, Package } from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';
import StatusBadge from '@/components/StatusBadge';
import { adminApi } from '@/lib/api';

export default function OrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [cancelModal, setCancelModal] = useState(false);

  useEffect(() => { loadOrder(); }, [params.id]);

  const loadOrder = async () => {
    try { const res = await adminApi.getOrder(params.id as string); setOrder(res); }
    catch { setOrder(null); } finally { setLoading(false); }
  };

  const statusLabels: Record<string, string> = {
    PLACED: 'Order Placed', CONFIRMED: 'Confirmed', PACKED: 'Packed', ASSIGNED_TO_DELIVERY: 'Delivery Assigned',
    PICKED_UP: 'Picked Up', OUT_FOR_DELIVERY: 'Out for Delivery', DELIVERED: 'Delivered', CANCELLED: 'Cancelled', REFUNDED: 'Refunded'
  };

  const statusSteps = ['PLACED', 'CONFIRMED', 'PACKED', 'ASSIGNED_TO_DELIVERY', 'PICKED_UP', 'OUT_FOR_DELIVERY', 'DELIVERED'];

  const currentIdx = statusSteps.indexOf(order?.status || '');

  if (loading) return <div className="space-y-4">{[...Array(3)].map((_, i) => <div key={i} className="h-32 bg-gray-100 rounded-xl animate-pulse" />)}</div>;
  if (!order) return <div className="text-center py-12"><Package className="w-12 h-12 text-gray-300 mx-auto mb-4" /><p className="text-gray-500">Order not found</p><button onClick={() => router.back()} className="mt-4 text-emerald-600 text-sm hover:underline">Go back</button></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <button onClick={() => router.back()} className="p-2 hover:bg-gray-100 rounded-lg"><ArrowLeft className="w-5 h-5" /></button>
        <div>
          <h2 className="text-xl font-bold text-gray-800">Order #{order.orderNumber || order.id?.slice(0, 8)}</h2>
          <p className="text-sm text-gray-500">{new Date(order.createdAt).toLocaleString()}</p>
        </div>
        <div className="ml-auto"><StatusBadge status={order.status} /></div>
      </div>

      {order.status !== 'DELIVERED' && order.status !== 'CANCELLED' && (
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <h3 className="text-sm font-semibold text-gray-700 mb-4">Order Timeline</h3>
          <div className="flex items-center gap-0 overflow-x-auto pb-2">
            {statusSteps.map((s, i) => (
              <div key={s} className="flex items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${i <= currentIdx ? 'bg-emerald-600 text-white' : 'bg-gray-100 text-gray-400'}`}>
                  {i < currentIdx ? '✓' : i + 1}
                </div>
                {i < statusSteps.length - 1 && <div className={`w-8 h-0.5 ${i < currentIdx ? 'bg-emerald-600' : 'bg-gray-200'}`} />}
              </div>
            ))}
          </div>
          <div className="flex justify-between mt-2 text-xs text-gray-500">
            <span>Placed</span><span>Delivered</span>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="font-semibold text-gray-800 mb-4">Order Details</h3>
          <div className="space-y-3">
            <div className="flex justify-between"><span className="text-sm text-gray-500">Order ID</span><span className="text-sm font-mono">{order.id?.slice(0, 8)}</span></div>
            <div className="flex justify-between"><span className="text-sm text-gray-500">Customer</span><span className="text-sm">{order.user?.name || '-'}</span></div>
            <div className="flex justify-between"><span className="text-sm text-gray-500">Phone</span><span className="text-sm">{order.user?.phone || '-'}</span></div>
            <div className="flex justify-between"><span className="text-sm text-gray-500">Payment</span><StatusBadge status={order.payment?.status || 'PENDING'} /></div>
            <div className="flex justify-between"><span className="text-sm text-gray-500">Payment Method</span><span className="text-sm">{order.payment?.method || '-'}</span></div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="font-semibold text-gray-800 mb-4">Delivery Address</h3>
          <div className="space-y-2">
            <p className="text-sm">{order.address?.street || '-'}</p>
            <p className="text-sm">{order.address?.city}, {order.address?.state} {order.address?.pincode}</p>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="font-semibold text-gray-800 mb-4">Order Summary</h3>
          <div className="space-y-3">
            <div className="flex justify-between"><span className="text-sm text-gray-500">Subtotal</span><span className="text-sm font-mono">₹{(order.subtotal || 0).toLocaleString()}</span></div>
            <div className="flex justify-between"><span className="text-sm text-gray-500">Delivery</span><span className="text-sm font-mono">₹{(order.deliveryFee || 0).toLocaleString()}</span></div>
            {order.couponDiscount > 0 && <div className="flex justify-between"><span className="text-sm text-emerald-600">Coupon</span><span className="text-sm font-mono text-emerald-600">-₹{order.couponDiscount.toLocaleString()}</span></div>}
            <div className="border-t border-gray-100 pt-3 flex justify-between"><span className="text-sm font-semibold">Total</span><span className="text-sm font-bold font-mono">₹{(order.total || 0).toLocaleString()}</span></div>
          </div>
        </div>
      </div>

      {(order.vendorGroups || []).length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="font-semibold text-gray-800 mb-4">Vendor Groups</h3>
          <div className="space-y-4">
            {order.vendorGroups.map((vg: any) => (
              <div key={vg.id} className="p-4 bg-gray-50 rounded-lg border border-gray-100">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium text-sm">{vg.vendor?.storeName || 'Vendor'}</span>
                  <StatusBadge status={vg.status} />
                </div>
                <div className="space-y-1">
                  {(vg.items || []).map((item: any) => (
                    <div key={item.id} className="flex justify-between text-xs text-gray-600">
                      <span>{item.product?.name} × {item.quantity}</span>
                      <span className="font-mono">₹{(item.price * item.quantity).toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {['CONFIRMED', 'PLACED'].includes(order.status) && (
        <div className="bg-red-50 rounded-xl border border-red-200 p-4">
          <h3 className="font-semibold text-red-700 mb-2">Cancel Order</h3>
          <p className="text-sm text-red-600 mb-3">This will cancel the order and trigger a refund if payment was made.</p>
          <button onClick={() => setCancelModal(true)} className="px-4 py-2 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700">Cancel Order</button>
        </div>
      )}

      {cancelModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-xl p-6 max-w-sm w-full mx-4 shadow-xl">
            <h3 className="text-lg font-semibold text-gray-800 mb-2">Cancel Order?</h3>
            <p className="text-sm text-gray-600 mb-6">This action cannot be undone. The customer will be notified.</p>
            <div className="flex gap-3 justify-end">
              <button onClick={() => setCancelModal(false)} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg">Keep Order</button>
              <button onClick={async () => { await adminApi.cancelOrder(order.id, 'Cancelled by admin'); setCancelModal(false); loadOrder(); }} className="px-4 py-2 text-sm text-white bg-red-600 rounded-lg hover:bg-red-700">Cancel Order</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
