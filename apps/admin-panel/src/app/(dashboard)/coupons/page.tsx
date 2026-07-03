'use client';

import { useState, useEffect } from 'react';
import { Percent, Plus, Pencil, Trash2 } from 'lucide-react';
import DataTable from '@/components/DataTable';
import StatusBadge from '@/components/StatusBadge';
import { adminApi } from '@/lib/api';

export default function CouponsPage() {
  const [coupons, setCoupons] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editCoupon, setEditCoupon] = useState<any>(null);
  const [form, setForm] = useState({ code: '', type: 'PERCENTAGE', value: 0, minOrderAmount: 0, maxDiscountAmount: 0, usageLimit: 0, isActive: true });

  useEffect(() => { loadCoupons(); }, []);

  const loadCoupons = async () => {
    setLoading(true);
    try { const res = await adminApi.getCoupons(); setCoupons(res?.data || res || []); }
    catch { setCoupons([]); } finally { setLoading(false); }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editCoupon) { await adminApi.updateCoupon(editCoupon.id, form); }
      else { await adminApi.createCoupon(form); }
      setShowModal(false); setEditCoupon(null); loadCoupons();
    } catch (err: any) { alert(err.message); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this coupon?')) return;
    try { await adminApi.deleteCoupon(id); loadCoupons(); }
    catch (err: any) { alert(err.message); }
  };

  const columns = [
    { key: 'code', label: 'Code', render: (c: any) => <span className="font-mono font-bold text-emerald-700">{c.code}</span> },
    { key: 'type', label: 'Type', render: (c: any) => <StatusBadge status={c.type} /> },
    { key: 'value', label: 'Value', render: (c: any) => c.type === 'PERCENTAGE' ? <span>{c.value}%</span> : <span className="font-mono">₹{c.value}</span> },
    { key: 'minOrderAmount', label: 'Min Order', render: (c: any) => <span className="font-mono">₹{(c.minOrderAmount || 0).toLocaleString()}</span> },
    { key: 'usageCount', label: 'Used', render: (c: any) => <span>{c.usageCount || 0}{c.usageLimit ? `/${c.usageLimit}` : ''}</span> },
    { key: 'isActive', label: 'Active', render: (c: any) => <StatusBadge status={c.isActive ? 'ACTIVE' : 'INACTIVE'} /> },
    { key: 'actions', label: 'Actions', render: (c: any) => (
      <div className="flex gap-1">
        <button onClick={(e) => { e.stopPropagation(); setEditCoupon(c); setForm({ code: c.code, type: c.type, value: c.value, minOrderAmount: c.minOrderAmount || 0, maxDiscountAmount: c.maxDiscountAmount || 0, usageLimit: c.usageLimit || 0, isActive: c.isActive }); setShowModal(true); }} className="p-1.5 hover:bg-gray-100 rounded"><Pencil className="w-3.5 h-3.5 text-gray-600" /></button>
        <button onClick={(e) => { e.stopPropagation(); handleDelete(c.id); }} className="p-1.5 hover:bg-red-50 rounded"><Trash2 className="w-3.5 h-3.5 text-red-500" /></button>
      </div>
    )},
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h2 className="text-xl font-bold text-gray-800">Coupons</h2><p className="text-sm text-gray-500">Manage discount coupons</p></div>
        <button onClick={() => { setEditCoupon(null); setForm({ code: '', type: 'PERCENTAGE', value: 0, minOrderAmount: 0, maxDiscountAmount: 0, usageLimit: 0, isActive: true }); setShowModal(true); }} className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm hover:bg-emerald-700"><Plus className="w-4 h-4" /> Add Coupon</button>
      </div>

      <DataTable columns={columns} data={coupons} loading={loading} emptyMessage="No coupons created" emptyIcon={<Percent className="w-10 h-10" />} />

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4 shadow-xl">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">{editCoupon ? 'Edit Coupon' : 'Add Coupon'}</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div><label className="text-sm text-gray-600 mb-1 block">Code *</label><input type="text" required value={form.code} onChange={e => setForm({ ...form, code: e.target.value.toUpperCase() })} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm font-mono" /></div>
              <div><label className="text-sm text-gray-600 mb-1 block">Type *</label>
                <select value={form.type} onChange={e => setForm({ ...form, type: e.target.value })} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm">
                  <option value="PERCENTAGE">Percentage</option><option value="FIXED">Fixed Amount</option>
                </select>
              </div>
              <div><label className="text-sm text-gray-600 mb-1 block">Value *</label><input type="number" required min="0" value={form.value} onChange={e => setForm({ ...form, value: Number(e.target.value) })} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" /></div>
              <div><label className="text-sm text-gray-600 mb-1 block">Min Order (₹)</label><input type="number" value={form.minOrderAmount} onChange={e => setForm({ ...form, minOrderAmount: Number(e.target.value) })} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" /></div>
              <div><label className="text-sm text-gray-600 mb-1 block">Max Discount (₹)</label><input type="number" value={form.maxDiscountAmount} onChange={e => setForm({ ...form, maxDiscountAmount: Number(e.target.value) })} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" /></div>
              <div><label className="text-sm text-gray-600 mb-1 block">Usage Limit</label><input type="number" value={form.usageLimit} onChange={e => setForm({ ...form, usageLimit: Number(e.target.value) })} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" placeholder="0 = unlimited" /></div>
              <label className="flex items-center gap-2"><input type="checkbox" checked={form.isActive} onChange={e => setForm({ ...form, isActive: e.target.checked })} className="rounded" /><span className="text-sm text-gray-600">Active</span></label>
              <div className="flex gap-3 justify-end">
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg">Cancel</button>
                <button type="submit" className="px-4 py-2 text-sm bg-emerald-600 text-white rounded-lg hover:bg-emerald-700">{editCoupon ? 'Update' : 'Create'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
