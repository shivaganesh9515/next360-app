'use client';

import { useState, useEffect } from 'react';
import { vendorApi } from '@/lib/api';

export default function SalesAnalyticsPage() {
  const [analytics, setAnalytics] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('30d');

  useEffect(() => {
    setLoading(true);
    vendorApi.getSalesAnalytics(period).then(setAnalytics).catch(() => {}).finally(() => setLoading(false));
  }, [period]);

  if (loading) {
    return (
      <div className="space-y-6">
        <div><h2 className="text-xl font-bold text-slate-900">Sales Analytics</h2><p className="text-sm text-slate-500">Detailed sales performance</p></div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {[1, 2].map((i) => <div key={i} className="h-48 bg-slate-100 rounded-xl animate-pulse" />)}
        </div>
      </div>
    );
  }

  const salesByCategory = analytics?.salesByCategory || analytics?.categories || [];
  const topProducts = analytics?.topProducts || [];
  const maxCategorySales = salesByCategory.length > 0 ? Math.max(...salesByCategory.map((c: any) => c.sales || c.revenue || 0), 1) : 1;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Sales Analytics</h2>
          <p className="text-sm text-slate-500">Detailed sales performance</p>
        </div>
        <div className="flex gap-1 bg-slate-100 p-1 rounded-lg">
          {[{ id: '7d', label: '7D' }, { id: '30d', label: '30D' }, { id: '90d', label: '90D' }].map((p) => (
            <button key={p.id} onClick={() => setPeriod(p.id)} className={`px-3 py-1.5 text-xs rounded-md transition-colors ${period === p.id ? 'bg-white text-slate-800 shadow-sm font-medium' : 'text-slate-500 hover:text-slate-700'}`}>{p.label}</button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Sales by Category */}
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <h3 className="font-semibold text-slate-800 mb-4">Sales by Category</h3>
          {salesByCategory.length > 0 ? (
            <div className="space-y-4">
              {salesByCategory.map((cat: any, i: number) => {
                const val = cat.sales || cat.revenue || 0;
                const pct = maxCategorySales > 0 ? (val / maxCategorySales) * 100 : 0;
                return (
                  <div key={i}>
                    <div className="flex justify-between mb-1">
                      <span className="text-sm text-slate-700">{cat.name || cat.category || `Category ${i + 1}`}</span>
                      <span className="text-sm text-slate-500 tabular-nums">{cat.count || cat.orders || 0} orders · ₹{Number(val).toLocaleString('en-IN')}</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2.5">
                      <div className="bg-emerald-500 h-2.5 rounded-full transition-all duration-500" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="h-32 flex items-center justify-center text-slate-400 text-sm">No category data yet</div>
          )}
        </div>

        {/* Top Products */}
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <h3 className="font-semibold text-slate-800 mb-4">Top Products</h3>
          {topProducts.length > 0 ? (
            <div className="space-y-3">
              {topProducts.slice(0, 10).map((p: any, i: number) => (
                <div key={i} className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-50 transition-colors">
                  <span className="text-xs font-bold text-slate-400 w-5 tabular-nums">{i + 1}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-700 truncate">{p.name}</p>
                    <p className="text-xs text-slate-400">{p.sales || p.quantity || 0} sold</p>
                  </div>
                  <span className="text-sm font-semibold text-emerald-600 tabular-nums shrink-0">₹{Number(p.revenue || 0).toLocaleString('en-IN')}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="h-32 flex items-center justify-center text-slate-400 text-sm">No sales data yet</div>
          )}
        </div>
      </div>

      {/* Sales Over Time */}
      {analytics?.salesOverTime?.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <h3 className="font-semibold text-slate-800 mb-4">Sales Over Time</h3>
          <div className="h-48 flex items-end gap-1.5">
            {analytics.salesOverTime.map((d: any, i: number) => {
              const max = Math.max(...analytics.salesOverTime.map((x: any) => x.orders || x.sales || 0), 1);
              const h = ((d.orders || d.sales || 0) / max) * 100;
              return (
                <div key={i} className="flex-1 flex flex-col items-center group relative">
                  <div className="absolute -top-8 hidden group-hover:block bg-slate-800 text-white text-xs px-2 py-1 rounded whitespace-nowrap z-10">
                    {d.orders || d.sales || 0} orders
                  </div>
                  <div className="w-full bg-blue-100 rounded-t transition-all duration-300 hover:bg-blue-200" style={{ height: `${Math.max(h, d.orders > 0 ? 4 : 0)}%` }} />
                  <span className="text-[10px] text-slate-400 mt-1.5 tabular-nums">{new Date(d.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
