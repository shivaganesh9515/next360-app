'use client';

import { useState, useEffect } from 'react';
import { vendorApi } from '@/lib/api';

export default function RevenueAnalyticsPage() {
  const [analytics, setAnalytics] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    vendorApi.getRevenueAnalytics('30d').then(setAnalytics).catch(console.error).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="text-center py-12 text-gray-500">Loading...</div>;

  return (
    <div className="space-y-6">
      <div><h2 className="text-xl font-bold text-gray-800">Revenue Analytics</h2><p className="text-sm text-gray-500">Revenue breakdown and trends</p></div>
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="font-semibold text-gray-800 mb-4">Revenue Breakdown</h3>
        <div className="text-center py-12 text-gray-400 text-sm">Data will appear once you have earnings</div>
      </div>
    </div>
  );
}
