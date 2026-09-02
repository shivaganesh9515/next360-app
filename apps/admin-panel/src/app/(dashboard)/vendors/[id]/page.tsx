'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft, Store, Save, Loader2, DollarSign, ShoppingCart,
  Package, TrendingUp, FileText, CheckCircle, XCircle,
  Clock, AlertTriangle, User, Mail, Phone, MapPin,
  Shield, CreditCard, Calendar, BarChart3, ChevronRight,
} from 'lucide-react';
import StatusBadge from '@/components/StatusBadge';
import { adminApi } from '@/lib/api';

function formatCurrency(amount: number): string {
  return `₹${amount.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

function getTimeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
}

export default function VendorDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [commissionRate, setCommissionRate] = useState(10);
  const [deliveryForm, setDeliveryForm] = useState({ deliveryTimeMin: 10, deliveryTimeMax: 20, deliveryLabel: '' });
  const [saving, setSaving] = useState(false);
  const [deliverySaving, setDeliverySaving] = useState(false);
  const [confirmAction, setConfirmAction] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);

  useEffect(() => { loadDetail(); }, [params.id]);

  const loadDetail = async () => {
    setLoading(true);
    try {
      const res = await adminApi.getVendorDetail(params.id as string);
      const d = res?.data || res;
      setData(d);
      setCommissionRate(d?.vendor?.commissionPct ?? 10);
      setDeliveryForm({
        deliveryTimeMin: d?.vendor?.deliveryTimeMin ?? 10,
        deliveryTimeMax: d?.vendor?.deliveryTimeMax ?? 20,
        deliveryLabel: d?.vendor?.deliveryLabel ?? '',
      });
    } catch {
      setData(null);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (status: string) => {
    setProcessing(true);
    try {
      await adminApi.updateVendorStatus(params.id as string, status);
      await loadDetail();
      setConfirmAction(null);
    } catch (err: any) {
      alert(err.message || 'Failed to update vendor');
    } finally {
      setProcessing(false);
    }
  };

  const handleCommissionSave = async () => {
    setSaving(true);
    try {
      await adminApi.updateVendorCommission(params.id as string, commissionRate);
      await loadDetail();
    } catch (err: any) {
      alert(err.message || 'Failed to update commission');
    } finally {
      setSaving(false);
    }
  };

  const handleDeliverySave = async () => {
    if (deliveryForm.deliveryTimeMin >= deliveryForm.deliveryTimeMax) {
      alert('Minimum time must be less than maximum time');
      return;
    }
    setDeliverySaving(true);
    try {
      await adminApi.updateVendor(params.id as string, deliveryForm);
      await loadDetail();
    } catch (err: any) {
      alert(err.message || 'Failed to update delivery settings');
    } finally {
      setDeliverySaving(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-32 bg-slate-100 rounded-xl animate-pulse" />
        ))}
      </div>
    );
  }

  if (!data) {
    return (
      <div className="text-center py-12">
        <Store className="w-12 h-12 text-slate-300 mx-auto mb-4" />
        <p className="text-slate-500">Vendor not found</p>
        <button onClick={() => router.back()} className="mt-4 text-emerald-600 text-sm hover:underline">Go back</button>
      </div>
    );
  }

  const { vendor, owner, kyc, performance, recentOrders, monthlyRevenue } = data;

  return (
    <div className="space-y-6">

      {/* ── Header ─────────────────────────────────────────────── */}
      <div className="flex items-center gap-4">
        <button onClick={() => router.back()} className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
          <ArrowLeft className="w-5 h-5 text-slate-600" />
        </button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-bold text-slate-900">{vendor.storeName}</h2>
            <StatusBadge status={vendor.status} />
            <StatusBadge status={vendor.storeType} />
          </div>
          <p className="text-sm text-slate-500 mt-0.5">
            {vendor.description || 'No description'}
          </p>
        </div>
        <button
          onClick={() => router.push(`/vendors`)}
          className="text-sm text-emerald-600 hover:text-emerald-700 font-medium"
        >
          All Vendors <ChevronRight className="w-3 h-3 inline" />
        </button>
      </div>

      {/* ── Performance Metrics ────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <p className="text-xs text-slate-500 font-medium mb-1">Total Orders</p>
          <p className="text-xl font-bold text-slate-900 tabular-nums">{performance.totalOrders}</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <p className="text-xs text-slate-500 font-medium mb-1">Total Revenue</p>
          <p className="text-xl font-bold text-emerald-700 tabular-nums">{formatCurrency(performance.totalRevenue)}</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <p className="text-xs text-slate-500 font-medium mb-1">Avg Order</p>
          <p className="text-xl font-bold text-slate-900 tabular-nums">{formatCurrency(performance.avgOrderValue)}</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <p className="text-xs text-slate-500 font-medium mb-1">Products</p>
          <p className="text-xl font-bold text-slate-900 tabular-nums">{performance.totalProducts}</p>
          <div className="flex gap-1 mt-1">
            <span className="text-[10px] px-1.5 py-0.5 bg-emerald-100 text-emerald-700 rounded">
              {performance.productBreakdown?.approved || 0} approved
            </span>
            <span className="text-[10px] px-1.5 py-0.5 bg-amber-100 text-amber-700 rounded">
              {performance.productBreakdown?.pending || 0} pending
            </span>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <p className="text-xs text-slate-500 font-medium mb-1">Net Revenue</p>
          <p className="text-lg font-bold text-slate-900 tabular-nums">{formatCurrency(performance.netRevenue)}</p>
          <p className="text-[10px] text-slate-400 mt-0.5">
            {formatCurrency(performance.totalCommissions)} commission
          </p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <p className="text-xs text-slate-500 font-medium mb-1">Payouts</p>
          <p className="text-lg font-bold text-slate-900 tabular-nums">{formatCurrency(performance.paidPayouts)}</p>
          <p className="text-[10px] text-amber-600 mt-0.5">
            {formatCurrency(Math.max(0, performance.pendingPayouts))} pending
          </p>
        </div>
      </div>

      {/* ── Two-column grid ────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* ── Store Information ──────────────────────────────────── */}
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <h3 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
            <Store className="w-4 h-4 text-emerald-600" />
            Store Information
          </h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-sm text-slate-500">Store Name</span>
              <span className="text-sm font-medium text-slate-800">{vendor.storeName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-slate-500">Slug</span>
              <span className="text-sm text-slate-600 font-mono">{vendor.storeSlug}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-slate-500">Store Type</span>
              <StatusBadge status={vendor.storeType} />
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-slate-500">Status</span>
              <StatusBadge status={vendor.status} />
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-slate-500">Zone</span>
              <span className="text-sm text-slate-600">{vendor.zone?.name || vendor.zone?.city || 'Unassigned'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-slate-500">Razorpay Account</span>
              <span className={`text-sm font-mono ${vendor.razorpayAccountId ? 'text-slate-600' : 'text-amber-500'}`}>
                {vendor.razorpayAccountId ? vendor.razorpayAccountId.slice(0, 12) + '...' : 'Not linked'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-slate-500">Joined</span>
              <span className="text-sm text-slate-600">{new Date(vendor.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })}</span>
            </div>
          </div>
        </div>

        {/* ── Owner Information ──────────────────────────────────── */}
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <h3 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
            <User className="w-4 h-4 text-blue-600" />
            Owner Information
          </h3>
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center shrink-0">
                <User className="w-5 h-5 text-slate-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-800">{owner?.name || '-'}</p>
                <p className="text-xs text-slate-400">Owner</p>
              </div>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-slate-500 flex items-center gap-1.5"><Mail className="w-3.5 h-3.5" /> Email</span>
              <span className="text-sm text-slate-600">{owner?.email || '-'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-slate-500 flex items-center gap-1.5"><Phone className="w-3.5 h-3.5" /> Phone</span>
              <span className="text-sm text-slate-600">{owner?.phone || '-'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-slate-500 flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5" /> Registered</span>
              <span className="text-sm text-slate-600">{owner?.createdAt ? new Date(owner.createdAt).toLocaleDateString('en-IN') : '-'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-slate-500">Account Active</span>
              <span className={`text-sm font-medium ${owner?.isActive !== false ? 'text-emerald-600' : 'text-red-500'}`}>
                {owner?.isActive !== false ? 'Yes' : 'No'}
              </span>
            </div>
          </div>
        </div>

        {/* ── KYC / Certificates ──────────────────────────────────── */}
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <h3 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
            <Shield className="w-4 h-4 text-purple-600" />
            KYC &amp; Certificates
          </h3>
          {kyc ? (
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-slate-500">Document Type</span>
                <span className="text-sm font-medium text-slate-800">{kyc.documentType}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-slate-500">Document Number</span>
                <span className="text-sm text-slate-600 font-mono">{kyc.documentNumber || '-'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-slate-500">Status</span>
                <StatusBadge status={kyc.status} />
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-slate-500">Submitted</span>
                <span className="text-sm text-slate-600">
                  {kyc.submittedAt ? new Date(kyc.submittedAt).toLocaleDateString('en-IN') : '-'}
                </span>
              </div>
              {kyc.documentUrl && (
                <div className="pt-2">
                  <a
                    href={kyc.documentUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-sm text-emerald-600 hover:text-emerald-700 font-medium"
                  >
                    <FileText className="w-4 h-4" />
                    View Document
                  </a>
                </div>
              )}
              {kyc.rejectionReason && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <p className="text-xs font-medium text-red-700 mb-1">Rejection Reason</p>
                  <p className="text-xs text-red-600">{kyc.rejectionReason}</p>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-6 text-slate-400">
              <FileText className="w-8 h-8 mx-auto mb-2 opacity-40" />
              <p className="text-xs">No KYC documents submitted</p>
            </div>
          )}
        </div>

        {/* ── Commission & Actions ──────────────────────────────────── */}
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <h3 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
            <CreditCard className="w-4 h-4 text-amber-600" />
            Commission &amp; Actions
          </h3>

          {/* Commission Rate */}
          <div className="mb-5">
            <label className="text-sm text-slate-500">Commission Rate (%)</label>
            <div className="flex items-end gap-3 mt-1">
              <input
                type="number"
                value={commissionRate}
                onChange={(e) => setCommissionRate(Number(e.target.value))}
                min={0}
                max={50}
                step={0.5}
                className="w-28 px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 tabular-nums"
              />
              <button
                onClick={handleCommissionSave}
                disabled={saving}
                className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm hover:bg-emerald-700 disabled:opacity-50 flex items-center gap-2 transition-colors"
              >
                <Save className="w-4 h-4" />
                {saving ? 'Saving...' : 'Save'}
              </button>
            </div>
            <p className="text-xs text-slate-400 mt-1.5">
              Platform commission on each order. Current: {vendor.commissionPct}% → {commissionRate}%
            </p>
          </div>

          <hr className="border-slate-100 mb-4" />

          {/* Delivery Time Settings */}
          <div className="mb-5">
            <label className="text-sm text-slate-500 font-medium flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5" /> Delivery Time Estimates
            </label>
            <div className="grid grid-cols-2 gap-3 mt-2">
              <div>
                <label className="text-xs text-slate-400">Min (mins)</label>
                <input
                  type="number"
                  min={5}
                  max={120}
                  value={deliveryForm.deliveryTimeMin}
                  onChange={(e) => setDeliveryForm({ ...deliveryForm, deliveryTimeMin: Number(e.target.value) })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 tabular-nums"
                />
              </div>
              <div>
                <label className="text-xs text-slate-400">Max (mins)</label>
                <input
                  type="number"
                  min={10}
                  max={180}
                  value={deliveryForm.deliveryTimeMax}
                  onChange={(e) => setDeliveryForm({ ...deliveryForm, deliveryTimeMax: Number(e.target.value) })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 tabular-nums"
                />
              </div>
            </div>
            <div className="mt-2">
              <label className="text-xs text-slate-400">Label (optional)</label>
              <input
                type="text"
                value={deliveryForm.deliveryLabel}
                onChange={(e) => setDeliveryForm({ ...deliveryForm, deliveryLabel: e.target.value })}
                placeholder="e.g. Farm Direct, Handcrafted"
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <div className="flex items-center gap-3 mt-2">
              <span className="text-xs text-slate-400">Preview:</span>
              <span className="text-xs font-medium text-slate-600">
                {deliveryForm.deliveryTimeMin}-{deliveryForm.deliveryTimeMax} min
                {deliveryForm.deliveryLabel ? ` • ${deliveryForm.deliveryLabel}` : ''}
              </span>
              <div className="flex-1" />
              <button
                onClick={handleDeliverySave}
                disabled={deliverySaving}
                className="px-3 py-1.5 bg-emerald-600 text-white rounded-lg text-xs hover:bg-emerald-700 disabled:opacity-50 flex items-center gap-1.5 transition-colors"
              >
                <Save className="w-3 h-3" />
                {deliverySaving ? 'Saving...' : 'Save'}
              </button>
            </div>
            <p className="text-[10px] text-slate-400 mt-1.5">
              Shown on product cards and storefront. Current: {vendor.deliveryTimeMin}-{vendor.deliveryTimeMax} min{vendor.deliveryLabel ? ` • ${vendor.deliveryLabel}` : ''}
            </p>
          </div>

          <hr className="border-slate-100 mb-4" />

          {/* Admin Actions */}
          <div className="space-y-2.5">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Admin Actions</p>

            {vendor.status === 'PENDING' && (
              <div className="flex gap-2">
                <button
                  onClick={() => handleStatusChange('APPROVED')}
                  disabled={processing}
                  className="flex-1 px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm hover:bg-emerald-700 disabled:opacity-60 flex items-center justify-center gap-2 transition-colors"
                >
                  {processing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                  {processing ? 'Approving...' : 'Approve'}
                </button>
                <button
                  onClick={() => setConfirmAction('REJECTED')}
                  disabled={processing}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700 disabled:opacity-60 flex items-center justify-center gap-2 transition-colors"
                >
                  <XCircle className="w-4 h-4" />
                  Reject
                </button>
              </div>
            )}

            {vendor.status === 'APPROVED' && (
              <button
                onClick={() => setConfirmAction('SUSPENDED')}
                disabled={processing}
                className="w-full px-4 py-2 bg-orange-600 text-white rounded-lg text-sm hover:bg-orange-700 disabled:opacity-60 flex items-center justify-center gap-2 transition-colors"
              >
                <AlertTriangle className="w-4 h-4" />
                {processing ? 'Processing...' : 'Suspend Vendor'}
              </button>
            )}

            {vendor.status === 'SUSPENDED' && (
              <button
                onClick={() => handleStatusChange('APPROVED')}
                disabled={processing}
                className="w-full px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm hover:bg-emerald-700 disabled:opacity-60 flex items-center justify-center gap-2 transition-colors"
              >
                {processing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                {processing ? 'Reactivating...' : 'Reactivate Vendor'}
              </button>
            )}

            {vendor.status === 'REJECTED' && (
              <button
                onClick={() => handleStatusChange('APPROVED')}
                disabled={processing}
                className="w-full px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm hover:bg-emerald-700 disabled:opacity-60 flex items-center justify-center gap-2 transition-colors"
              >
                {processing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                {processing ? 'Approving...' : 'Approve (Override Rejection)'}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ── Recent Orders ──────────────────────────────────────── */}
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-slate-900 flex items-center gap-2">
            <ShoppingCart className="w-4 h-4 text-blue-600" />
            Recent Orders
          </h3>
          <button
            onClick={() => router.push(`/orders?vendorId=${params.id}`)}
            className="text-xs text-emerald-600 hover:text-emerald-700 font-medium"
          >
            View all <ChevronRight className="w-3 h-3 inline" />
          </button>
        </div>
        {recentOrders && recentOrders.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-xs text-slate-500 border-b border-slate-100">
                  <th className="text-left py-2 font-medium">Order</th>
                  <th className="text-left py-2 font-medium">Customer</th>
                  <th className="text-left py-2 font-medium">Status</th>
                  <th className="text-right py-2 font-medium">Items</th>
                  <th className="text-right py-2 font-medium">Amount</th>
                  <th className="text-right py-2 font-medium">When</th>
                </tr>
              </thead>
              <tbody>
                {recentOrders.map((g: any) => (
                  <tr
                    key={g.id}
                    className="border-b border-slate-50 last:border-0 hover:bg-slate-50/50 transition-colors cursor-pointer"
                    onClick={() => router.push(`/orders/${g.orderId}`)}
                  >
                    <td className="py-2.5 font-medium text-slate-800 font-mono">#{g.orderNo?.slice(0, 12) || g.orderId?.slice(0, 8)}</td>
                    <td className="py-2.5 text-slate-600">{g.customerName}</td>
                    <td className="py-2.5"><StatusBadge status={g.status} /></td>
                    <td className="py-2.5 text-right text-slate-500">{g.items?.length || 0}</td>
                    <td className="py-2.5 text-right font-semibold text-slate-800 tabular-nums">{formatCurrency(g.totalAmount)}</td>
                    <td className="py-2.5 text-right text-slate-400 tabular-nums text-xs">{getTimeAgo(g.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-8 text-slate-400">
            <ShoppingCart className="w-8 h-8 mx-auto mb-2 opacity-40" />
            <p className="text-xs">No orders yet</p>
          </div>
        )}
      </div>

      {/* ── Monthly Revenue ──────────────────────────────────── */}
      {monthlyRevenue && monthlyRevenue.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <h3 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-emerald-600" />
            Monthly Revenue (Last 6 Months)
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
            {monthlyRevenue.map((m: any) => {
              const maxRevenue = Math.max(...monthlyRevenue.map((x: any) => x.revenue), 1);
              const barHeight = (m.revenue / maxRevenue) * 100;
              return (
                <div key={m.month} className="text-center">
                  <p className="text-xs text-slate-400 mb-2">{m.month}</p>
                  <div className="h-20 flex items-end justify-center">
                    <div
                      className="w-8 bg-emerald-500 rounded-t-md transition-all duration-500"
                      style={{ height: `${Math.max(barHeight, 4)}%` }}
                      title={`${formatCurrency(m.revenue)}`}
                    />
                  </div>
                  <p className="text-xs font-semibold text-slate-700 mt-1 tabular-nums">{formatCurrency(m.revenue)}</p>
                  <p className="text-[10px] text-slate-400">{m.orders} orders</p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Confirmation Dialog ────────────────────────────────── */}
      {confirmAction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-xl p-6 max-w-sm w-full mx-4 shadow-xl">
            <h3 className="text-lg font-semibold text-slate-900 mb-2">
              {confirmAction === 'SUSPENDED' ? 'Suspend Vendor' : 'Reject Vendor'}
            </h3>
            <p className="text-sm text-slate-600 mb-6">
              {confirmAction === 'SUSPENDED'
                ? `Are you sure you want to suspend "${vendor.storeName}"? Their products will no longer be visible.`
                : `Are you sure you want to reject "${vendor.storeName}"? They will not be able to list products.`}
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setConfirmAction(null)}
                className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => handleStatusChange(confirmAction)}
                disabled={processing}
                className={`px-4 py-2 text-sm text-white rounded-lg flex items-center gap-2 disabled:opacity-60 transition-colors ${
                  confirmAction === 'SUSPENDED' ? 'bg-orange-600 hover:bg-orange-700' : 'bg-red-600 hover:bg-red-700'
                }`}
              >
                {processing && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                {processing ? 'Processing...' : confirmAction === 'SUSPENDED' ? 'Suspend' : 'Reject'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
