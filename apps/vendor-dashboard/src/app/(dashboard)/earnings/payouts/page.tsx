'use client';

import { useState, useEffect } from 'react';
import DataTable from '@/components/DataTable';
import ErrorState from '@/components/ErrorState';
import { vendorApi } from '@/lib/api';

export default function PayoutsPage() {
  const [payouts, setPayouts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const fetchPayouts = () => {
    setLoading(true);
    setError(null);
    const params: Record<string, string> = {};
    if (dateFrom) params.periodStart = dateFrom;
    if (dateTo) params.periodEnd = dateTo;

    vendorApi.getPayouts(params).then((res: any) => {
      // Backend returns array of { id, amount, status, periodStart, periodEnd, paidAt, createdAt, initiatedAt }
      const raw = Array.isArray(res) ? res : [];
      // Derive 'period' label from periodStart/periodEnd
      const mapped = raw.map((p: any) => ({
        ...p,
        period: p.periodStart && p.periodEnd
          ? `${new Date(p.periodStart).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })} - ${new Date(p.periodEnd).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}`
          : new Date(p.createdAt || p.initiatedAt).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' }),
        amount: Number(p.amount || 0),
        initiatedAt: p.initiatedAt || p.createdAt,
      }));
      setPayouts(mapped);
    }).catch((err) => setError(err instanceof Error ? err : new Error(String(err)))).finally(() => setLoading(false));
  };

  useEffect(() => { fetchPayouts(); }, [dateFrom, dateTo]);

  const getStatusStyle = (status: string) => {
    if (status === 'PAID' || status === 'PROCESSED') return 'bg-emerald-100 text-emerald-700';
    if (status === 'PENDING') return 'bg-yellow-100 text-yellow-700';
    if (status === 'FAILED') return 'bg-red-100 text-red-700';
    return 'bg-slate-100 text-slate-600';
  };

  const columns = [
    { key: 'period', label: 'Period' },
    { key: 'amount', label: 'Amount', render: (item: any) => <span className="font-medium">₹{item.amount.toLocaleString()}</span> },
    { key: 'status', label: 'Status', render: (item: any) => (
      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getStatusStyle(item.status)}`}>{item.status}</span>
    )},
    { key: 'initiatedAt', label: 'Initiated', render: (item: any) => <span className="text-sm text-slate-400">{new Date(item.initiatedAt).toLocaleDateString()}</span> },
    { key: 'paidAt', label: 'Paid Date', render: (item: any) => <span className="text-sm text-slate-400">{item.paidAt ? new Date(item.paidAt).toLocaleDateString() : '-'}</span> },
  ];

  return (
    <div className="space-y-6">
      <div><h2 className="text-xl font-bold text-slate-900">Payouts</h2><p className="text-sm text-slate-500">Payout history to your bank account</p></div>
      {/* Date Range Filter */}
      <div className="flex flex-wrap items-center gap-3 bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
        <div className="flex items-center gap-2">
          <label className="text-sm text-slate-600 font-medium">From:</label>
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="px-3 py-1.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
          />
        </div>
        <div className="flex items-center gap-2">
          <label className="text-sm text-slate-600 font-medium">To:</label>
          <input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className="px-3 py-1.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
          />
        </div>
        {(dateFrom || dateTo) && (
          <button
            onClick={() => { setDateFrom(''); setDateTo(''); }}
            className="px-3 py-1.5 text-sm text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
          >
            Clear filter
          </button>
        )}
      </div>
      {error ? (
        <ErrorState message={error.message} onRetry={fetchPayouts} />
      ) : (
        <DataTable columns={columns} data={payouts} loading={loading} emptyMessage="No payouts yet" />
      )}
    </div>
  );
}
