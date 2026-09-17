'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Package, ShoppingCart, DollarSign, AlertTriangle, ArrowRight,
  TrendingUp, Store, Star, BarChart3, AlertCircle, RotateCcw
} from 'lucide-react';
import StatsCard from '@/components/StatsCard';
import StatusBadge from '@/components/StatusBadge';
import ErrorState from '@/components/ErrorState';
import { vendorApi } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, AreaChart, Area, Legend
} from 'recharts';

interface DashboardData {
  newOrders: number;
  revenueToday: number;
  lowStockCount: number;
  pendingPayout: number;
  recentOrders: any[];
  revenueTrend: { period: string; revenue: number }[];
  revenueLabel: string;
  ordersByStatus: { status: string; count: number }[];
  topProducts: any[];
  fetchFailed: boolean;
}

const EMPTY_DATA: Omit<DashboardData, 'revenueTrend' | 'revenueLabel'> = {
  newOrders: 0,
  revenueToday: 0,
  lowStockCount: 0,
  pendingPayout: 0,
  recentOrders: [],
  ordersByStatus: [],
  topProducts: [],
  fetchFailed: false,
};

// Static color map for quick actions — dynamic `bg-${color}-50` class names
// are purged by Tailwind in production, so every class must appear literally.
const QUICK_ACTION_STYLES: Record<string, { bg: string; text: string }> = {
  emerald: { bg: 'bg-emerald-50', text: 'text-emerald-600' },
  blue: { bg: 'bg-blue-50', text: 'text-blue-600' },
  amber: { bg: 'bg-amber-50', text: 'text-amber-600' },
  rose: { bg: 'bg-rose-50', text: 'text-rose-600' },
};

const STATUS_COLORS: Record<string, string> = {
  PLACED: '#3B82F6',
  CONFIRMED: '#8B5CF6',
  PACKED: '#F59E0B',
  ASSIGNED_TO_DELIVERY: '#6366F1',
  PICKED_UP: '#14B8A6',
  OUT_FOR_DELIVERY: '#10B981',
  DELIVERED: '#22C55E',
  CANCELLED: '#EF4444',
  REFUNDED: '#6B7280',
};

const READY_FOR_PICKUP_COLOR = '#0EA5E9';

