'use client';

import { useState, useEffect } from 'react';
import { Tag, Plus, Pencil, Trash2 } from 'lucide-react';
import DataTable from '@/components/DataTable';
import StatusBadge from '@/components/StatusBadge';
import { adminApi } from '@/lib/api';

export default function OffersPage() {
  const [offers, setOffers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editOffer, setEditOffer] = useState<any>(null);
  const [form, setForm] = useState({ title: '', description: '', type: 'PERCENTAGE', value: 0, storeType: '', startDate: '', endDate: '', isActive: true });
  const [searchQuery, setSearchQuery] = useState('');

  const filteredOffers = offers.filter((o) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      o.title?.toLowerCase().includes(q) ||
      o.type?.toLowerCase().includes(q) ||
      o.storeType?.toLowerCase().includes(q) ||
      String(o.value).includes(q)
    );
  });

  useEffect(() => { loadOffers(); }, []);

  const loadOffers = async () => {
    setLoading(true);
    try { const res = await adminApi.getOffers(); setOffers(res?.data || res || []); }
    catch { setOffers([]); } finally { setLoading(false); }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editOffer) { await adminApi.updateOffer(editOffer.id, form); }
      else { await adminApi.createOffer(form); }
      setShowModal(false); setEditOffer(null); loadOffers();
    } catch (err: any) { alert(err.message); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this offer?')) return;
    try { await adminApi.deleteOffer(id); loadOffers(); }
    catch (err: any) { alert(err.message); }
  };

  const columns = [
    { key: 'title', label: 'Title', render: (o: any) => <span className="font-medium text-gray-800">{o.title}</span> },
    { key: 'type', label: 'Type', render: (o: any) => <StatusBadge status={o.type} /> },
    { key: 'value', label: 'Value', render: (o: any) => o.type === 'PERCENTAGE' ? <span>{o.value}%</span> : <span className="font-mono">₹{o.value}</span> },
    { key: 'storeType', label: 'Store', render: (o: any) => o.storeType ? <StatusBadge status={o.storeType} /> : <span className="text-gray-400">All</span> },
    { key: 'startDate', label: 'Start', render: (o: any) => o.startDate ? new Date(o.startDate).toLocaleDateString() : '-' },
    { key: 'endDate', label: 'End', render: (o: any) => o.endDate ? new Date(o.endDate).toLocaleDateString() : '-' },
    { key: 'isActive', label: 'Active', render: (o: any) => <StatusBadge status={o.isActive ? 'ACTIVE' : 'INACTIVE'} /> },
    { key: 'actions', label: 'Actions', render: (o: any) => (
      <div className="flex gap-1">
        <button onClick={(e) => { e.stopPropagation(); setEditOffer(o); setForm({ title: o.title, description: o.description || '', type: o.type, value: o.value, storeType: o.storeType || '', startDate: o.startDate || '', endDate: o.endDate || '', isActive: o.isActive }); setShowModal(true); }} className="p-1.5 hover:bg-gray-100 rounded"><Pencil className="w-3.5 h-3.5 text-gray-600" /></button>
        <button onClick={(e) => { e.stopPropagation(); handleDelete(o.id); }} className="p-1.5 hover:bg-red-50 rounded"><Trash2 className="w-3.5 h-3.5 text-red-500" /></button>
      </div>
    )},
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h2 className="text-xl font-bold text-gray-800">Offers</h2><p className="text-sm text-gray-500">Manage promotional offers</p></div>
        <button onClick={() => { setEditOffer(null); setForm({ title: '', description: '', type: 'PERCENTAGE', value: 0, storeType: '', startDate: '', endDate: '', isActive: true }); setShowModal(true); }} className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm hover:bg-emerald-700"><Plus className="w-4 h-4" /> Add Offer</button>
      </div>

      <DataTable columns={columns} data={filteredOffers} loading={loading} searchable searchPlaceholder="Search offers..." onSearch={setSearchQuery} emptyMessage="No offers" emptyIcon={<Tag className="w-10 h-10" />} />

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4 shadow-xl">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">{editOffer ? 'Edit Offer' : 'Add Offer'}</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div><label className="text-sm text-gray-600 mb-1 block">Title *</label><input type="text" required value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" /></div>
              <div><label className="text-sm text-gray-600 mb-1 block">Description</label><textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" rows={2} /></div>
              <div><label className="text-sm text-gray-600 mb-1 block">Type *</label>
                <select value={form.type} onChange={e => setForm({ ...form, type: e.target.value })} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm">
                  <option value="PERCENTAGE">Percentage</option><option value="FIXED">Fixed Amount</option><option value="BUY_X_GET_Y">Buy X Get Y</option>
                </select>
              </div>
              <div><label className="text-sm text-gray-600 mb-1 block">Value *</label><input type="number" required min="0" value={form.value} onChange={e => setForm({ ...form, value: Number(e.target.value) })} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" /></div>
              <div><label className="text-sm text-gray-600 mb-1 block">Store Type</label>
                <select value={form.storeType} onChange={e => setForm({ ...form, storeType: e.target.value })} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm">
                  <option value="">All Stores</option><option value="ORGANIC">Organic</option><option value="NATURAL">Natural</option><option value="ECO_FRIENDLY">Eco-Friendly</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="text-sm text-gray-600 mb-1 block">Start Date</label><input type="date" value={form.startDate} onChange={e => setForm({ ...form, startDate: e.target.value })} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" /></div>
                <div><label className="text-sm text-gray-600 mb-1 block">End Date</label><input type="date" value={form.endDate} onChange={e => setForm({ ...form, endDate: e.target.value })} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" /></div>
              </div>
              <label className="flex items-center gap-2"><input type="checkbox" checked={form.isActive} onChange={e => setForm({ ...form, isActive: e.target.checked })} className="rounded" /><span className="text-sm text-gray-600">Active</span></label>
              <div className="flex gap-3 justify-end">
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg">Cancel</button>
                <button type="submit" className="px-4 py-2 text-sm bg-emerald-600 text-white rounded-lg hover:bg-emerald-700">{editOffer ? 'Update' : 'Create'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
