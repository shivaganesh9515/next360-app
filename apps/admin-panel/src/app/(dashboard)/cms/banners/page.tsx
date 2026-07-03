'use client';

import { useState, useEffect } from 'react';
import { Image, Plus, Pencil, Trash2 } from 'lucide-react';
import DataTable from '@/components/DataTable';
import StatusBadge from '@/components/StatusBadge';
import { adminApi } from '@/lib/api';

export default function BannersPage() {
  const [banners, setBanners] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editBanner, setEditBanner] = useState<any>(null);
  const [form, setForm] = useState({ title: '', imageUrl: '', link: '', position: 0, isActive: true });

  useEffect(() => { loadBanners(); }, []);

  const loadBanners = async () => {
    setLoading(true);
    try { const res = await adminApi.getBanners(); setBanners(res?.data || res || []); }
    catch { setBanners([]); } finally { setLoading(false); }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editBanner) { await adminApi.updateBanner(editBanner.id, form); }
      else { await adminApi.createBanner(form); }
      setShowModal(false); setEditBanner(null); loadBanners();
    } catch (err: any) { alert(err.message); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this banner?')) return;
    try { await adminApi.deleteBanner(id); loadBanners(); }
    catch (err: any) { alert(err.message); }
  };

  const columns = [
    { key: 'title', label: 'Title', render: (b: any) => <span className="font-medium text-gray-800">{b.title}</span> },
    { key: 'image', label: 'Image', render: (b: any) => b.imageUrl ? <img src={b.imageUrl} alt="" className="w-20 h-10 object-cover rounded" /> : <div className="w-20 h-10 bg-gray-100 rounded flex items-center justify-center"><Image className="w-4 h-4 text-gray-400" /></div> },
    { key: 'link', label: 'Link', render: (b: any) => <span className="text-xs text-gray-500">{b.link || '-'}</span> },
    { key: 'position', label: 'Position', render: (b: any) => b.position },
    { key: 'isActive', label: 'Active', render: (b: any) => <StatusBadge status={b.isActive ? 'ACTIVE' : 'INACTIVE'} /> },
    { key: 'actions', label: 'Actions', render: (b: any) => (
      <div className="flex gap-1">
        <button onClick={(e) => { e.stopPropagation(); setEditBanner(b); setForm({ title: b.title, imageUrl: b.imageUrl || '', link: b.link || '', position: b.position || 0, isActive: b.isActive }); setShowModal(true); }} className="p-1.5 hover:bg-gray-100 rounded"><Pencil className="w-3.5 h-3.5 text-gray-600" /></button>
        <button onClick={(e) => { e.stopPropagation(); handleDelete(b.id); }} className="p-1.5 hover:bg-red-50 rounded"><Trash2 className="w-3.5 h-3.5 text-red-500" /></button>
      </div>
    )},
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h2 className="text-xl font-bold text-gray-800">Banners</h2><p className="text-sm text-gray-500">Manage homepage banners</p></div>
        <button onClick={() => { setEditBanner(null); setForm({ title: '', imageUrl: '', link: '', position: 0, isActive: true }); setShowModal(true); }} className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm hover:bg-emerald-700"><Plus className="w-4 h-4" /> Add Banner</button>
      </div>

      <DataTable columns={columns} data={banners} loading={loading} emptyMessage="No banners" emptyIcon={<Image className="w-10 h-10" />} />

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4 shadow-xl">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">{editBanner ? 'Edit Banner' : 'Add Banner'}</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div><label className="text-sm text-gray-600 mb-1 block">Title *</label><input type="text" required value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" /></div>
              <div><label className="text-sm text-gray-600 mb-1 block">Image URL *</label><input type="url" required value={form.imageUrl} onChange={e => setForm({ ...form, imageUrl: e.target.value })} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" /></div>
              <div><label className="text-sm text-gray-600 mb-1 block">Link</label><input type="text" value={form.link} onChange={e => setForm({ ...form, link: e.target.value })} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" placeholder="/categories/organic" /></div>
              <div><label className="text-sm text-gray-600 mb-1 block">Position</label><input type="number" value={form.position} onChange={e => setForm({ ...form, position: Number(e.target.value) })} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" /></div>
              <label className="flex items-center gap-2"><input type="checkbox" checked={form.isActive} onChange={e => setForm({ ...form, isActive: e.target.checked })} className="rounded" /><span className="text-sm text-gray-600">Active</span></label>
              <div className="flex gap-3 justify-end">
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg">Cancel</button>
                <button type="submit" className="px-4 py-2 text-sm bg-emerald-600 text-white rounded-lg hover:bg-emerald-700">{editBanner ? 'Update' : 'Create'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
