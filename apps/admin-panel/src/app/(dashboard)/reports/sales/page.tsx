'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, Download, ShoppingCart, DollarSign, TrendingUp, Package, ChevronDown } from 'lucide-react';
import StatsCard from '@/components/StatsCard';
import DataTable from '@/components/DataTable';
import StatusBadge from '@/components/StatusBadge';
import { adminApi } from '@/lib/api';

const DATE_RANGES = [
  { value: '7d', label: 'Last 7 Days' },
  { value: '30d', label: 'Last 30 Days' },
  { value: '90d', label: 'Last 90 Days' },
  { value: 'all', label: 'All Time' },
];

const STATUS_OPTIONS = [
  { value: '', label: 'All Statuses' },
  { value: 'DELIVERED', label: 'Delivered' },
  { value: 'CONFIRMED', label: 'Confirmed' },
  { value: 'CANCELLED', label: 'Cancelled' },
  { value: 'REFUNDED', label: 'Refunded' },
];

export default function SalesReportsPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState('30d');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [summary, setSummary] = useState({
    totalOrders: 0,
    totalRevenue: 0,
    avgOrderValue: 0,
    deliveredOrders: 0,
  });

  useEffect(() => { loadSales(); }, [dateRange, statusFilter, page]);

  const loadSales = async () => {
    setLoading(true);
    try {
      const params: any = { page, limit: 20 };
      if (statusFilter) params.status = statusFilter;
      if (dateRange !== 'all') params.period = dateRange;

      const res = await adminApi.getOrders(params);
      const orderList = Array.isArray(res) ? res : [];
      setOrders(orderList);
      setTotalPages(res?.meta?.totalPages || 1);

      const delivered = orderList.filter((o: any) => o.status === 'DELIVERED');
      const totalRev = orderList.reduce((sum: number, o: any) => sum + Number(o.totalAmount || 0), 0);
      setSummary({
        totalOrders: orderList.length,
        totalRevenue: totalRev,
        avgOrderValue: orderList.length > 0 ? Math.round(totalRev / orderList.length) : 0,
        deliveredOrders: delivered.length,
      });
    } catch {
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = () => {
    const rows: string[][] = [['Order ID', 'Customer', 'Status', 'Amount', 'Date']];
    orders.forEach((o: any) => {
      rows.push([
        o.orderNo || o.id?.slice(0, 8) || '',
        o.customerName || o.user?.name || '',
        o.status || '',
        String(o.totalAmount || 0),
        new Date(o.createdAt).toLocaleDateString('en-IN'),
      ]);
    });
    const csv = rows.map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sales-report-${dateRange}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const columns = [
    {
      key: 'orderNo',
      label: 'Order',
      render: (r: any) => (
        <span className="font-mono text-xs text-gray-800">{r.orderNo || r.id?.slice(0, 8)}</span>
      ),
    },
    {
      key: 'customer',
      label: 'Customer',
      render: (r: any) => (
        <span className="text-sm text-gray-700">{r.customerName || r.user?.name || '-'}</span>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      render: (r: any) => <StatusBadge status={r.status} />,
    },
    {
      key: 'items',
      label: 'Items',
      render: (r: any) => (
        <span className="text-sm text-gray-600">{r.items?.length || r.totalItems || '-'}</span>
      ),
    },
    {
      key: 'totalAmount',
      label: 'Amount',
      render: (r: any) => (
        <span className="font-mono font-bold text-gray-800">₹{(r.totalAmount || 0).toLocaleString('en-IN')}</span>
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
            <span className="text-gray-800 font-medium">Sales</span>
          </div>
          <h2 className="text-xl font-bold text-gray-800">Sales Reports</h2>
          <p className="text-sm text-gray-500">Track order volume, revenue, and sales performance</p>
        </div>
        <button
          onClick={handleExport}
          className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm hover:bg-emerald-700 transition-colors"
        >
          <Download className="w-4 h-4" /> Export CSV
        </button>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
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
        <div className="relative">
          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
            className="appearance-none pl-3 pr-8 py-2 text-sm border border-gray-200 rounded-lg bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            {STATUS_OPTIONS.map((s) => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </select>
          <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          title="Total Orders"
          value={summary.totalOrders.toLocaleString()}
          icon={<ShoppingCart className="w-5 h-5" />}
          color="blue"
        />
        <StatsCard
          title="Total Revenue"
          value={`₹${summary.totalRevenue.toLocaleString('en-IN')}`}
          icon={<DollarSign className="w-5 h-5" />}
          color="emerald"
        />
        <StatsCard
          title="Avg Order Value"
          value={`₹${summary.avgOrderValue.toLocaleString('en-IN')}`}
          icon={<TrendingUp className="w-5 h-5" />}
          color="purple"
        />
        <StatsCard
          title="Delivered"
          value={summary.deliveredOrders.toLocaleString()}
          icon={<Package className="w-5 h-5" />}
          color="amber"
        />
      </div>

      {/* Orders Table */}
      <DataTable
        columns={columns}
        data={orders}
        loading={loading}
        page={page}
        totalPages={totalPages}
        onPageChange={setPage}
        emptyMessage="No sales data for this period"
        emptyIcon={<ShoppingCart className="w-10 h-10" />}
      />
    </div>
  );
}
