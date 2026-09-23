'use client';

import { useState, useEffect } from 'react';
import { DollarSign, Clock, CheckCircle, TrendingUp } from 'lucide-react';
import StatsCard from '@/components/StatsCard';
import ErrorState from '@/components/ErrorState';
import { vendorApi } from '@/lib/api';

// Platform spec default commission rate (CLAUDE.md) when the backend
// doesn't report one for this vendor.
const SPEC_DEFAULT_COMMISSION_RATE = 15;

export default function EarningsPage() {
  const [earnings, setEarnings] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const loadEarnings = async () => {
    setLoading(true);
    setError(null);
    try {
      // GET /vendors/me/earnings returns { totalEarnings, paid, pending, pendingPayout, ... }
      // after interceptor unwrap. Commission rate comes from vendor profile (commissionPct).
      const [earningsRes, profileRes, txRes] = await Promise.allSettled([
        vendorApi.getEarnings(),
        vendorApi.getMyProfile(),
        vendorApi.getTransactionsWithMeta({ page: 1, limit: 1 }),
      ]);
      const res: any = earningsRes.status === 'fulfilled' ? earningsRes.value : {};
      const profile: any = profileRes.status === 'fulfilled' ? profileRes.value : {};
      const tx: any = txRes.status === 'fulfilled' ? txRes.value : {};
      // getTransactionsWithMeta returns { data, meta } — meta.total has order count
      const totalOrders = tx?.meta?.total ?? (Array.isArray(tx?.data) ? tx.data.length : Array.isArray(tx) ? tx.length : 0);
      setEarnings({
        totalEarnings: res.totalEarnings || 0,
        paid: res.paid ?? res.paidEarnings ?? 0,
        pending: res.pending ?? res.pendingPayout ?? res.pendingEarnings ?? 0,
        commissionRate: res.commissionRate ?? profile?.commissionPct ?? SPEC_DEFAULT_COMMISSION_RATE,
        totalOrders,
      });
      // Only surface error when ALL three failed (partial data is still useful)
      if (earningsRes.status === 'rejected' && profileRes.status === 'rejected' && txRes.status === 'rejected') {
        throw earningsRes.reason;
      }
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadEarnings(); }, []);

  if (error && !earnings) {
    return (
      <div className="space-y-6">
        <div><h2 className="text-xl font-bold text-slate-900">Earnings</h2><p className="text-sm text-slate-500">Track your revenue and payouts</p></div>
        <ErrorState message={error.message} onRetry={loadEarnings} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div><h2 className="text-xl font-bold text-slate-900">Earnings</h2><p className="text-sm text-slate-500">Track your revenue and payouts. Commission is deducted from each order at the rate shown below.</p></div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard icon={DollarSign} label="Total Earnings" value={earnings ? `₹${Number(earnings.totalEarnings || 0).toLocaleString()}` : '₹0'} accent="emerald" />
        <StatsCard icon={TrendingUp} label="Commission Rate" value={earnings ? `${earnings.commissionRate ?? SPEC_DEFAULT_COMMISSION_RATE}%` : `${SPEC_DEFAULT_COMMISSION_RATE}%`} accent="blue" />
        <StatsCard icon={Clock} label="Pending" value={earnings ? `₹${Number(earnings.pending || 0).toLocaleString()}` : '₹0'} accent="amber" />
        <StatsCard icon={CheckCircle} label="Paid" value={earnings ? `₹${Number(earnings.paid || 0).toLocaleString()}` : '₹0'} accent="emerald" />
      </div>
      {earnings && (
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
          <h3 className="font-semibold text-slate-900 mb-2">Summary</h3>
          <p className="text-sm text-slate-500 mb-4">Breakdown of your earnings from {earnings.totalOrders || 0} completed orders.</p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-slate-50 rounded-lg p-4 text-center">
              <p className="text-xs text-slate-500 font-medium">Total Orders</p>
              <p className="text-xl font-bold text-slate-900 mt-1">{earnings.totalOrders || 0}</p>
            </div>
            <div className="bg-slate-50 rounded-lg p-4 text-center">
              <p className="text-xs text-slate-500 font-medium">Avg Earning per Order</p>
              <p className="text-xl font-bold text-slate-900 mt-1">₹{earnings.totalOrders > 0 ? Number(earnings.totalEarnings / earnings.totalOrders).toLocaleString(undefined, { maximumFractionDigits: 0 }) : '0'}</p>
            </div>
            <div className="bg-slate-50 rounded-lg p-4 text-center">
              <p className="text-xs text-slate-500 font-medium">Net Payout</p>
              <p className="text-xl font-bold text-emerald-600 mt-1">₹{Number(earnings.paid || 0).toLocaleString()}</p>
            </div>
          </div>
        </div>
      )}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
        <h3 className="font-semibold text-slate-900 mb-2">Payout Details</h3>
        <p className="text-sm text-slate-500">Payouts are processed periodically. Check the <a href="/earnings/payouts" className="text-emerald-600 hover:underline font-medium">Payouts</a> page for your payout history and the <a href="/earnings/transactions" className="text-emerald-600 hover:underline font-medium">Transactions</a> page for your order-level transaction log.</p>
      </div>
    </div>
  );
}
