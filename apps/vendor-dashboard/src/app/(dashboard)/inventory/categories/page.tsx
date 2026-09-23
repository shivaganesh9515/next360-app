'use client';

import { useState, useEffect } from 'react';
import { vendorApi } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import DataTable from '@/components/DataTable';

export default function InventoryCategoriesPage() {
  const { vendorProfile } = useAuth();
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!vendorProfile?.storeType) return;
    setLoading(true);
    // Scoped to this vendor's own store type — a vendor should only ever
    // see the categories that apply to the kind of store they run.
    vendorApi.getCategories({ storeType: vendorProfile.storeType })
      .then(res => setCategories(Array.isArray(res) ? res : (res as any)?.data || []))
      .catch(() => {
        // Non-critical: categories list is informational only
      })
      .finally(() => setLoading(false));
  }, [vendorProfile?.storeType]);

  const columns = [
    { key: 'name', label: 'Category' },
    { key: 'slug', label: 'Slug' },
    { key: 'description', label: 'Description', render: (item: any) => <span className="text-slate-400 text-sm">{item.description || '-'}</span> },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-slate-900">Categories</h2>
        <p className="text-sm text-slate-500">Categories available in your store{vendorProfile?.storeType ? ` (${vendorProfile.storeType})` : ''}</p>
      </div>
      <DataTable columns={columns} data={categories} loading={loading} emptyMessage="No categories found" />
    </div>
  );
}
