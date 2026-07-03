'use client';

import { useState, useEffect } from 'react';
import { FileText, Download, TrendingUp, DollarSign, ShoppingCart } from 'lucide-react';
import StatsCard from '@/components/StatsCard';
import { adminApi } from '@/lib/api';

export default function ReportsPage() {
  const [report, setReport] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [reportType, setReportType] = useState('overview');
  const [period, setPeriod] = useState('30d');

  useEffect(() => { loadReport(); }, [reportType, period]);

  const loadReport = async () => {
    setLoading(true);
    try { const res = await adminApi.getReports({ type: reportType, period }); setReport(res); }
    catch { setReport(null); } finally { setLoading(false); }
  };

  const reportTypes = [
    { id: 'overview', label: 'Overview' },
    { id: 'revenue', label: 'Revenue' },
    { id: 'vendors', label: 'Vendors' },
    { id: 'orders', label: 'Orders' },
    { id: 'delivery', label: 'Delivery' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h2 className="text-xl font-bold text-gray-800">Reports</h2><p className="text-sm text-gray-500">Detailed business analytics and reports</p></div>
        <button className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm hover:bg-emerald-700"><Download className="w-4 h-4" /> Export CSV</button>
      </div>

      <div className="flex gap-3 flex-wrap">
        {reportTypes.map(rt => (
          <button key={rt.id} onClick={() => setReportType(rt.id)} className={`px-4 py-2 text-sm rounded-lg border transition-colors ${reportType === rt.id ? 'bg-emerald-600 text-white border-emerald-600' : 'border-gray-200 text-gray-600 hover:bg-gray-100'}`}>{rt.label}</button>
        ))}
      </div>

      <div className="flex gap-3">
        {['7d', '30d', '90d'].map(p => (
          <button key={p} onClick={() => setPeriod(p)} className={`px-3 py-1.5 text-xs rounded-lg border transition-colors ${period === p ? 'bg-gray-800 text-white border-gray-800' : 'border-gray-200 text-gray-600 hover:bg-gray-100'}`}>
            {p === '7d' ? '7D' : p === '30d' ? '30D' : '90D'}
          </button>
        ))}
      </div>

      {report && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <StatsCard title="Revenue" value={`₹${(report.revenue || 0).toLocaleString()}`} icon={<DollarSign className="w-5 h-5" />} color="emerald" />
            <StatsCard title="Orders" value={(report.totalOrders || 0).toLocaleString()} icon={<ShoppingCart className="w-5 h-5" />} color="blue" />
            <StatsCard title="Avg Order" value={`₹${(report.avgOrderValue || 0).toLocaleString()}`} icon={<TrendingUp className="w-5 h-5" />} color="purple" />
            <StatsCard title="Commission" value={`₹${(report.totalCommission || 0).toLocaleString()}`} icon={<DollarSign className="w-5 h-5" />} color="amber" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h3 className="font-semibold text-gray-800 mb-4">Daily Breakdown</h3>
              <div className="space-y-2 max-h-80 overflow-y-auto">
                {(report.dailyBreakdown || []).map((d: any, i: number) => (
                  <div key={i} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg text-sm">
                    <span className="text-gray-600">{d.date}</span>
                    <div className="flex gap-4"><span className="font-mono">{d.orders} orders</span><span className="font-mono">₹{d.revenue.toLocaleString()}</span></div>
                  </div>
                ))}
                {(!report.dailyBreakdown || report.dailyBreakdown.length === 0) && <p className="text-sm text-gray-400">No data for this period</p>}
              </div>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h3 className="font-semibold text-gray-800 mb-4">Top Vendors</h3>
              <div className="space-y-2 max-h-80 overflow-y-auto">
                {(report.topVendors || []).slice(0, 10).map((v: any, i: number) => (
                  <div key={i} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg text-sm">
                    <div className="flex items-center gap-2"><span className="text-xs font-bold text-gray-400 w-5">{i + 1}</span><span>{v.storeName}</span></div>
                    <span className="font-mono">₹{v.revenue.toLocaleString()}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
