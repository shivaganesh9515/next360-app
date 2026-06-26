'use client';

import { useState, useEffect } from 'react';
import { Plus, X } from 'lucide-react';
import DataTable from '@/components/DataTable';
import StatusBadge from '@/components/StatusBadge';
import { vendorApi } from '@/lib/api';

export default function OffersPage() {
  const [offers, setOffers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: '', description: '', discountType: 'PERCENTAGE', discountValue: '', startDate: '', endDate: '' });
  const [saving, setSaving] = useState(false);

  const fetchOffers = async () => {
    setLoading(true);
    try { const res = await vendorApi.getOffers(); setOffers(Array.isArray(res) ? res : []); }
    catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchOffers(); }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault(); setSaving(true);
    try {
      await vendorApi.createOffer({
        title: form.title, description: form.description || undefined,
        discountType: form.discountType, discountValue: parseFloat(form.discountValue),
        startDate: form.startDate, endDate: form.endDate,
      });
      setShowForm(false); setForm({ title: '', description: '', discountType: 'PERCENTAGE', discountValue: '', startDate: '', endDate: '' });
      fetchOffers();
    } catch (e: any) { alert(e.message); }
    finally { setSaving(false); }
  };

  const toggleActive = async (id: string, isActive: boolean) => {
    try { await vendorApi.updateOffer(id, { isActive: !isActive }); fetchOffers(); }
    catch (e) { console.error(e); }
  };

  const columns = [
    { key: 'title', label: 'Offer' },
    { key: 'description', label: 'Description', render: (item: any) => <span className="text-sm text-gray-500 truncate max-w-[250px] inline-block">{item.description || '-'}</span> },
    { key: 'discountValue', label: 'Discount', render: (item: any) => <span>{item.discountType === 'PERCENTAGE' ? `${item.discountValue}%` : `₹${item.discountValue}`}</span> },
    { key: 'endDate', label: 'Valid Until', render: (item: any) => <span className="text-sm">{new Date(item.endDate).toLocaleDateString()}</span> },
    { key: 'isActive', label: 'Status', render: (item: any) => <StatusBadge status={item.isActive ? 'ACTIVE' : 'INACTIVE'} /> },
    { key: 'actions', label: '', render: (item: any) => (
      <button onClick={() => toggleActive(item.id, item.isActive)} className="text-xs text-emerald-600">{item.isActive ? 'Deactivate' : 'Activate'}</button>
    )},
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h2 className="text-xl font-bold text-gray-800">Offers</h2><p className="text-sm text-gray-500">Manage store-wide offers</p></div>
        <button onClick={() => setShowForm(!showForm)} className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700"><Plus className="w-4 h-4" /> Create Offer</button>
      </div>
      {showForm && (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-800">New Offer</h3>
            <button onClick={() => setShowForm(false)} className="p-1 hover:bg-gray-100 rounded"><X className="w-4 h-4" /></button>
          </div>
          <form onSubmit={handleCreate} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2"><label className="block text-xs font-medium text-gray-700 mb-1">Title *</label>
              <input value={form.title} onChange={(e) => setForm({...form, title: e.target.value})} required className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" placeholder="Summer Sale" /></div>
            <div className="sm:col-span-2"><label className="block text-xs font-medium text-gray-700 mb-1">Description</label>
              <textarea value={form.description} onChange={(e) => setForm({...form, description: e.target.value})} rows={2} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" placeholder="Get amazing discounts..." /></div>
            <div><label className="block text-xs font-medium text-gray-700 mb-1">Type</label>
              <select value={form.discountType} onChange={(e) => setForm({...form, discountType: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm">
                <option value="PERCENTAGE">Percentage</option><option value="FIXED">Fixed Amount</option></select></div>
            <div><label className="block text-xs font-medium text-gray-700 mb-1">Value *</label>
              <input type="number" min="0" value={form.discountValue} onChange={(e) => setForm({...form, discountValue: e.target.value})} required className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" /></div>
            <div><label className="block text-xs font-medium text-gray-700 mb-1">Start Date *</label>
              <input type="date" value={form.startDate} onChange={(e) => setForm({...form, startDate: e.target.value})} required className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" /></div>
            <div><label className="block text-xs font-medium text-gray-700 mb-1">End Date *</label>
              <input type="date" value={form.endDate} onChange={(e) => setForm({...form, endDate: e.target.value})} required className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" /></div>
            <div className="flex items-end sm:col-span-2">
              <button type="submit" disabled={saving} className="px-6 py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700 disabled:opacity-50">{saving ? 'Saving...' : 'Save Offer'}</button>
            </div>
          </form>
        </div>
      )}
      <DataTable columns={columns} data={offers} loading={loading} emptyMessage="No offers created yet" />
    </div>
  );
}
