'use client';

import DataTable from '@/components/DataTable';
import ErrorState from '@/components/ErrorState';
import { vendorApi } from '@/lib/api';
import { useApiData } from '@/hooks/useApiData';

export default function CategoriesPage() {
  // Distinguishes "no categories" (empty state) from "request failed" (error
  // state). The old .catch(() => {}) rendered empty for both, which is how
  // navigating from an empty page made data pages look empty too (audit Bug 4).
  const { data: res, loading, error, retry } = useApiData<any>(() => vendorApi.getCategories({}));
  const categories = Array.isArray(res) ? res : (res as any)?.data || [];

  const columns = [
    { key: 'name', label: 'Category' },
    { key: 'slug', label: 'Slug' },
    { key: 'storeType', label: 'Store Type', render: (item: any) => <span className="text-xs font-medium px-2 py-0.5 bg-slate-100 text-slate-700 rounded-full">{item.storeType}</span> },
    { key: 'description', label: 'Description', render: (item: any) => <span className="text-slate-400 text-sm">{item.description || '-'}</span> },
  ];

  return (
    <div className="space-y-6">
      <div><h2 className="text-xl font-bold text-slate-900">Categories</h2><p className="text-sm text-slate-500">Categories available in your store type</p></div>
      {error ? (
        <ErrorState message={error.message} onRetry={retry} />
      ) : (
        <DataTable columns={columns} data={categories} loading={loading} emptyMessage="No categories found" />
      )}
    </div>
  );
}
