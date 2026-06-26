'use client';

import { useState, useEffect } from 'react';
import { DollarSign, Clock, CheckCircle, TrendingUp } from 'lucide-react';
import StatsCard from '@/components/StatsCard';
import DataTable from '@/components/DataTable';
import { vendorApi } from '@/lib/api';

export default function EarningsPage() {
  const [earnings, setEarnings] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    vendorApi.getEarnings().then(setEarnings).catch(console.error).finally(() => setLoading(false));
  }, []);

  const columns = [
    { key: 'period', label: 'Period' },
    { key: 'amount', label: 'Amount', render: (item: any) => <span>₹{Number(item.amount).toLocaleString()}</span> },
    { key: 'status', label: 'Status', render: (item: any) => (
      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${item.status === 'PAID' ? 'bg-emerald-100 text-emerald-700' : 'bg-yellow-100 text-yellow-700'}`}>{item.status}</span>
    )},
  ];

  return (
    <div className="space-y-6">
      <div><h2 className="text-xl font-bold text-gray-800">Earnings</h2><p className="text-sm text-gray-500">Track your revenue and payouts</p></div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard icon={DollarSign} label="Total Earnings" value={earnings ? `₹${Number(earnings.totalEarnings || 0).toLocaleString()}` : '₹0'} accent="emerald" />
        <StatsCard icon={TrendingUp} label="This Month" value={earnings ? `₹${Number(earnings.thisMonth || 0).toLocaleString()}` : '₹0'} accent="blue" />
        <StatsCard icon={Clock} label="Pending" value={earnings ? `₹${Number(earnings.pending || 0).toLocaleString()}` : '₹0'} accent="amber" />
        <StatsCard icon={CheckCircle} label="Paid" value={earnings ? `₹${Number(earnings.paid || 0).toLocaleString()}` : '₹0'} accent="emerald" />
      </div>
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="font-semibold text-gray-800 mb-4">Earnings History</h3>
        <DataTable columns={columns} data={earnings?.history || []} emptyMessage="No earnings history yet" />
      </div>
    </div>
  );
}
