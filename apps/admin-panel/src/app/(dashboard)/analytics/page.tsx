'use client';

import { useState, useEffect } from 'react';
import { TrendingUp, DollarSign, ShoppingCart, Users } from 'lucide-react';
import StatsCard from '@/components/StatsCard';
import { adminApi } from '@/lib/api';

export default function AnalyticsPage() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('7d');

  useEffect(() => { loadAnalytics(); }, [period]);

  const loadAnalytics = async () => {
    setLoading(true);
    try { const res = await adminApi.getAnalytics({ period }); setStats(res); }
    catch { setStats(null); } finally { setLoading(false); }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-800">Analytics</h2>
          <p className="text-sm text-gray-500">Platform performance insights</p>
        </div>
        <div className="flex gap-2">
          {['7d', '30d', '90d'].map(p => (
            <button key={p} onClick={() => setPeriod(p)} className={`px-3 py-1.5 text-xs rounded-lg border transition-colors ${period === p ? 'bg-emerald-600 text-white border-emerald-600' : 'border-gray-200 text-gray-600 hover:bg-gray-100'}`}>
              {p === '7d' ? '7 Days' : p === '30d' ? '30 Days' : '90 Days'}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatsCard title="Total Revenue" value={`₹${(stats?.revenue || 0).toLocaleString()}`} icon={<DollarSign className="w-5 h-5" />} trend={stats?.revenueTrend} color="emerald" loading={loading} />
        <StatsCard title="Total Orders" value={stats?.totalOrders?.toLocaleString() || '0'} icon={<ShoppingCart className="w-5 h-5" />} trend={stats?.ordersTrend} color="blue" loading={loading} />
        <StatsCard title="Active Vendors" value={stats?.activeVendors?.toLocaleString() || '0'} icon={<TrendingUp className="w-5 h-5" />} color="purple" loading={loading} />
        <StatsCard title="Active Users" value={stats?.activeUsers?.toLocaleString() || '0'} icon={<Users className="w-5 h-5" />} color="amber" loading={loading} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="font-semibold text-gray-800 mb-4">Revenue by Zone</h3>
          <div className="space-y-3">
            {(stats?.revenueByZone || []).map((z: any, i: number) => (
              <div key={i} className="flex items-center gap-3">
                <div className="flex-1">
                  <div className="flex justify-between text-sm mb-1"><span>{z.name}</span><span className="font-mono">₹{z.revenue.toLocaleString()}</span></div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden"><div className="h-full bg-emerald-500 rounded-full" style={{ width: `${z.percentage}%` }} /></div>
                </div>
              </div>
            ))}
            {(!stats?.revenueByZone || stats.revenueByZone.length === 0) && <p className="text-sm text-gray-400">No zone data yet</p>}
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="font-semibold text-gray-800 mb-4">Orders by Store Type</h3>
          <div className="space-y-3">
            {(stats?.ordersByStoreType || []).map((s: any, i: number) => (
              <div key={i} className="flex items-center gap-3">
                <div className="flex-1">
                  <div className="flex justify-between text-sm mb-1"><span className="capitalize">{s.type?.toLowerCase().replace('_', ' ')}</span><span className="font-mono">{s.count} orders</span></div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden"><div className="h-full bg-blue-500 rounded-full" style={{ width: `${s.percentage}%` }} /></div>
                </div>
              </div>
            ))}
            {(!stats?.ordersByStoreType || stats.ordersByStoreType.length === 0) && <p className="text-sm text-gray-400">No store type data yet</p>}
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="font-semibold text-gray-800 mb-4">Top Products</h3>
          <div className="space-y-2">
            {(stats?.topProducts || []).slice(0, 5).map((p: any, i: number) => (
              <div key={i} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-gray-400 w-5">{i + 1}</span>
                  <span className="text-sm">{p.name}</span>
                </div>
                <span className="text-xs font-mono">{p.orders} orders</span>
              </div>
            ))}
            {(!stats?.topProducts || stats.topProducts.length === 0) && <p className="text-sm text-gray-400">No product data yet</p>}
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="font-semibold text-gray-800 mb-4">Top Vendors</h3>
          <div className="space-y-2">
            {(stats?.topVendors || []).slice(0, 5).map((v: any, i: number) => (
              <div key={i} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-gray-400 w-5">{i + 1}</span>
                  <span className="text-sm">{v.storeName}</span>
                </div>
                <span className="text-xs font-mono">₹{v.revenue.toLocaleString()}</span>
              </div>
            ))}
            {(!stats?.topVendors || stats.topVendors.length === 0) && <p className="text-sm text-gray-400">No vendor data yet</p>}
          </div>
        </div>
      </div>
    </div>
  );
}
