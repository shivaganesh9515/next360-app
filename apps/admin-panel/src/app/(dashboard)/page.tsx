'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  DollarSign, ShoppingCart, AlertTriangle, ArrowRight, Truck,
  CheckCircle2, Package, Store, Clock, TrendingUp, BarChart3,
  ChevronRight, XCircle, RotateCcw
} from 'lucide-react';
import StatusBadge from '@/components/StatusBadge';
import { adminApi } from '@/lib/api';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend
} from 'recharts';

interface DashboardData {
  // Today's pulse
  gmvToday: number;
  ordersToday: number;
  pendingActions: number;
  activeDeliveryPartners: number;
  totalDeliveryPartners: number;

  // Action queues
  pendingVendorApprovals: { id: string; storeName: string; email: string; createdAt: string }[];
  pendingProductApprovals: { id: string; name: string; vendorName: string; createdAt: string }[];
  openDisputes: { id: string; orderId: string; orderNo: string; reason: string; createdAt: string }[];
  pendingDeliveryAssignments: { id: string; orderNo: string; vendorName: string; createdAt: string }[];

  // Pipeline
  pipeline: { stage: string; count: number; color: string }[];

  // Charts
  weeklyOrders: { day: string; orders: number; revenue: number }[];

  // Recent
  recentOrders: any[];
}

const EMPTY_DATA: DashboardData = {
  gmvToday: 0,
  ordersToday: 0,
  pendingActions: 0,
  activeDeliveryPartners: 0,
  totalDeliveryPartners: 0,
  pendingVendorApprovals: [],
  pendingProductApprovals: [],
  openDisputes: [],
  pendingDeliveryAssignments: [],
  pipeline: [],
  weeklyOrders: [],
  recentOrders: [],
};

// Mapping from backend pipeline stage keys to human-readable labels + colors.
// Covers the full 10-state model; stages with 0 count are hidden in the UI.
const PIPELINE_LABELS: Record<string, string> = {
  PLACED: 'Placed', CONFIRMED: 'Confirmed', PACKED: 'Packed',
  READY_FOR_PICKUP: 'Ready', ASSIGNED_TO_DELIVERY: 'Assigned', PICKED_UP: 'Picked Up',
  OUT_FOR_DELIVERY: 'In Transit', DELIVERED: 'Delivered', CANCELLED: 'Cancelled', REFUNDED: 'Refunded',
};
const PIPELINE_COLORS: Record<string, string> = {
  PLACED: '#3B82F6', CONFIRMED: '#8B5CF6', PACKED: '#F59E0B',
  READY_FOR_PICKUP: '#EC4899', ASSIGNED_TO_DELIVERY: '#6366F1', PICKED_UP: '#14B8A6',
  OUT_FOR_DELIVERY: '#10B981', DELIVERED: '#22C55E', CANCELLED: '#EF4444', REFUNDED: '#6B7280',
};

