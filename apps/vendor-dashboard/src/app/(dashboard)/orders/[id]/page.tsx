'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { vendorApi } from '@/lib/api';
import StatusBadge from '@/components/StatusBadge';

const statusFlow = ['PLACED', 'CONFIRMED', 'PACKED', 'ASSIGNED_TO_DELIVERY', 'PICKED_UP', 'OUT_FOR_DELIVERY', 'DELIVERED'];

export default function OrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  const fetchOrder = async () => {
    try { const res = await vendorApi.getOrder(params.id); setOrder(res); }
    catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchOrder(); }, [params.id]);

  const updateStatus = async (newStatus: string) => {
    setUpdating(true);
    try { await vendorApi.updateOrderStatus(params.id, newStatus); fetchOrder(); }
    catch (e) { console.error(e); }
    finally { setUpdating(false); }
  };

  if (loading) return <div className="text-center py-12 text-gray-500">Loading...</div>;
  if (!order) return <div className="text-center py-12 text-gray-500">Order not found</div>;

  const items = order.items || order.orderItems || [];
  const currentIdx = statusFlow.indexOf(order.status);
  const nextStatus = currentIdx < statusFlow.length - 1 ? statusFlow[currentIdx + 1] : null;

  return (
    <div className="max-w-4xl space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/orders" className="p-1.5 hover:bg-gray-100 rounded"><ArrowLeft className="w-5 h-5 text-gray-600" /></Link>
        <div><h2 className="text-xl font-bold text-gray-800">Order {order.orderNo || order.id?.slice(0, 8)}</h2><p className="text-sm text-gray-500">{new Date(order.createdAt).toLocaleString()}</p></div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="font-semibold text-gray-800 mb-4">Order Info</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-gray-500">Status</span><StatusBadge status={order.status} /></div>
            <div className="flex justify-between"><span className="text-gray-500">Payment</span><StatusBadge status={order.paymentStatus} /></div>
            <div className="flex justify-between"><span className="text-gray-500">Total</span><span className="font-semibold">₹{Number(order.totalAmount).toLocaleString()}</span></div>
            {nextStatus && (
              <div className="pt-4 flex justify-end">
                <button onClick={() => updateStatus(nextStatus)} disabled={updating}
                  className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700 disabled:opacity-50">
                  {updating ? 'Updating...' : `Mark as ${nextStatus.replace(/_/g, ' ')}`}
                </button>
              </div>
            )}
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="font-semibold text-gray-800 mb-4">Customer</h3>
          <div className="space-y-2 text-sm">
            <p><span className="text-gray-500">Name:</span> {order.customer?.name || order.user?.name || 'N/A'}</p>
            <p><span className="text-gray-500">Email:</span> {order.customer?.email || order.user?.email || 'N/A'}</p>
            <p><span className="text-gray-500">Phone:</span> {order.customer?.phone || order.user?.phone || 'N/A'}</p>
            {order.address && (
              <div className="mt-2"><p className="text-gray-500 mb-1">Delivery Address:</p>
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-gray-700">{order.address.fullAddress}</p>
                  <p className="text-gray-500 text-xs">{order.address.city}, {order.address.state} - {order.address.pincode}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="font-semibold text-gray-800 mb-4">Items</h3>
        <table className="w-full">
          <thead><tr className="border-b border-gray-100">
            <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Item</th>
            <th className="text-center px-4 py-3 text-xs font-medium text-gray-500 uppercase">Qty</th>
            <th className="text-right px-4 py-3 text-xs font-medium text-gray-500 uppercase">Price</th>
            <th className="text-right px-4 py-3 text-xs font-medium text-gray-500 uppercase">Total</th>
          </tr></thead>
          <tbody>
            {items.map((item: any) => (
              <tr key={item.id} className="border-b border-gray-50">
                <td className="px-4 py-3 text-sm text-gray-700">{item.name || item.product?.name}</td>
                <td className="px-4 py-3 text-sm text-center text-gray-700">{item.quantity}</td>
                <td className="px-4 py-3 text-sm text-right text-gray-700">₹{Number(item.priceAtPurchase || item.price).toLocaleString()}</td>
                <td className="px-4 py-3 text-sm text-right font-medium">₹{(Number(item.priceAtPurchase || item.price) * item.quantity).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr><td colSpan={3} className="px-4 py-3 text-sm text-right text-gray-500">Total</td>
              <td className="px-4 py-3 text-sm text-right font-bold">₹{Number(order.totalAmount).toLocaleString()}</td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}
