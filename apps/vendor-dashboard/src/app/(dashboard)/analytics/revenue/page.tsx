'use client';

import { useState, useEffect } from 'react';
import { vendorApi } from '@/lib/api';

export default function RevenueAnalyticsPage() {
  const [analytics, setAnalytics] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('30d');

  useEffect(() => {
    setLoading(true);
    vendorApi.getAnalytics(period).then((res: any) => {
      const data = res || {};

      // Transform monthlyRevenue → revenueOverTime
      const revenueOverTime = Array.isArray(data.monthlyRevenue)
        ? data.monthlyRevenue.map((m: any) => ({
            date: m.month ? new Date(m.month + '-01').toISOString() : new Date().toISOString(),
            revenue: m.revenue || 0,
          }))
        : data.revenueOverTime || [];

      setAnalytics({
        totalRevenue: data.totalRevenue || 0,
        avgOrderValue: data.avgOrderValue || 0,
        totalOrders: data.totalOrders || 0,
        revenueOverTime,
        payoutHistory: data.recentOrders?.slice(0, 5).map((o: any) => ({
          period: new Date(o.createdAt).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' }),
          amount: o.subtotal || o.totalAmount || 0,
          orders: 1,
        })) || [],
      });
    }).catch(() => {}).finally(() => setLoading(false));
  }, [period]);

  if (loading) {
    return (
      <div className="space-y-6">
        <div><h2 className="text-xl font-bold text-slate-900">Revenue Analytics</h2><p className="text-sm text-slate-500">Revenue breakdown and trends</p></div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => <div key={i} className="h-24 bg-slate-100 rounded-xl animate-pulse" />)}
        </div>
      </div>
    );
  }

  const revenue = analytics?.revenue || analytics?.totalRevenue || 0;
  const avgOrder = analytics?.avgOrderValue || 0;
  const totalOrders = analytics?.totalOrders || 0;
  const revenueOverTime = analytics?.revenueOverTime || [];
  const maxRevenue = revenueOverTime.length > 0 ? Math.max(...revenueOverTime.map((d: any) => d.revenue || 0), 1) : 1;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Revenue Analytics</h2>
          <p className="text-sm text-slate-500">Revenue breakdown and trends</p>
        </div>
        <div className="flex gap-1 bg-slate-100 p-1 rounded-lg">
          {[{ id: '7d', label: '7D' }, { id: '30d', label: '30D' }, { id: '90d', label: '90D' }].map((p) => (
            <button key={p.id} onClick={() => setPeriod(p.id)} className={`px-3 py-1.5 text-xs rounded-md transition-colors ${period === p.id ? 'bg-white text-slate-800 shadow-sm font-medium' : 'text-slate-500 hover:text-slate-700'}`}>{p.label}</button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <p className="text-xs text-slate-500 font-medium">Total Revenue</p>
          <p className="text-2xl font-bold text-slate-900 tabular-nums mt-1">₹{Number(revenue).toLocaleString('en-IN')}</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <p className="text-xs text-slate-500 font-medium">Avg Order Value</p>
          <p className="text-2xl font-bold text-slate-900 tabular-nums mt-1">₹{Number(avgOrder).toLocaleString('en-IN')}</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <p className="text-xs text-slate-500 font-medium">Total Orders</p>
          <p className="text-2xl font-bold text-slate-900 tabular-nums mt-1">{totalOrders}</p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <h3 className="font-semibold text-slate-800 mb-4">Revenue Over Time</h3>
        {revenueOverTime.length > 0 ? (
          <div className="h-64 flex items-end gap-1.5">
            {revenueOverTime.map((d: any, i: number) => {
              const h = maxRevenue > 0 ? ((d.revenue || 0) / maxRevenue) * 100 : 0;
              return (
                <div key={i} className="flex-1 flex flex-col items-center group relative">
                  <div className="absolute -top-8 hidden group-hover:block bg-slate-800 text-white text-xs px-2 py-1 rounded whitespace-nowrap z-10">
                    ₹{(d.revenue || 0).toLocaleString('en-IN')}
                  </div>
                  <div className="w-full bg-emerald-100 rounded-t transition-all duration-300 hover:bg-emerald-200" style={{ height: `${Math.max(h, d.revenue > 0 ? 4 : 0)}%` }} />
                  <span className="text-[10px] text-slate-400 mt-1.5 tabular-nums">{new Date(d.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}</span>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="h-48 flex items-center justify-center text-slate-400 text-sm">No revenue data yet</div>
        )}
      </div>

      {analytics?.payoutHistory?.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <h3 className="font-semibold text-slate-800 mb-4">Recent Payouts</h3>
          <div className="space-y-2">
            {analytics.payoutHistory.slice(0, 5).map((p: any, i: number) => (
              <div key={i} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg text-sm">
                <div>
                  <span className="font-medium text-slate-700">{p.date || p.period}</span>
                  <span className="text-slate-400 ml-2">{p.orders || 0} orders</span>
                </div>
                <span className="font-semibold text-emerald-600 tabular-nums">₹{Number(p.amount || 0).toLocaleString('en-IN')}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
