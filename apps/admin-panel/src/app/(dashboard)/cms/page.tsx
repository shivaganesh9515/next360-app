'use client';

import { useState, useEffect } from 'react';
import { FileText, Plus, Pencil, Trash2, Eye, EyeOff } from 'lucide-react';
import DataTable from '@/components/DataTable';
import StatusBadge from '@/components/StatusBadge';
import { adminApi } from '@/lib/api';

export default function CMSPage() {
  const [pages, setPages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editPage, setEditPage] = useState<any>(null);
  const [form, setForm] = useState({ title: '', slug: '', content: '', isPublished: false });

  useEffect(() => { loadPages(); }, []);

  const loadPages = async () => {
    setLoading(true);
    try { const res = await adminApi.getCMS(); setPages(res?.data || res || []); }
    catch { setPages([]); } finally { setLoading(false); }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editPage) { await adminApi.updateCMSPage(editPage.id, form); }
      else { await adminApi.createCMSPage(form); }
      setShowModal(false); setEditPage(null); setForm({ title: '', slug: '', content: '', isPublished: false }); loadPages();
    } catch (err: any) { alert(err.message); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this page?')) return;
    try { await adminApi.deleteCMSPage(id); loadPages(); }
    catch (err: any) { alert(err.message); }
  };

  const columns = [
    { key: 'title', label: 'Title', render: (p: any) => <span className="font-medium text-gray-800">{p.title}</span> },
    { key: 'slug', label: 'Slug', render: (p: any) => <span className="font-mono text-xs text-gray-500">/{p.slug}</span> },
    { key: 'isPublished', label: 'Status', render: (p: any) => <StatusBadge status={p.isPublished ? 'ACTIVE' : 'DRAFT'} /> },
    { key: 'actions', label: 'Actions', render: (p: any) => (
      <div className="flex gap-1">
        <button onClick={(e) => { e.stopPropagation(); setEditPage(p); setForm({ title: p.title, slug: p.slug, content: p.content || '', isPublished: p.isPublished }); setShowModal(true); }} className="p-1.5 hover:bg-gray-100 rounded"><Pencil className="w-3.5 h-3.5 text-gray-600" /></button>
        <button onClick={(e) => { e.stopPropagation(); handleDelete(p.id); }} className="p-1.5 hover:bg-red-50 rounded"><Trash2 className="w-3.5 h-3.5 text-red-500" /></button>
      </div>
    )},
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h2 className="text-xl font-bold text-gray-800">CMS Pages</h2><p className="text-sm text-gray-500">Manage static content pages</p></div>
        <button onClick={() => { setEditPage(null); setForm({ title: '', slug: '', content: '', isPublished: false }); setShowModal(true); }} className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm hover:bg-emerald-700"><Plus className="w-4 h-4" /> Add Page</button>
      </div>

      <DataTable columns={columns} data={pages} loading={loading} emptyMessage="No CMS pages" emptyIcon={<FileText className="w-10 h-10" />} />

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-xl p-6 max-w-2xl w-full mx-4 shadow-xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">{editPage ? 'Edit Page' : 'Add Page'}</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div><label className="text-sm text-gray-600 mb-1 block">Title *</label><input type="text" required value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" /></div>
              <div><label className="text-sm text-gray-600 mb-1 block">Slug *</label><input type="text" required value={form.slug} onChange={e => setForm({ ...form, slug: e.target.value })} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" placeholder="about-us" /></div>
              <div><label className="text-sm text-gray-600 mb-1 block">Content</label><textarea value={form.content} onChange={e => setForm({ ...form, content: e.target.value })} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm min-h-[200px]" placeholder="HTML content..." /></div>
              <div className="flex items-center gap-2"><input type="checkbox" checked={form.isPublished} onChange={e => setForm({ ...form, isPublished: e.target.checked })} className="rounded" /><label className="text-sm text-gray-600">Published</label></div>
              <div className="flex gap-3 justify-end">
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg">Cancel</button>
                <button type="submit" className="px-4 py-2 text-sm bg-emerald-600 text-white rounded-lg hover:bg-emerald-700">{editPage ? 'Update' : 'Create'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
