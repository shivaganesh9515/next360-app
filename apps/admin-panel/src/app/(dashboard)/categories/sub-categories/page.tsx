'use client';

import { useState, useEffect } from 'react';
import { Tag, Plus, Trash2, Edit2 } from 'lucide-react';
import DataTable from '@/components/DataTable';
import StatusBadge from '@/components/StatusBadge';
import { adminApi } from '@/lib/api';

export default function SubCategoriesPage() {
  const [subCategories, setSubCategories] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ name: '', slug: '', categoryId: '' });
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [subRes, catRes] = await Promise.all([
        adminApi.getSubCategories(),
        adminApi.getCategories()
      ]);
      setSubCategories((Array.isArray(subRes) ? subRes : (subRes as any)?.data) || []);
      setCategories((Array.isArray(catRes) ? catRes : (catRes as any)?.data) || []);
    } catch {
      setSubCategories([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingId) {
        await adminApi.updateSubCategory(editingId, form);
      } else {
        await adminApi.createSubCategory(form);
      }
      setShowForm(false);
      setEditingId(null);
      setForm({ name: '', slug: '', categoryId: '' });
      loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to save sub-category');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await adminApi.deleteSubCategory(id);
      setConfirmDelete(null);
      loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to delete sub-category');
    }
  };

  const columns = [
    { key: 'name', label: 'Name', render: (s: any) => <span className="font-medium text-gray-800">{s.name}</span> },
    { key: 'slug', label: 'Slug', render: (s: any) => <code className="text-xs bg-gray-100 px-1.5 py-0.5 rounded">{s.slug}</code> },
    { key: 'category', label: 'Parent Category', render: (s: any) => s.category?.name || '-' },
    { key: 'productsCount', label: 'Products', render: (s: any) => s._count?.products || 0 },
    { key: 'actions', label: 'Actions', render: (s: any) => (
      <div className="flex gap-1">
        <button onClick={(e) => { e.stopPropagation(); setForm({ name: s.name, slug: s.slug, categoryId: s.categoryId }); setEditingId(s.id); setShowForm(true); }} className="p-1.5 hover:bg-gray-100 rounded">
          <Edit2 className="w-3.5 h-3.5 text-gray-500" />
        </button>
        <button onClick={(e) => { e.stopPropagation(); setConfirmDelete(s.id); }} className="p-1.5 hover:bg-red-50 rounded">
          <Trash2 className="w-3.5 h-3.5 text-red-500" />
        </button>
      </div>
    )},
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-800">Sub-Categories</h2>
          <p className="text-sm text-gray-500">Manage sub-categories under main categories</p>
        </div>
        <button
          onClick={() => { setShowForm(!showForm); setEditingId(null); setForm({ name: '', slug: '', categoryId: '' }); }}
          className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm hover:bg-emerald-700 flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Add Sub-Category
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
          <h3 className="font-semibold text-gray-800">{editingId ? 'Edit Sub-Category' : 'New Sub-Category'}</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="text-sm text-gray-500">Name</label>
              <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value, slug: e.target.value.toLowerCase().replace(/\s+/g, '-') })} required className="w-full mt-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500" />
            </div>
            <div>
              <label className="text-sm text-gray-500">Slug</label>
              <input value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} required className="w-full mt-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500" />
            </div>
            <div>
              <label className="text-sm text-gray-500">Parent Category</label>
              <select value={form.categoryId} onChange={(e) => setForm({ ...form, categoryId: e.target.value })} required className="w-full mt-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500">
                <option value="">Select category</option>
                {categories.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
          </div>
          <div className="flex gap-3">
            <button type="submit" className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm hover:bg-emerald-700">{editingId ? 'Update' : 'Create'}</button>
            <button type="button" onClick={() => { setShowForm(false); setEditingId(null); }} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg text-sm">Cancel</button>
          </div>
        </form>
      )}

      <DataTable columns={columns} data={subCategories} loading={loading} searchable searchPlaceholder="Search sub-categories..." emptyMessage="No sub-categories found" emptyIcon={<Tag className="w-10 h-10" />} />

      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-xl p-6 max-w-sm w-full mx-4 shadow-xl">
            <h3 className="text-lg font-semibold text-gray-800 mb-2">Delete Sub-Category</h3>
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
