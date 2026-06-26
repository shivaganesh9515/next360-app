'use client';

import { useState, useEffect } from 'react';
import { BarChart3, TrendingUp, DollarSign, ShoppingCart } from 'lucide-react';
import StatsCard from '@/components/StatsCard';
import { vendorApi } from '@/lib/api';

export default function AnalyticsPage() {
  const [analytics, setAnalytics] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    vendorApi.getAnalytics('30d').then(setAnalytics).catch(console.error).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="text-center py-12 text-gray-500">Loading...</div>;

  return (
    <div className="space-y-6">
      <div><h2 className="text-xl font-bold text-gray-800">Analytics</h2><p className="text-sm text-gray-500">Track your store performance</p></div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard icon={DollarSign} label="Total Revenue" value={analytics ? `₹${Number(analytics.totalRevenue || 0).toLocaleString()}` : '₹0'} accent="emerald" />
        <StatsCard icon={ShoppingCart} label="Total Orders" value={analytics?.totalOrders || 0} accent="blue" />
        <StatsCard icon={TrendingUp} label="Avg Order Value" value={analytics ? `₹${Number(analytics.avgOrderValue || 0).toLocaleString()}` : '₹0'} accent="amber" />
        <StatsCard icon={BarChart3} label="Top Product" value={analytics?.topProduct?.name || 'N/A'} accent="purple" />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="font-semibold text-gray-800 mb-4">Revenue Over Time</h3>
          {analytics?.revenueOverTime?.length > 0 ? (
            <div className="h-64 flex items-end gap-2">
              {analytics.revenueOverTime.map((d: any, i: number) => {
                const max = Math.max(...analytics.revenueOverTime.map((x: any) => x.revenue));
                const h = max > 0 ? (d.revenue / max) * 100 : 0;
                return <div key={i} className="flex-1 flex flex-col items-center">
                  <div className="w-full bg-emerald-100 rounded-t" style={{ height: `${h}%`, minHeight: d.revenue > 0 ? 8 : 0 }} title={`₹${d.revenue}`} />
                  <span className="text-[10px] text-gray-400 mt-1 rotate-45 origin-left">{new Date(d.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}</span>
                </div>;
              })}
            </div>
          ) : <div className="h-64 flex items-center justify-center text-gray-400 text-sm">No data yet</div>}
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="font-semibold text-gray-800 mb-4">Orders by Status</h3>
          {analytics?.ordersByStatus?.length > 0 ? (
            <div className="space-y-3">
              {analytics.ordersByStatus.map((s: any) => (
                <div key={s.status} className="flex items-center gap-3">
                  <span className="w-32 text-sm text-gray-600">{s.status.replace(/_/g, ' ')}</span>
                  <div className="flex-1 h-3 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${(s.count / Math.max(...analytics.ordersByStatus.map((x: any) => x.count))) * 100}%` }} />
                  </div>
                  <span className="text-sm font-medium text-gray-700 w-10 text-right">{s.count}</span>
                </div>
              ))}
            </div>
          ) : <div className="text-center py-8 text-gray-400 text-sm">No orders yet</div>}
        </div>
      </div>
    </div>
  );
}
