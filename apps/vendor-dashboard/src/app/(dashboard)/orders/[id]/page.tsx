'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, X, AlertTriangle } from 'lucide-react';
import Link from 'next/link';
import { vendorApi } from '@/lib/api';
import StatusBadge from '@/components/StatusBadge';

const statusFlow = ['PLACED', 'CONFIRMED', 'PACKED', 'READY_FOR_PICKUP', 'ASSIGNED_TO_DELIVERY', 'PICKED_UP', 'OUT_FOR_DELIVERY', 'DELIVERED'];

const CANCEL_REASONS = [
  'Out of stock',
  'Delivery area not serviceable',
  'Incorrect order details',
  'Duplicate order',
  'Customer requested cancellation',
  'Other',
];

export default function OrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  // Cancel modal state
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [selectedReason, setSelectedReason] = useState('');
  const [customReason, setCustomReason] = useState('');

  const fetchOrder = async () => {
    try { const res = await vendorApi.getOrder(String(params.id)); setOrder(res); }
    catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchOrder(); }, [params.id]);

  // Close modal on Escape key
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setShowCancelModal(false);
    };
    if (showCancelModal) window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [showCancelModal]);

  // status flow — added READY_FOR_PICKUP between PACKED and ASSIGNED_TO_DELIVERY
  const orderId = String(params.id);
  const vendorGroupId = order?.vendorGroups?.[0]?.id;

  const updateStatus = async (newStatus: string, reason?: string) => {
    setUpdating(true);
    try {
      if (vendorGroupId && newStatus === 'CANCELLED') {
        await vendorApi.cancelVendorGroup(orderId, vendorGroupId, reason);
      } else if (vendorGroupId) {
        await vendorApi.updateVendorGroupStatus(orderId, vendorGroupId, newStatus);
      } else {
        await vendorApi.updateOrderStatus(orderId, newStatus, reason);
      }
      fetchOrder();
    }
    catch (e) { console.error(e); }
    finally { setUpdating(false); }
  };

  const openCancelModal = () => {
    setSelectedReason('');
    setCustomReason('');
    setShowCancelModal(true);
  };

  const submitCancel = async () => {
    const reason = selectedReason === 'Other' ? customReason.trim() : selectedReason;
    if (!reason) return;
    await updateStatus('CANCELLED', reason);
    setShowCancelModal(false);
  };

  if (loading) return (
    <div className="space-y-4" role="status" aria-label="Loading order">
      <div className="h-8 w-64 bg-slate-200 rounded animate-pulse" />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {[1, 2].map((i) => (
          <div key={i} className="h-48 bg-slate-100 rounded-xl animate-pulse" />
        ))}
      </div>
      <span className="sr-only">Loading order details...</span>
    </div>
  );
  if (!order) return (
    <div className="flex flex-col items-center justify-center py-16 text-slate-400">
      <p className="text-sm">Order not found</p>
    </div>
  );

  // Flatten items from vendorGroups (backend: OrderVendorGroup[] with nested items)
  const items = order.items || order.orderItems || order.vendorGroups?.flatMap((g: any) => g.items || []) || [];
  const currentIdx = statusFlow.indexOf(order.status);
  const nextStatus = currentIdx < statusFlow.length - 1 ? statusFlow[currentIdx + 1] : null;
  const isCancelled = order.status === 'CANCELLED';
  const isPlaced = order.status === 'PLACED';

  return (
    <>
      <div className="max-w-4xl space-y-6">
        <div className="flex items-center gap-3">
          <Link href="/orders" className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors"><ArrowLeft className="w-5 h-5 text-slate-600" /></Link>
          <div><h2 className="text-xl font-bold text-slate-900">Order {order.orderNo || order.id?.slice(0, 8)}</h2><p className="text-sm text-slate-500">{new Date(order.createdAt).toLocaleString()}</p></div>
        </div>

        {/* Cancellation banner */}
        {isCancelled && order.cancellationReason && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-red-500 mt-0.5 shrink-0" />
            <div>
              <p className="text-sm font-semibold text-red-800">Order Cancelled</p>
              <p className="text-sm text-red-700 mt-0.5">Reason: {order.cancellationReason}</p>
              <p className="text-xs text-red-500 mt-0.5">{new Date(order.updatedAt).toLocaleString()}</p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
            <h3 className="font-semibold text-slate-900 mb-4">Order Info</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-slate-500">Status</span><StatusBadge status={order.status} /></div>
              <div className="flex justify-between"><span className="text-slate-500">Payment</span><StatusBadge status={order.paymentStatus} /></div>
              <div className="flex justify-between"><span className="text-slate-500">Total</span><span className="font-semibold text-slate-900">₹{Number(order.totalAmount).toLocaleString()}</span></div>
              <div className="pt-4 flex items-center gap-2 justify-end">
                {isPlaced && !isCancelled && (
                  <button onClick={openCancelModal} disabled={updating}
                    className="px-4 py-2 border border-red-300 text-red-600 rounded-lg text-sm font-medium hover:bg-red-50 disabled:opacity-50 transition-colors">
                    Cancel Order
                  </button>
                )}
                {nextStatus && !isCancelled && (
                  <button onClick={() => updateStatus(nextStatus)} disabled={updating}
                    className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700 disabled:opacity-50 transition-colors">
                    {updating ? 'Updating...' : `Mark as ${nextStatus.replace(/_/g, ' ')}`}
                  </button>
                )}
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
            <h3 className="font-semibold text-slate-900 mb-4">Customer</h3>
            <div className="space-y-2 text-sm">
              <p><span className="text-slate-500">Name:</span> <span className="text-slate-900">{order.customer?.name || order.user?.name || 'N/A'}</span></p>
              <p><span className="text-slate-500">Email:</span> <span className="text-slate-900">{order.customer?.email || order.user?.email || 'N/A'}</span></p>
              <p><span className="text-slate-500">Phone:</span> <span className="text-slate-900">{order.customer?.phone || order.user?.phone || 'N/A'}</span></p>
              {order.address && (
                <div className="mt-2"><p className="text-slate-500 mb-1">Delivery Address:</p>
                  <div className="bg-slate-50 rounded-lg p-3">
                    <p className="text-slate-700">{order.address.fullAddress}</p>
                    <p className="text-slate-500 text-xs">{order.address.city}, {order.address.state} - {order.address.pincode}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
          <h3 className="font-semibold text-slate-900 mb-4">Items</h3>
          <div className="overflow-x-auto -mx-6 px-6">
            <table className="w-full min-w-[480px]">
              <thead><tr className="border-b border-slate-100">
                <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase">Item</th>
                <th className="text-center px-4 py-3 text-xs font-medium text-slate-500 uppercase">Qty</th>
                <th className="text-right px-4 py-3 text-xs font-medium text-slate-500 uppercase">Price</th>
                <th className="text-right px-4 py-3 text-xs font-medium text-slate-500 uppercase">Total</th>
              </tr></thead>
              <tbody>
                {items.map((item: any) => (
                  <tr key={item.id} className="border-b border-slate-50">
                    <td className="px-4 py-3 text-sm text-slate-700">{item.name || item.product?.name}</td>
                    <td className="px-4 py-3 text-sm text-center text-slate-700">{item.quantity}</td>
                    <td className="px-4 py-3 text-sm text-right text-slate-700">₹{Number(item.priceAtPurchase || item.price).toLocaleString()}</td>
                    <td className="px-4 py-3 text-sm text-right font-medium">₹{(Number(item.priceAtPurchase || item.price) * item.quantity).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr><td colSpan={3} className="px-4 py-3 text-sm text-right text-slate-500">Total</td>
                  <td className="px-4 py-3 text-sm text-right font-bold">₹{Number(order.totalAmount).toLocaleString()}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      </div>

      {/* Cancel Order Modal */}
      {showCancelModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowCancelModal(false)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 p-6" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-red-500" />
                <h3 className="text-lg font-semibold text-slate-900">Cancel Order</h3>
              </div>
              <button onClick={() => setShowCancelModal(false)} autoFocus className="p-1 hover:bg-slate-100 rounded-md transition-colors">
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>
            <p className="text-sm text-slate-500 mb-4">Select a reason for cancelling this order.</p>

            <div className="space-y-2">
              {CANCEL_REASONS.map((reason) => (
                <button
                  key={reason}
                  onClick={() => setSelectedReason(reason)}
                  className={`w-full text-left px-4 py-2.5 rounded-lg text-sm border transition-colors ${
                    selectedReason === reason
                      ? 'border-red-300 bg-red-50 text-red-700 font-medium'
                      : 'border-slate-200 text-slate-700 hover:border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  {reason}
                </button>
              ))}
            </div>

            {selectedReason === 'Other' && (
              <textarea
                value={customReason}
                onChange={(e) => setCustomReason(e.target.value)}
                placeholder="Describe the reason..."
                rows={3}
                className="mt-3 w-full px-4 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-400 focus:border-transparent resize-none"
              />
            )}

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowCancelModal(false)}
                className="flex-1 px-4 py-2.5 border border-slate-200 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-50 transition-colors"
              >
                Keep Order
              </button>
              <button
                onClick={submitCancel}
                disabled={!selectedReason || (selectedReason === 'Other' && !customReason.trim()) || updating}
                className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 disabled:opacity-50 transition-colors"
              >
                {updating ? 'Cancelling...' : 'Confirm Cancel'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
