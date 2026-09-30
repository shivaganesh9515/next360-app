'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Tag, Plus, Trash2, Edit2, ChevronDown, Check } from 'lucide-react';
import DataTable from '@/components/DataTable';
import StatusBadge from '@/components/StatusBadge';
import { adminApi } from '@/lib/api';

/**
 * Values mirror the backend `StoreType` enum exactly — Prisma
 * (`prisma/schema.prisma`), `CreateCategoryDto` (`@IsEnum(StoreType)`) and
 * `@next360/shared`. Do not add or rename entries; the API 400s on anything
 * outside this set.
 */
type StoreTypeValue = 'ORGANIC' | 'NATURAL' | 'ECO_FRIENDLY';

const STORE_TYPE_OPTIONS: { value: StoreTypeValue; label: string }[] = [
  { value: 'ORGANIC', label: 'Organic' },
  { value: 'NATURAL', label: 'Natural' },
  { value: 'ECO_FRIENDLY', label: 'Eco Friendly' },
];

type CategoryForm = { name: string; slug: string; storeType: StoreTypeValue };

const EMPTY_FORM: CategoryForm = { name: '', slug: '', storeType: 'ORGANIC' };

export default function CategoriesPage() {
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [storeTypeFilter, setStoreTypeFilter] = useState('ALL');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<CategoryForm>(EMPTY_FORM);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [storeTypeOpen, setStoreTypeOpen] = useState(false);
  const [highlighted, setHighlighted] = useState(0);
  const storeTypeWrapRef = useRef<HTMLDivElement>(null);
  const storeTypeButtonRef = useRef<HTMLButtonElement>(null);
  const optionRefs = useRef<(HTMLButtonElement | null)[]>([]);

  const selectedOption = STORE_TYPE_OPTIONS.find((o) => o.value === form.storeType)!;

  const selectStoreType = useCallback((value: StoreTypeValue) => {
    setForm((f) => ({ ...f, storeType: value }));
    setStoreTypeOpen(false);
    storeTypeButtonRef.current?.focus();
  }, []);

  // Close when clicking anywhere outside the dropdown, or on Escape.
  useEffect(() => {
    if (!storeTypeOpen) return;
    const onPointerDown = (e: MouseEvent) => {
      if (!storeTypeWrapRef.current?.contains(e.target as Node)) setStoreTypeOpen(false);
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { setStoreTypeOpen(false); storeTypeButtonRef.current?.focus(); }
    };
    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [storeTypeOpen]);

  const onStoreTypeKeyDown = (e: React.KeyboardEvent) => {
    const last = STORE_TYPE_OPTIONS.length - 1;
    if (e.key === 'ArrowDown') { e.preventDefault(); setHighlighted((i) => Math.min(i + 1, last)); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setHighlighted((i) => Math.max(i - 1, 0)); }
    else if (e.key === 'Home') { e.preventDefault(); setHighlighted(0); }
    else if (e.key === 'End') { e.preventDefault(); setHighlighted(last); }
    else if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      if (storeTypeOpen) selectStoreType(STORE_TYPE_OPTIONS[highlighted].value);
      else { setStoreTypeOpen(true); setHighlighted(STORE_TYPE_OPTIONS.findIndex((o) => o.value === form.storeType)); }
    }
  };

  useEffect(() => {
    loadCategories();
  }, [storeTypeFilter]);

  const loadCategories = async () => {
    setLoading(true);
    try {
      const params: any = {};
      if (storeTypeFilter !== 'ALL') params.storeType = storeTypeFilter;
      const res = await adminApi.getCategories(params);
      setCategories((Array.isArray(res) ? res : (res as any)?.data) || []);
    } catch {
      setCategories([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredCategories = categories.filter((c) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      c.name?.toLowerCase().includes(q) ||
      c.slug?.toLowerCase().includes(q) ||
      c.storeType?.toLowerCase().includes(q)
    );
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingId) {
        await adminApi.updateCategory(editingId, form);
      } else {
        await adminApi.createCategory(form);
      }
      setShowForm(false);
      setEditingId(null);
      setForm(EMPTY_FORM);
      setStoreTypeOpen(false);
      loadCategories();
    } catch (err: any) {
      alert(err.message || 'Failed to save category');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await adminApi.deleteCategory(id);
      setConfirmDelete(null);
      loadCategories();
    } catch (err: any) {
      alert(err.message || 'Failed to delete category');
    }
  };

  const startEdit = (cat: any) => {
    setForm({ name: cat.name, slug: cat.slug, storeType: cat.storeType });
    setStoreTypeOpen(false);
    setEditingId(cat.id);
    setShowForm(true);
  };

  const columns = [
    { key: 'name', label: 'Name', render: (c: any) => <span className="font-medium text-gray-800">{c.name}</span> },
    { key: 'slug', label: 'Slug', render: (c: any) => <code className="text-xs bg-gray-100 px-1.5 py-0.5 rounded">{c.slug}</code> },
    { key: 'storeType', label: 'Store Type', render: (c: any) => <StatusBadge status={c.storeType} /> },
    { key: 'productsCount', label: 'Products', render: (c: any) => c._count?.products || 0 },
    { key: 'isActive', label: 'Active', render: (c: any) => <StatusBadge status={String(c.isActive !== false)} /> },
    { key: 'actions', label: 'Actions', render: (c: any) => (
      <div className="flex gap-1">
        <button onClick={(e) => { e.stopPropagation(); startEdit(c); }} className="p-1.5 hover:bg-gray-100 rounded">
          <Edit2 className="w-3.5 h-3.5 text-gray-500" />
        </button>
        <button onClick={(e) => { e.stopPropagation(); setConfirmDelete(c.id); }} className="p-1.5 hover:bg-red-50 rounded">
          <Trash2 className="w-3.5 h-3.5 text-red-500" />
        </button>
      </div>
    )},
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-800">Categories</h2>
          <p className="text-sm text-gray-500">Manage product categories</p>
        </div>
        <button
          onClick={() => { setShowForm(!showForm); setEditingId(null); setForm(EMPTY_FORM); setStoreTypeOpen(false); }}
          className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm hover:bg-emerald-700 flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Add Category
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
          <h3 className="font-semibold text-gray-800">{editingId ? 'Edit Category' : 'New Category'}</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="text-sm text-gray-500">Name</label>
              <input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value, slug: e.target.value.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '') })}
                required
                className="w-full mt-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <div>
              <label className="text-sm text-gray-500">Slug</label>
              <input
                value={form.slug}
                onChange={(e) => setForm({ ...form, slug: e.target.value })}
                required
                className="w-full mt-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <div>
              <label className="text-sm text-gray-500">Store Type</label>
              <div className="relative mt-1" ref={storeTypeWrapRef}>
                <button
                  type="button"
                  ref={storeTypeButtonRef}
                  onClick={() => {
                    setStoreTypeOpen((v) => !v);
                    setHighlighted(STORE_TYPE_OPTIONS.findIndex((o) => o.value === form.storeType));
                  }}
                  onKeyDown={onStoreTypeKeyDown}
                  aria-haspopup="listbox"
                  aria-expanded={storeTypeOpen}
                  aria-label="Store Type"
                  className="w-full flex items-center justify-between px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white text-left hover:border-gray-300 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                >
                  <span>{selectedOption.label}</span>
                  <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${storeTypeOpen ? 'rotate-180' : ''}`} />
                </button>
                {storeTypeOpen && (
                  <ul
                    role="listbox"
                    aria-label="Store Type options"
                    className="absolute z-20 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg py-1 max-h-60 overflow-auto"
                  >
                    {STORE_TYPE_OPTIONS.map((opt, i) => {
                      const isSelected = opt.value === form.storeType;
                      return (
                        <li key={opt.value} role="none">
                          <button
                            type="button"
                            role="option"
                            aria-selected={isSelected}
                            ref={(el) => { optionRefs.current[i] = el; }}
                            onClick={() => selectStoreType(opt.value)}
                            onMouseEnter={() => setHighlighted(i)}
                            className={`w-full flex items-center justify-between px-3 py-2 text-sm text-left transition-colors ${
                              i === highlighted ? 'bg-gray-50 text-gray-900' : 'text-gray-600'
                            }`}
                          >
                            <span>{opt.label}</span>
                            {isSelected && <Check className="w-4 h-4 text-emerald-600" />}
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
            </div>
          </div>
          <div className="flex gap-3">
            <button type="submit" className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm hover:bg-emerald-700">
              {editingId ? 'Update' : 'Create'}
            </button>
            <button type="button" onClick={() => { setShowForm(false); setEditingId(null); }} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg text-sm">
              Cancel
            </button>
          </div>
        </form>
      )}

      <div className="flex gap-2">
        {['ALL', 'ORGANIC', 'NATURAL', 'ECO_FRIENDLY'].map((t) => (
          <button
            key={t}
            onClick={() => setStoreTypeFilter(t)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              storeTypeFilter === t ? 'bg-emerald-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {t === 'ALL' ? 'All Types' : t.replace(/_/g, ' ')}
          </button>
        ))}
      </div>

      <DataTable
        columns={columns}
        data={filteredCategories}
        loading={loading}
        searchable
        searchPlaceholder="Search categories..."
        onSearch={setSearch}
        emptyMessage="No categories found"
        emptyIcon={<Tag className="w-10 h-10" />}
      />

      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-xl p-6 max-w-sm w-full mx-4 shadow-xl">
            <h3 className="text-lg font-semibold text-gray-800 mb-2">Delete Category</h3>
            <p className="text-sm text-gray-600 mb-6">This action cannot be undone. Only empty categories can be deleted.</p>
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
