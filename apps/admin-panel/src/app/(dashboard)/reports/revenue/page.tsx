'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, Download, DollarSign, TrendingUp, CreditCard, Percent, ChevronDown } from 'lucide-react';
import StatsCard from '@/components/StatsCard';
import DataTable from '@/components/DataTable';
import { adminApi } from '@/lib/api';

const DATE_RANGES = [
  { value: '7d', label: 'Last 7 Days' },
  { value: '30d', label: 'Last 30 Days' },
  { value: '90d', label: 'Last 90 Days' },
  { value: 'all', label: 'All Time' },
];

export default function RevenueReportsPage() {
  const [vendors, setVendors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState('30d');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [summary, setSummary] = useState({
    totalRevenue: 0,
    totalCommission: 0,
    avgCommissionRate: 0,
    activeVendors: 0,
  });

  useEffect(() => { loadRevenue(); }, [dateRange, page]);

  const loadRevenue = async () => {
    setLoading(true);
    try {
      const res = await adminApi.getCommissionSummary({ period: dateRange, page, limit: 20 });
      const data = res?.data || res || {};
      const recentCommissions = data.recentCommissions || data.commissions || [];

      setVendors(recentCommissions);
      setTotalPages(data.meta?.totalPages || 1);

      const totalRev = recentCommissions.reduce((sum: number, c: any) => sum + Number(c.orderAmount || c.amount || 0), 0);
      const totalComm = recentCommissions.reduce((sum: number, c: any) => sum + Number(c.commissionAmount || c.commission || 0), 0);
      const rates = recentCommissions.filter((c: any) => c.commissionPct > 0).map((c: any) => c.commissionPct);
      const avgRate = rates.length > 0 ? Math.round(rates.reduce((a: number, b: number) => a + b, 0) / rates.length) : 15;

      setSummary({
        totalRevenue: totalRev,
        totalCommission: totalComm,
        avgCommissionRate: avgRate,
        activeVendors: data.activeVendors || recentCommissions.length,
      });
    } catch {
      setVendors([]);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = () => {
    const rows: string[][] = [['Vendor', 'Order Amount', 'Commission', 'Rate', 'Status', 'Date']];
    vendors.forEach((v: any) => {
      rows.push([
        v.vendorName || v.storeName || '-',
        String(v.orderAmount || v.amount || 0),
        String(v.commissionAmount || v.commission || 0),
        `${v.commissionPct || 15}%`,
        v.status || 'PENDING',
        new Date(v.createdAt).toLocaleDateString('en-IN'),
      ]);
    });
    const csv = rows.map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `revenue-report-${dateRange}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const columns = [
    {
      key: 'vendor',
      label: 'Vendor',
      render: (r: any) => (
        <span className="text-sm font-medium text-gray-800">{r.vendorName || r.storeName || '-'}</span>
      ),
    },
    {
      key: 'orderAmount',
      label: 'Order Amount',
      render: (r: any) => (
        <span className="font-mono text-sm text-gray-800">₹{(r.orderAmount || r.amount || 0).toLocaleString('en-IN')}</span>
      ),
    },
    {
      key: 'commission',
      label: 'Commission',
      render: (r: any) => (
        <span className="font-mono text-sm font-bold text-emerald-700">₹{(r.commissionAmount || r.commission || 0).toLocaleString('en-IN')}</span>
      ),
    },
    {
      key: 'rate',
      label: 'Rate',
      render: (r: any) => (
        <span className="text-sm text-gray-600">{r.commissionPct || 15}%</span>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      render: (r: any) => (
        <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${
          r.status === 'PAID' ? 'bg-emerald-100 text-emerald-700' : 'bg-yellow-100 text-yellow-700'
        }`}>
          {r.status || 'PENDING'}
        </span>
      ),
    },
    {
      key: 'createdAt',
      label: 'Date',
      render: (r: any) => (
        <span className="text-sm text-gray-500">
          {new Date(r.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
        </span>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/reports" className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
          <ArrowLeft className="w-5 h-5 text-gray-600" />
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
            <Link href="/reports" className="hover:text-emerald-600 transition-colors">Reports</Link>
            <span>/</span>
            <span className="text-gray-800 font-medium">Revenue</span>
          </div>
          <h2 className="text-xl font-bold text-gray-800">Revenue Reports</h2>
          <p className="text-sm text-gray-500">Track platform revenue, commissions, and vendor earnings</p>
        </div>
        <button
          onClick={handleExport}
          className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm hover:bg-emerald-700 transition-colors"
        >
          <Download className="w-4 h-4" /> Export CSV
        </button>
      </div>

      {/* Date Filter */}
      <div className="flex items-center gap-3">
        <div className="relative">
          <select
            value={dateRange}
            onChange={(e) => { setDateRange(e.target.value); setPage(1); }}
            className="appearance-none pl-3 pr-8 py-2 text-sm border border-gray-200 rounded-lg bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            {DATE_RANGES.map((d) => (
              <option key={d.value} value={d.value}>{d.label}</option>
            ))}
          </select>
          <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          title="Total Revenue"
          value={`₹${summary.totalRevenue.toLocaleString('en-IN')}`}
          icon={<DollarSign className="w-5 h-5" />}
          color="emerald"
        />
        <StatsCard
          title="Total Commission"
          value={`₹${summary.totalCommission.toLocaleString('en-IN')}`}
          icon={<CreditCard className="w-5 h-5" />}
          color="blue"
        />
        <StatsCard
          title="Avg Commission Rate"
          value={`${summary.avgCommissionRate}%`}
          icon={<Percent className="w-5 h-5" />}
          color="purple"
        />
        <StatsCard
          title="Active Vendors"
          value={summary.activeVendors.toLocaleString()}
          icon={<TrendingUp className="w-5 h-5" />}
          color="amber"
        />
      </div>

      {/* Revenue Table */}
      <DataTable
        columns={columns}
        data={vendors}
        loading={loading}
        page={page}
        totalPages={totalPages}
        onPageChange={setPage}
        emptyMessage="No revenue data for this period"
        emptyIcon={<DollarSign className="w-10 h-10" />}
      />
    </div>
  );
}
