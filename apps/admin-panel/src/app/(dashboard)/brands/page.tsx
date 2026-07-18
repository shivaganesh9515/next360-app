'use client';

import { useState, useEffect } from 'react';
import { Star, Plus, Trash2, Edit2 } from 'lucide-react';
import DataTable from '@/components/DataTable';
import StatusBadge from '@/components/StatusBadge';
import { adminApi } from '@/lib/api';

export default function BrandsPage() {
  const [brands, setBrands] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ name: '', slug: '', storeType: 'ORGANIC' });
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const filteredBrands = brands.filter((b) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      b.name?.toLowerCase().includes(q) ||
      b.slug?.toLowerCase().includes(q) ||
      b.storeType?.toLowerCase().includes(q)
    );
  });

  useEffect(() => { loadBrands(); }, []);

  const loadBrands = async () => {
    setLoading(true);
    try {
      const res = await adminApi.getBrands();
      setBrands((Array.isArray(res) ? res : (res as any)?.data) || []);
    } catch { setBrands([]); } finally { setLoading(false); }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingId) { await adminApi.updateBrand(editingId, form); }
      else { await adminApi.createBrand(form); }
      setShowForm(false); setEditingId(null); setForm({ name: '', slug: '', storeType: 'ORGANIC' }); loadBrands();
    } catch (err: any) { alert(err.message || 'Failed to save brand'); }
  };

  const handleDelete = async (id: string) => {
    try { await adminApi.deleteBrand(id); setConfirmDelete(null); loadBrands(); }
    catch (err: any) { alert(err.message || 'Failed to delete brand'); }
  };

  const columns = [
    { key: 'name', label: 'Name', render: (b: any) => <span className="font-medium text-gray-800">{b.name}</span> },
    { key: 'slug', label: 'Slug', render: (b: any) => <code className="text-xs bg-gray-100 px-1.5 py-0.5 rounded">{b.slug}</code> },
    { key: 'storeType', label: 'Store Type', render: (b: any) => <StatusBadge status={b.storeType} /> },
    { key: 'actions', label: 'Actions', render: (b: any) => (
      <div className="flex gap-1">
        <button onClick={(e) => { e.stopPropagation(); setForm({ name: b.name, slug: b.slug, storeType: b.storeType }); setEditingId(b.id); setShowForm(true); }} className="p-1.5 hover:bg-gray-100 rounded"><Edit2 className="w-3.5 h-3.5 text-gray-500" /></button>
        <button onClick={(e) => { e.stopPropagation(); setConfirmDelete(b.id); }} className="p-1.5 hover:bg-red-50 rounded"><Trash2 className="w-3.5 h-3.5 text-red-500" /></button>
      </div>
    )},
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-800">Brands</h2>
          <p className="text-sm text-gray-500">Manage product brands</p>
        </div>
        <button onClick={() => { setShowForm(!showForm); setEditingId(null); setForm({ name: '', slug: '', storeType: 'ORGANIC' }); }} className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm hover:bg-emerald-700 flex items-center gap-2">
          <Plus className="w-4 h-4" /> Add Brand
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
          <h3 className="font-semibold text-gray-800">{editingId ? 'Edit Brand' : 'New Brand'}</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div><label className="text-sm text-gray-500">Name</label><input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value, slug: e.target.value.toLowerCase().replace(/\s+/g, '-') })} required className="w-full mt-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500" /></div>
            <div><label className="text-sm text-gray-500">Slug</label><input value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} required className="w-full mt-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500" /></div>
            <div><label className="text-sm text-gray-500">Store Type</label><select value={form.storeType} onChange={(e) => setForm({ ...form, storeType: e.target.value })} className="w-full mt-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500"><option value="ORGANIC">Organic</option><option value="NATURAL">Natural</option><option value="ECO_FRIENDLY">Eco-Friendly</option></select></div>
          </div>
          <div className="flex gap-3">
            <button type="submit" className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm hover:bg-emerald-700">{editingId ? 'Update' : 'Create'}</button>
            <button type="button" onClick={() => { setShowForm(false); setEditingId(null); }} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg text-sm">Cancel</button>
          </div>
        </form>
      )}

      <DataTable columns={columns} data={filteredBrands} loading={loading} searchable searchPlaceholder="Search brands..." onSearch={setSearchQuery} emptyMessage="No brands found" emptyIcon={<Star className="w-10 h-10" />} />

      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-xl p-6 max-w-sm w-full mx-4 shadow-xl">
            <h3 className="text-lg font-semibold text-gray-800 mb-2">Delete Brand</h3>
            <p className="text-sm text-gray-600 mb-6">This action cannot be undone.</p>
            <div className="flex gap-3 justify-end">
              <button onClick={() => setConfirmDelete(null)} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg">Cancel</button>
              <button onClick={() => handleDelete(confirmDelete)} className="px-4 py-2 text-sm text-white bg-red-600 rounded-lg hover:bg-red-700">Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