export default function DashboardPage() {
  const { vendorProfile } = useAuth();
  const [data, setData] = useState<DashboardData>({ ...EMPTY_DATA, revenueTrend: [], revenueLabel: '' });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboard();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [vendorProfile?.id]);

  const loadDashboard = async () => {
    try {
      const vendorId = vendorProfile?.id;
      const [products, orders, earnings, analytics] = await Promise.allSettled([
        vendorId
          ? vendorApi.getVendorProducts(vendorId, { page: '1', limit: '100' })
          : Promise.reject(new Error('Vendor profile not loaded yet')),
        vendorApi.getOrders({}),
        vendorApi.getEarnings(),
        vendorApi.getAnalytics('30d'),
      ]);

      const productsData = products.status === 'fulfilled' ? products.value : null;
      const ordersData = orders.status === 'fulfilled' ? orders.value : null;
      const earningsData = earnings.status === 'fulfilled' ? earnings.value : null;
      const analyticsData = analytics.status === 'fulfilled' ? analytics.value : null;

      // The vendor-scoped endpoints drive the headline numbers. If analytics
      // AND earnings AND orders all failed, the dashboard would show confident
      // zeros — surface that as an error instead (Bug 1 in the audit).
      const fetchFailed = orders.status === 'rejected' && analytics.status === 'rejected' && earnings.status === 'rejected';

      // Orders: backend interceptor double-nests → { data: { data: [...], meta } }
      // Unwrap to get the actual array of vendor groups
      const rawOrders = Array.isArray(ordersData?.data) ? ordersData.data
        : Array.isArray(ordersData?.data?.data) ? ordersData.data.data
        : Array.isArray(ordersData) ? ordersData : [];
      const orderList = Array.isArray(rawOrders) ? rawOrders : [];
      const rawProducts = Array.isArray(productsData?.data) ? productsData.data
        : Array.isArray(productsData?.data?.data) ? productsData.data.data
        : Array.isArray(productsData) ? productsData : [];
      const productList = Array.isArray(rawProducts) ? rawProducts : [];

      // Today-scoped revenue — use group subtotal and order.createdAt
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayOrders = orderList.filter((o: any) => {
        const d = o.order?.createdAt || o.createdAt;
        return d ? new Date(d) >= today : false;
      });
      const revenueToday = todayOrders.reduce((sum: number, o: any) => sum + Number(o.subtotal || 0), 0);

      // New orders = PLACED or CONFIRMED (check group status)
      const newOrders = orderList.filter((o: any) =>
        o.status === 'PLACED' || o.status === 'CONFIRMED'
      ).length;

      // Earnings: backend returns { pendingPayout, ... } (₹)
      const pendingPayout = Number(earningsData?.pendingPayout || earningsData?.pendingEarnings || 0);

      // Revenue trend. The analytics endpoint returns monthlyRevenue buckets,
      // so label the chart honestly as months (audit Bug 1: the chart claimed
      // "days" while plotting months). Falls back to the vendor-group list
      // when analytics didn't load.
      const monthly = analyticsData?.monthlyRevenue;
      let revenueTrend: { period: string; revenue: number }[] = [];
      let revenueLabel = 'Revenue (Last 7 Days)';
      if (Array.isArray(monthly) && monthly.length > 0) {
        revenueTrend = monthly.slice(-7).map((m: any) => ({
          period: m.month ? new Date(m.month + '-01').toLocaleDateString('en-IN', { month: 'short' }) : '',
          revenue: Number(m.revenue || 0),
        }));
        revenueLabel = 'Revenue by Month';
      } else {
        // Fallback: aggregate the vendor-group list we already have, last 7 days
        const days: { period: string; revenue: number }[] = [];
        for (let i = 6; i >= 0; i--) {
          const dayStart = new Date();
          dayStart.setDate(dayStart.getDate() - i);
          dayStart.setHours(0, 0, 0, 0);
          const dayEnd = new Date(dayStart);
          dayEnd.setDate(dayEnd.getDate() + 1);
          const dayRevenue = orderList
            .filter((o: any) => {
              const d = o.order?.createdAt || o.createdAt;
              const cancelled = o.status === 'CANCELLED' || o.status === 'REFUNDED';
              return d && !cancelled && new Date(d) >= dayStart && new Date(d) < dayEnd;
            })
            .reduce((sum: number, o: any) => sum + Number(o.subtotal || 0), 0);
          days.push({
            period: dayStart.toLocaleDateString('en-IN', { weekday: 'short' }),
            revenue: dayRevenue,
          });
        }
        revenueTrend = days;
      }

      // Status breakdown from analytics, fallback: tally the visible order list
      const ordersByStatus = analyticsData?.orderStatusBreakdown
        ? Object.entries(analyticsData.orderStatusBreakdown).map(([status, count]: [string, any]) => ({ status, count }))
        : Object.entries(
            orderList.reduce((acc: Record<string, number>, o: any) => {
              if (o.status) acc[o.status] = (acc[o.status] || 0) + 1;
              return acc;
            }, {})
          ).map(([status, count]) => ({ status, count }));

      // Top products from the vendor's own product list (analytic recentOrders
      // are orders, not products — mapping them to a "Top Products" card was
      // mislabeled). Products aren't ordered by sales yet; show newest first.
      const topProducts = productList.slice(0, 5).map((p: any) => ({
        id: p.id,
        name: p.name,
        price: p.price,
      }));

      setData({
        newOrders,
        revenueToday,
        lowStockCount: productList.filter((p: any) => p.stock !== undefined && p.stock <= 5).length,
        pendingPayout,
        recentOrders: orderList.slice(0, 5),
        revenueTrend,
        revenueLabel,
        ordersByStatus,
        topProducts,
        fetchFailed,
      });
    } catch {
      // Unhandled crash — surface as error state rather than silent zeros
      setData((d) => ({ ...d, fetchFailed: true }));
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6" role="status" aria-label="Loading dashboard">
        <div className="h-8 w-48 bg-slate-200 rounded animate-pulse" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-28 bg-slate-100 rounded-xl animate-pulse" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="h-72 bg-slate-100 rounded-xl animate-pulse" />
          <div className="h-72 bg-slate-100 rounded-xl animate-pulse" />
        </div>
        <span className="sr-only">Loading dashboard data...</span>
      </div>
    );
  }

  if (data.fetchFailed) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Dashboard</h2>
          <p className="text-sm text-slate-500">Overview of your store performance</p>
        </div>
        <ErrorState
          message="The server didn't respond. Your store data hasn't changed — this is a connection issue."
          onRetry={() => {
            setLoading(true);
            setData({ ...EMPTY_DATA, revenueTrend: [], revenueLabel: '' });
            loadDashboard();
          }}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-slate-900">Dashboard</h2>
        <p className="text-sm text-slate-500">Overview of your store performance</p>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          icon={ShoppingCart}
          label="New Orders"
          value={data.newOrders}
          accent="blue"
        />
        <StatsCard
          icon={DollarSign}
          label="Revenue Today"
          value={`₹${data.revenueToday.toLocaleString('en-IN')}`}
          accent="emerald"
        />
        <StatsCard
          icon={AlertTriangle}
          label="Low Stock"
          value={data.lowStockCount}
          accent="rose"
        />
        <StatsCard
          icon={TrendingUp}
          label="Pending Payout"
          value={`₹${data.pendingPayout.toLocaleString('en-IN')}`}
          accent="amber"
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">          {/* Revenue Chart */}
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6 card-hover">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-slate-900 dark:text-slate-100">{data.revenueLabel}</h3>
            <Link
              href="/analytics"
              className="text-xs text-emerald-600 hover:text-emerald-700 font-medium cursor-pointer transition-colors duration-150 btn-press"
            >
              View details
            </Link>
          </div>
          {data.revenueTrend.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={data.revenueTrend} aria-label={`Area chart showing ${data.revenueLabel.toLowerCase()}`}>
                <defs>
                  <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#10B981" stopOpacity={0.2} />
                    <stop offset="100%" stopColor="#10B981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="period" tick={{ fontSize: 11, fill: '#94A3B8' }} stroke="#E2E8F0" />
                <YAxis tick={{ fontSize: 11, fill: '#94A3B8' }} stroke="#E2E8F0" />
                <Tooltip
                  contentStyle={{ borderRadius: 8, border: '1px solid #E2E8F0', fontSize: 12, boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  formatter={(value) => [`₹${Number(value).toLocaleString('en-IN')}`, 'Revenue']}
                />
                <Legend iconType="circle" iconSize={8} />
                <Area type="monotone" dataKey="revenue" stroke="#10B981" strokeWidth={2} fill="url(#revenueGrad)" name="Revenue" />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[220px] flex flex-col items-center justify-center text-slate-400">
              <BarChart3 className="w-10 h-10 mb-2 opacity-40" aria-hidden="true" />
              <p className="text-sm">No revenue data yet</p>
            </div>
          )}
        </div>          {/* Orders by Status */}
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6 card-hover">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-slate-900 dark:text-slate-100">Orders by Status</h3>
            <Link
              href="/orders"
              className="text-xs text-emerald-600 hover:text-emerald-700 font-medium cursor-pointer transition-colors duration-150 btn-press"
            >
              View all
            </Link>
          </div>
          {data.ordersByStatus.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={data.ordersByStatus} layout="vertical" aria-label="Horizontal bar chart showing orders by status">
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 11, fill: '#94A3B8' }} stroke="#E2E8F0" />
                <YAxis
                  type="category"
                  dataKey="status"
                  tick={{ fontSize: 11, fill: '#94A3B8' }}
                  stroke="#E2E8F0"
                  width={100}
                  tickFormatter={(v: string) => v.replace(/_/g, ' ')}
                />
                <Tooltip
                  contentStyle={{ borderRadius: 8, border: '1px solid #E2E8F0', fontSize: 12, boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                  {data.ordersByStatus.map((entry, index) => (
                    <rect key={`cell-${index}`} fill={STATUS_COLORS[entry.status] || READY_FOR_PICKUP_COLOR} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[220px] flex flex-col items-center justify-center text-slate-400">
              <ShoppingCart className="w-10 h-10 mb-2 opacity-40" aria-hidden="true" />
              <p className="text-sm">No orders yet</p>
            </div>
          )}
        </div>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Orders */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6 card-hover">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-slate-900 dark:text-slate-100">Recent Orders</h3>
            <Link
              href="/orders"
              className="text-xs text-emerald-600 hover:text-emerald-700 font-medium cursor-pointer transition-colors duration-150 btn-press"
            >
              View all
            </Link>
          </div>
          {data.recentOrders.length > 0 ? (
            <div className="space-y-1" role="list" aria-label="Recent orders">
              {data.recentOrders.map((order: any) => (
                <Link
                  key={order.id}
                  href={`/orders/${order.id}`}
                  className="flex items-center justify-between p-3 rounded-lg hover:bg-slate-50 transition-colors duration-150 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-500"
                  role="listitem"
                  aria-label={`Order ${order.orderNo || order.id?.slice(0, 8)} - ₹${Number(order.subtotal || 0).toLocaleString('en-IN')}`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 bg-blue-50 rounded-lg flex items-center justify-center">
                      <ShoppingCart className="w-4 h-4 text-blue-600" aria-hidden="true" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-700">
                        #{order.orderNo || order.id?.slice(0, 8)}
                      </p>
                      <p className="text-xs text-slate-400">
                        {order.customer?.name || order.user?.name || 'Customer'}
                      </p>
                    </div>
                  </div>
                  <div className="text-right flex items-center gap-3">
                    <div>
                      <p className="text-sm font-semibold text-slate-800 tabular-nums">
                        ₹{Number(order.subtotal || 0).toLocaleString('en-IN')}
                      </p>
                      <p className="text-xs text-slate-400">
                        {new Date(order.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                      </p>
                    </div>
                    <StatusBadge status={order.status} />
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-10 text-slate-400">
              <ShoppingCart className="w-10 h-10 mx-auto mb-2 opacity-40" aria-hidden="true" />
              <p className="text-sm">No orders yet</p>
            </div>
          )}
        </div>

        {/* Quick Actions + Top Products */}
        <div className="space-y-6">
          {/* Quick Actions */}
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6 card-hover">
            <h3 className="font-semibold text-slate-900 dark:text-slate-100 mb-4">Quick Actions</h3>
            <div className="space-y-1" role="list" aria-label="Quick actions">
              {[
                { href: '/products/add', label: 'Add Product', icon: Package, color: 'emerald' },
                { href: '/orders', label: 'View Orders', icon: ShoppingCart, color: 'blue' },
                { href: '/earnings', label: 'Check Earnings', icon: DollarSign, color: 'amber' },
                { href: '/inventory/low-stock', label: 'Stock Alerts', icon: AlertTriangle, color: 'rose' },
              ].map((action) => {
                const style = QUICK_ACTION_STYLES[action.color] || QUICK_ACTION_STYLES.emerald;
                return (
                <Link
                  key={action.href}
                  href={action.href}
                  className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-slate-50 transition-colors duration-150 group cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-500"
                  role="listitem"
                  aria-label={action.label}
                >
                  <div className={`p-1.5 ${style.bg} rounded-md`}>
                    <action.icon className={`w-4 h-4 ${style.text}`} aria-hidden="true" />
                  </div>
                  <span className="text-sm font-medium text-slate-600 group-hover:text-slate-800 flex-1">
                    {action.label}
                  </span>
                  <ArrowRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-emerald-500 transition-colors duration-150" aria-hidden="true" />
                </Link>
                );
              })}
            </div>
          </div>

          {/* Top Products */}
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6 card-hover">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-slate-900 dark:text-slate-100">Top Products</h3>
              <Link
                href="/products"
                className="text-xs text-emerald-600 hover:text-emerald-700 font-medium cursor-pointer transition-colors duration-150 btn-press"
              >
                View all
              </Link>
            </div>
            {data.topProducts.length > 0 ? (
              <div className="space-y-3" role="list" aria-label="Top products">
                {data.topProducts.slice(0, 4).map((product: any, i: number) => (
                  <div key={product.id || i} className="flex items-center gap-3" role="listitem">
                    <span className="text-xs font-bold text-slate-300 w-4 tabular-nums">{i + 1}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-700 truncate">{product.name}</p>
                      <p className="text-xs text-slate-400 tabular-nums">₹{Number(product.price || 0).toLocaleString('en-IN')}</p>
                    </div>
                    <Star className="w-3.5 h-3.5 text-amber-400" aria-hidden="true" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6 text-slate-400">
                <Store className="w-8 h-8 mx-auto mb-2 opacity-40" aria-hidden="true" />
                <p className="text-sm">No products yet</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
