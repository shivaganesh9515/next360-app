'use client';

import { useState, useEffect } from 'react';
import { vendorApi } from '@/lib/api';

export default function SalesAnalyticsPage() {
  const [analytics, setAnalytics] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    vendorApi.getSalesAnalytics('30d').then(setAnalytics).catch(console.error).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="text-center py-12 text-gray-500">Loading...</div>;

  return (
    <div className="space-y-6">
      <div><h2 className="text-xl font-bold text-gray-800">Sales Analytics</h2><p className="text-sm text-gray-500">Detailed sales performance</p></div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="font-semibold text-gray-800 mb-4">Sales by Category</h3>
          <div className="text-center py-12 text-gray-400 text-sm">Data will appear once you have sales</div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="font-semibold text-gray-800 mb-4">Top Products</h3>
          {analytics?.topProducts?.length > 0 ? (
            <div className="space-y-3">
              {analytics.topProducts.map((p: any, i: number) => (
                <div key={i} className="flex items-center gap-3">
                  <span className="text-sm font-medium text-gray-400 w-6">{i + 1}.</span>
                  <span className="flex-1 text-sm text-gray-700">{p.name}</span>
                  <span className="text-sm text-gray-500">{p.sales} sold</span>
                  <span className="text-sm font-medium text-emerald-600">₹{Number(p.revenue).toLocaleString()}</span>
                </div>
              ))}
            </div>
          ) : <div className="text-center py-8 text-gray-400 text-sm">No sales data yet</div>}
        </div>
      </div>
    </div>
  );
}
