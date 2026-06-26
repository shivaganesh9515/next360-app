'use client';

import { useState, useEffect } from 'react';
import { vendorApi } from '@/lib/api';
import DataTable from '@/components/DataTable';

export default function CategoriesPage() {
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    vendorApi.getCategories({}).then((res: any) => {
      setCategories(Array.isArray(res) ? res : res.data || []);
    }).catch(console.error).finally(() => setLoading(false));
  }, []);

  const columns = [
    { key: 'name', label: 'Category' },
    { key: 'slug', label: 'Slug' },
    { key: 'storeType', label: 'Store Type', render: (item: any) => <span className="text-xs font-medium px-2 py-0.5 bg-gray-100 rounded">{item.storeType}</span> },
    { key: 'description', label: 'Description', render: (item: any) => <span className="text-gray-400 text-sm">{item.description || '-'}</span> },
  ];

  return (
    <div className="space-y-6">
      <div><h2 className="text-xl font-bold text-gray-800">Categories</h2><p className="text-sm text-gray-500">Categories available in your store type</p></div>
      <DataTable columns={columns} data={categories} loading={loading} emptyMessage="No categories found" />
    </div>
  );
}
