'use client';

import { useState, useEffect } from 'react';
import { Plus, X } from 'lucide-react';
import DataTable from '@/components/DataTable';
import StatusBadge from '@/components/StatusBadge';
import { vendorApi } from '@/lib/api';

export default function CouponsPage() {
  const [coupons, setCoupons] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ code: '', discountType: 'PERCENTAGE', discountValue: '', minOrderAmount: '', maxDiscount: '', usageLimit: '', expiresAt: '' });
  const [saving, setSaving] = useState(false);

  const fetchCoupons = async () => {
    setLoading(true);
    try { const res = await vendorApi.getCoupons(); setCoupons(Array.isArray(res) ? res : []); }
    catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchCoupons(); }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault(); setSaving(true);
    try {
      await vendorApi.createCoupon({
        code: form.code.toUpperCase(), discountType: form.discountType, discountValue: parseFloat(form.discountValue),
        minOrderAmount: form.minOrderAmount ? parseFloat(form.minOrderAmount) : undefined,
        maxDiscount: form.maxDiscount ? parseFloat(form.maxDiscount) : undefined,
        usageLimit: form.usageLimit ? parseInt(form.usageLimit) : undefined,
        expiresAt: form.expiresAt || undefined,
      });
      setShowForm(false); setForm({ code: '', discountType: 'PERCENTAGE', discountValue: '', minOrderAmount: '', maxDiscount: '', usageLimit: '', expiresAt: '' });
      fetchCoupons();
    } catch (e: any) { alert(e.message); }
    finally { setSaving(false); }
  };

  const toggleActive = async (id: string, isActive: boolean) => {
    try { await vendorApi.updateCoupon(id, { isActive: !isActive }); fetchCoupons(); }
    catch (e) { console.error(e); }
  };

  const columns = [
    { key: 'code', label: 'Code', render: (item: any) => <span className="font-mono font-bold text-sm bg-gray-100 px-2 py-1 rounded">{item.code}</span> },
    { key: 'discountType', label: 'Type', render: (item: any) => <span className="text-xs">{item.discountType === 'PERCENTAGE' ? '% Off' : '₹ Off'}</span> },
    { key: 'discountValue', label: 'Value', render: (item: any) => <span>{item.discountType === 'PERCENTAGE' ? `${item.discountValue}%` : `₹${item.discountValue}`}</span> },
    { key: 'minOrderAmount', label: 'Min Order', render: (item: any) => <span>₹{Number(item.minOrderAmount || 0).toLocaleString()}</span> },
    { key: 'usedCount', label: 'Used', render: (item: any) => <span>{item.usedCount || 0}/{item.usageLimit || '∞'}</span> },
    { key: 'isActive', label: 'Status', render: (item: any) => <StatusBadge status={item.isActive ? 'ACTIVE' : 'INACTIVE'} /> },
    { key: 'actions', label: '', render: (item: any) => (
      <button onClick={() => toggleActive(item.id, item.isActive)} className="text-xs text-emerald-600 hover:text-emerald-700">
        {item.isActive ? 'Deactivate' : 'Activate'}
      </button>
    )},
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h2 className="text-xl font-bold text-gray-800">Coupons</h2><p className="text-sm text-gray-500">Create and manage discount coupons</p></div>
        <button onClick={() => setShowForm(!showForm)} className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700"><Plus className="w-4 h-4" /> Create Coupon</button>
      </div>
      {showForm && (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-800">New Coupon</h3>
            <button onClick={() => setShowForm(false)} className="p-1 hover:bg-gray-100 rounded"><X className="w-4 h-4" /></button>
          </div>
          <form onSubmit={handleCreate} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div><label className="block text-xs font-medium text-gray-700 mb-1">Code *</label>
              <input value={form.code} onChange={(e) => setForm({...form, code: e.target.value.toUpperCase()})} required className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" placeholder="SAVE20" /></div>
            <div><label className="block text-xs font-medium text-gray-700 mb-1">Type</label>
              <select value={form.discountType} onChange={(e) => setForm({...form, discountType: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500">
                <option value="PERCENTAGE">Percentage</option><option value="FIXED">Fixed Amount</option></select></div>
            <div><label className="block text-xs font-medium text-gray-700 mb-1">Value *</label>
              <input type="number" min="0" value={form.discountValue} onChange={(e) => setForm({...form, discountValue: e.target.value})} required className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" placeholder="20" /></div>
            <div><label className="block text-xs font-medium text-gray-700 mb-1">Min Order Amount</label>
              <input type="number" min="0" value={form.minOrderAmount} onChange={(e) => setForm({...form, minOrderAmount: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" placeholder="500" /></div>
            <div><label className="block text-xs font-medium text-gray-700 mb-1">Max Discount</label>
              <input type="number" min="0" value={form.maxDiscount} onChange={(e) => setForm({...form, maxDiscount: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" placeholder="100" /></div>
            <div><label className="block text-xs font-medium text-gray-700 mb-1">Usage Limit</label>
              <input type="number" min="0" value={form.usageLimit} onChange={(e) => setForm({...form, usageLimit: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" placeholder="100" /></div>
            <div><label className="block text-xs font-medium text-gray-700 mb-1">Expires At</label>
              <input type="date" value={form.expiresAt} onChange={(e) => setForm({...form, expiresAt: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" /></div>
            <div className="flex items-end">
              <button type="submit" disabled={saving} className="w-full py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700 disabled:opacity-50">{saving ? 'Saving...' : 'Save Coupon'}</button>
            </div>
          </form>
        </div>
      )}
      <DataTable columns={columns} data={coupons} loading={loading} emptyMessage="No coupons created yet" />
    </div>
  );
}