function getTimeAgo(dateStr: string): string {
  const now = new Date();
  const date = new Date(dateStr);
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays}d ago`;
  return `${Math.floor(diffDays / 7)}w ago`;
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData>(EMPTY_DATA);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadDashboard(); }, []);

  const loadDashboard = async () => {
    try {
      const result = await adminApi.getDashboard();
      // The backend returns the full dashboard payload directly (the response
      // interceptor unwraps the { success, data } envelope automatically).
      const d = result?.data || result;

      // Map backend pipeline stages to the UI's { stage, count, color } format.
      const pipeline = (d.pipeline || []).map((s: any) => ({
        stage: PIPELINE_LABELS[s.stage] || s.stage,
        count: s.count,
        color: PIPELINE_COLORS[s.stage] || '#94A3B8',
      })).filter((s: any) => s.count > 0);

      setData({
        gmvToday: d.gmvToday ?? 0,
        ordersToday: d.ordersToday ?? 0,
        pendingActions: d.pendingActions ?? 0,
        activeDeliveryPartners: d.activeDeliveryPartners ?? 0,
        totalDeliveryPartners: d.totalDeliveryPartners ?? 0,
        pendingVendorApprovals: (d.pendingVendorApprovals || []).map((v: any) => ({
          id: v.id,
          storeName: v.storeName,
          email: v.email || '',
          createdAt: v.createdAt,
        })),
        pendingProductApprovals: (d.pendingProductApprovals || []).map((p: any) => ({
          id: p.id,
          name: p.name,
          vendorName: p.vendorName,
          createdAt: p.createdAt,
        })),
        openDisputes: (d.openDisputes || []).map((di: any) => ({
          id: di.id,
          orderId: di.orderId,
          orderNo: di.orderNo,
          reason: di.reason,
          createdAt: di.createdAt,
        })),
        pendingDeliveryAssignments: (d.pendingDeliveryAssignments || []).map((a: any) => ({
          id: a.id,
          orderNo: a.orderNo,
          vendorName: a.vendorName,
          createdAt: a.createdAt,
        })),
        pipeline,
        weeklyOrders: (d.weeklyOrders || []).map((w: any) => ({
          day: w.day,
          orders: w.orders,
          revenue: w.revenue,
        })),
        recentOrders: (d.recentOrders || []).slice(0, 5),
      });
    } catch {
      // Dashboard unavailable — state stays at EMPTY_DATA defaults
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6" role="status" aria-label="Loading dashboard">
        <div className="h-8 w-48 bg-slate-100 rounded-lg animate-pulse" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => <div key={i} className="h-24 bg-slate-100 rounded-xl animate-pulse" />)}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => <div key={i} className="h-32 bg-slate-100 rounded-xl animate-pulse" />)}
        </div>
        <span className="sr-only">Loading dashboard data...</span>
      </div>
    );
  }

  const hasActions = data.pendingActions > 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-slate-900">Dashboard</h2>
        <p className="text-sm text-slate-500">Platform overview for today</p>
      </div>

      {/* Today's Pulse */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-50 rounded-lg">
              <DollarSign className="w-5 h-5 text-emerald-600" aria-hidden="true" />
            </div>
            <div>
              <p className="text-xs text-slate-500 font-medium">GMV Today</p>
              <p className="text-xl font-bold text-slate-900 tabular-nums">₹{data.gmvToday.toLocaleString('en-IN')}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-50 rounded-lg">
              <ShoppingCart className="w-5 h-5 text-blue-600" aria-hidden="true" />
            </div>
            <div>
              <p className="text-xs text-slate-500 font-medium">Orders Today</p>
              <p className="text-xl font-bold text-slate-900 tabular-nums">{data.ordersToday}</p>
            </div>
          </div>
        </div>

        <Link
          href="#pending-actions"
          className={`bg-white rounded-xl border p-4 transition-all duration-150 ${
            hasActions
              ? 'border-amber-300 bg-amber-50/50 hover:border-amber-400 hover:shadow-sm cursor-pointer'
              : 'border-slate-200'
          }`}
        >
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-lg ${hasActions ? 'bg-amber-100' : 'bg-slate-100'}`}>
              <AlertTriangle className={`w-5 h-5 ${hasActions ? 'text-amber-600' : 'text-slate-400'}`} aria-hidden="true" />
            </div>
            <div>
              <p className="text-xs text-slate-500 font-medium">Pending Actions</p>
              <p className={`text-xl font-bold tabular-nums ${hasActions ? 'text-amber-700' : 'text-slate-900'}`}>
                {data.pendingActions}
              </p>
            </div>
            {hasActions && <ArrowRight className="w-4 h-4 text-amber-500 ml-auto" aria-hidden="true" />}
          </div>
        </Link>

        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-purple-50 rounded-lg">
              <Truck className="w-5 h-5 text-purple-600" aria-hidden="true" />
            </div>
            <div>
              <p className="text-xs text-slate-500 font-medium">Active Partners</p>
              <p className="text-xl font-bold text-slate-900 tabular-nums">
                {data.activeDeliveryPartners}<span className="text-sm font-normal text-slate-400">/{data.totalDeliveryPartners}</span>
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Pending Actions Queue */}
      {hasActions && (
        <div id="pending-actions" className="space-y-3">
          <h3 className="text-sm font-semibold text-slate-700 uppercase tracking-wide">Needs Your Attention</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Vendor Approvals */}
            {data.pendingVendorApprovals.length > 0 && (
              <Link
                href="/vendors/approvals"
                className="bg-white rounded-xl border border-amber-200 p-4 hover:shadow-md hover:border-amber-300 transition-all duration-150 cursor-pointer group"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Store className="w-4 h-4 text-amber-600" aria-hidden="true" />
                    <span className="text-sm font-semibold text-slate-800">Vendor Approvals</span>
                  </div>
                  <span className="text-xs font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full">
                    {data.pendingVendorApprovals.length}
                  </span>
                </div>
                <div className="space-y-1.5">
                  {data.pendingVendorApprovals.map((v) => (
                    <div key={v.id} className="flex items-center justify-between text-xs">
                      <span className="text-slate-600 truncate">{v.storeName}</span>
                      <span className="text-slate-400 shrink-0 ml-2">{getTimeAgo(v.createdAt)}</span>
                    </div>
                  ))}
                </div>
                <div className="flex items-center gap-1 text-xs text-emerald-600 font-medium mt-3 group-hover:text-emerald-700">
                  Review all <ArrowRight className="w-3 h-3" aria-hidden="true" />
                </div>
              </Link>
            )}

            {/* Product Approvals */}
            {data.pendingProductApprovals.length > 0 && (
              <Link
                href="/products"
                className="bg-white rounded-xl border border-blue-200 p-4 hover:shadow-md hover:border-blue-300 transition-all duration-150 cursor-pointer group"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Package className="w-4 h-4 text-blue-600" aria-hidden="true" />
                    <span className="text-sm font-semibold text-slate-800">Product Approvals</span>
                  </div>
                  <span className="text-xs font-bold text-blue-700 bg-blue-100 px-2 py-0.5 rounded-full">
                    {data.pendingProductApprovals.length}
                  </span>
                </div>
                <div className="space-y-1.5">
                  {data.pendingProductApprovals.map((p) => (
                    <div key={p.id} className="flex items-center justify-between text-xs">
                      <span className="text-slate-600 truncate">{p.name}</span>
                      <span className="text-slate-400 shrink-0 ml-2">{getTimeAgo(p.createdAt)}</span>
                    </div>
                  ))}
                </div>
                <div className="flex items-center gap-1 text-xs text-emerald-600 font-medium mt-3 group-hover:text-emerald-700">
                  Review all <ArrowRight className="w-3 h-3" aria-hidden="true" />
                </div>
              </Link>
            )}

            {/* Open Disputes */}
            {data.openDisputes.length > 0 && (
              <Link
                href="/disputes"
                className="bg-white rounded-xl border border-red-200 p-4 hover:shadow-md hover:border-red-300 transition-all duration-150 cursor-pointer group"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <RotateCcw className="w-4 h-4 text-red-600" aria-hidden="true" />
                    <span className="text-sm font-semibold text-slate-800">Open Disputes</span>
                  </div>
                  <span className="text-xs font-bold text-red-700 bg-red-100 px-2 py-0.5 rounded-full">
                    {data.openDisputes.length}
                  </span>
                </div>
                <div className="space-y-1.5">
                  {data.openDisputes.map((d) => (
                    <div key={d.id} className="flex items-center justify-between text-xs">
                      <span className="text-slate-600 truncate">#{d.orderNo}</span>
                      <span className="text-slate-400 shrink-0 ml-2">{getTimeAgo(d.createdAt)}</span>
                    </div>
                  ))}
                </div>
                <div className="flex items-center gap-1 text-xs text-emerald-600 font-medium mt-3 group-hover:text-emerald-700">
                  Resolve <ArrowRight className="w-3 h-3" aria-hidden="true" />
                </div>
              </Link>
            )}

            {/* Pending Delivery Assignments */}
            {data.pendingDeliveryAssignments.length > 0 && (
              <Link
                href="/orders"
                className="bg-white rounded-xl border border-purple-200 p-4 hover:shadow-md hover:border-purple-300 transition-all duration-150 cursor-pointer group"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Truck className="w-4 h-4 text-purple-600" aria-hidden="true" />
                    <span className="text-sm font-semibold text-slate-800">Assign Delivery</span>
                  </div>
                  <span className="text-xs font-bold text-purple-700 bg-purple-100 px-2 py-0.5 rounded-full">
                    {data.pendingDeliveryAssignments.length}
                  </span>
                </div>
                <div className="space-y-1.5">
                  {data.pendingDeliveryAssignments.map((d) => (
                    <div key={d.id} className="flex items-center justify-between text-xs">
                      <span className="text-slate-600 truncate">#{d.orderNo}</span>
                      <span className="text-slate-400 shrink-0 ml-2">{getTimeAgo(d.createdAt)}</span>
                    </div>
                  ))}
                </div>
                <div className="flex items-center gap-1 text-xs text-emerald-600 font-medium mt-3 group-hover:text-emerald-700">
                  View orders <ArrowRight className="w-3 h-3" aria-hidden="true" />
                </div>
              </Link>
            )}
          </div>
        </div>
      )}

      {/* Order Pipeline + Revenue Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Order Pipeline — 2/5 width */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 p-5">
          <h3 className="text-sm font-semibold text-slate-700 mb-4">Order Pipeline</h3>
          {data.pipeline.some(s => s.count > 0) ? (
            <div className="space-y-2.5">
              {data.pipeline.map((stage) => {
                const maxCount = Math.max(...data.pipeline.map(s => s.count), 1);
                const pct = (stage.count / maxCount) * 100;
                return (
                  <div key={stage.stage} className="flex items-center gap-3">
                    <span className="w-24 text-xs text-slate-500 shrink-0">{stage.stage}</span>
                    <div className="flex-1 h-6 bg-slate-50 rounded-md overflow-hidden relative">
                      <div
                        className="h-full rounded-md transition-all duration-700 ease-out flex items-center justify-end pr-2"
                        style={{ width: `${Math.max(pct, stage.count > 0 ? 12 : 0)}%`, backgroundColor: stage.color }}
                      >
                        {stage.count > 0 && (
                          <span className="text-[10px] font-bold text-white tabular-nums">{stage.count}</span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="h-48 flex flex-col items-center justify-center text-slate-400">
              <BarChart3 className="w-8 h-8 mb-2 opacity-40" aria-hidden="true" />
              <p className="text-xs">No orders yet</p>
            </div>
          )}
        </div>

        {/* Revenue Chart — 3/5 width */}
        <div className="lg:col-span-3 bg-white rounded-xl border border-slate-200 p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-slate-700">Revenue (Last 7 Days)</h3>
            <Link href="/reports" className="text-xs text-emerald-600 hover:text-emerald-700 font-medium cursor-pointer transition-colors">
              Full report <ChevronRight className="w-3 h-3 inline" />
            </Link>
          </div>
          {data.weeklyOrders.some(d => d.orders > 0) ? (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={data.weeklyOrders} aria-label="Revenue over last 7 days">
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="day" tick={{ fontSize: 11, fill: '#94A3B8' }} stroke="#E2E8F0" />
                <YAxis tick={{ fontSize: 11, fill: '#94A3B8' }} stroke="#E2E8F0" />
                <Tooltip
                  contentStyle={{ borderRadius: 8, border: '1px solid #E2E8F0', fontSize: 12, boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  formatter={(value, name) => [
                    name === 'revenue' ? `₹${Number(value).toLocaleString('en-IN')}` : value,
                    name === 'revenue' ? 'Revenue' : 'Orders'
                  ]}
                />
                <Legend iconType="circle" iconSize={8} />
                <Bar dataKey="orders" fill="#10B981" radius={[4, 4, 0, 0]} name="Orders" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[200px] flex flex-col items-center justify-center text-slate-400">
              <BarChart3 className="w-8 h-8 mb-2 opacity-40" aria-hidden="true" />
              <p className="text-xs">No order data yet</p>
            </div>
          )}
        </div>
      </div>

      {/* Recent Orders */}
      <div className="bg-white rounded-xl border border-slate-200 p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-slate-700">Recent Orders</h3>
          <Link href="/orders" className="text-xs text-emerald-600 hover:text-emerald-700 font-medium cursor-pointer transition-colors">
            View all <ChevronRight className="w-3 h-3 inline" />
          </Link>
        </div>
        {data.recentOrders.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm" role="list" aria-label="Recent orders">
              <thead>
                <tr className="text-xs text-slate-500 border-b border-slate-100">
                  <th className="text-left py-2 font-medium">Order</th>
                  <th className="text-left py-2 font-medium">Customer</th>
                  <th className="text-left py-2 font-medium">Status</th>
                  <th className="text-right py-2 font-medium">Amount</th>
                  <th className="text-right py-2 font-medium">Date</th>
                </tr>
              </thead>
              <tbody>
                {data.recentOrders.map((order: any) => (
                  <tr
                    key={order.id}
                    className="border-b border-slate-50 last:border-0 hover:bg-slate-50/50 transition-colors cursor-pointer"
                    role="listitem"
                    onClick={() => window.location.href = `/orders/${order.id}`}
                  >
                    <td className="py-2.5 font-medium text-slate-800">#{order.orderNo || order.id?.slice(0, 8)}</td>
                    <td className="py-2.5 text-slate-600">{order.customerName || order.user?.name || '—'}</td>
                    <td className="py-2.5"><StatusBadge status={order.status} /></td>
                    <td className="py-2.5 text-right font-semibold text-slate-800 tabular-nums">₹{Number(order.totalAmount || 0).toLocaleString('en-IN')}</td>
                    <td className="py-2.5 text-right text-slate-400 tabular-nums">
                      {new Date(order.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-8 text-slate-400">
            <ShoppingCart className="w-8 h-8 mx-auto mb-2 opacity-40" aria-hidden="true" />
            <p className="text-xs">No orders yet</p>
          </div>
        )}
      </div>
    </div>
  );
}
