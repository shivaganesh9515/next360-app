'use client';

import { useState, useEffect } from 'react';
import { BarChart3, TrendingUp, DollarSign, ShoppingCart } from 'lucide-react';
import StatsCard from '@/components/StatsCard';
import { vendorApi } from '@/lib/api';

export default function AnalyticsPage() {
  const [analytics, setAnalytics] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    vendorApi.getAnalytics('30d').then(setAnalytics).catch(() => {}).finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="space-y-4" role="status" aria-label="Loading analytics">
      <div className="h-8 w-48 bg-slate-200 rounded animate-pulse" />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-28 bg-slate-100 rounded-xl animate-pulse" />
        ))}
      </div>
      <span className="sr-only">Loading analytics...</span>
    </div>
  );

  return (
    <div className="space-y-6">
      <div><h2 className="text-xl font-bold text-slate-900">Analytics</h2><p className="text-sm text-slate-500">Track your store performance</p></div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard icon={DollarSign} label="Total Revenue" value={analytics ? `₹${Number(analytics.totalRevenue || 0).toLocaleString()}` : '₹0'} accent="emerald" />
        <StatsCard icon={ShoppingCart} label="Total Orders" value={analytics?.totalOrders || 0} accent="blue" />
        <StatsCard icon={TrendingUp} label="Avg Order Value" value={analytics ? `₹${Number(analytics.avgOrderValue || 0).toLocaleString()}` : '₹0'} accent="amber" />
        <StatsCard icon={BarChart3} label="Top Product" value={analytics?.topProduct?.name || 'N/A'} accent="purple" />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
          <h3 className="font-semibold text-slate-900 mb-4">Revenue Over Time</h3>
          {analytics?.revenueOverTime?.length > 0 ? (
            <div className="h-64 flex items-end gap-2">
              {analytics.revenueOverTime.map((d: any, i: number) => {
                const max = Math.max(...analytics.revenueOverTime.map((x: any) => x.revenue));
                const h = max > 0 ? (d.revenue / max) * 100 : 0;
                return <div key={i} className="flex-1 flex flex-col items-center">
                  <div className="w-full bg-emerald-100 rounded-t" style={{ height: `${h}%`, minHeight: d.revenue > 0 ? 8 : 0 }} title={`₹${d.revenue}`} />
                  <span className="text-[10px] text-slate-400 mt-1 rotate-45 origin-left">{new Date(d.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}</span>
                </div>;
              })}
            </div>
          ) : <div className="h-64 flex items-center justify-center text-slate-400 text-sm">No data yet</div>}
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
          <h3 className="font-semibold text-slate-900 mb-4">Orders by Status</h3>
          {analytics?.ordersByStatus?.length > 0 ? (
            <div className="space-y-3">
              {analytics.ordersByStatus.map((s: any) => (
                <div key={s.status} className="flex items-center gap-3">
                  <span className="w-32 text-sm text-slate-600">{s.status.replace(/_/g, ' ')}</span>
                  <div className="flex-1 h-3 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${(s.count / Math.max(...analytics.ordersByStatus.map((x: any) => x.count))) * 100}%` }} />
                  </div>
                  <span className="text-sm font-medium text-slate-700 w-10 text-right">{s.count}</span>
                </div>
              ))}
            </div>
          ) : <div className="text-center py-8 text-slate-400 text-sm">No orders yet</div>}
        </div>
      </div>
    </div>
  );
}
