'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Plus, Search, Pencil, Power, PowerOff } from 'lucide-react';
import { vendorApi } from '@/lib/api';
import DataTable from '@/components/DataTable';
import StatusBadge from '@/components/StatusBadge';

export default function ProductsPage() {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const res = await vendorApi.getProducts({ search, page, limit: 20 });
      setProducts(res.data || []);
      setTotalPages(res.meta?.totalPages || 1);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchProducts(); }, [page, search]);

  const toggleActive = async (id: string, isActive: boolean) => {
    try { await vendorApi.updateProduct(id, { isActive: !isActive }); fetchProducts(); }
    catch (e) { console.error(e); }
  };

  const columns = [
    { key: 'name', label: 'Product', render: (item: any) => (
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
          {item.images?.[0] ? <img src={item.images[0]} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">No img</div>}
        </div>
        <div>
          <p className="font-medium text-gray-800">{item.name}</p>
          <p className="text-xs text-gray-400">SKU: {item.sku || 'N/A'}</p>
        </div>
      </div>
    )},
    { key: 'price', label: 'Price', render: (item: any) => <span>₹{Number(item.price).toLocaleString()}</span> },
    { key: 'stock', label: 'Stock' },
    { key: 'isActive', label: 'Status', render: (item: any) => <StatusBadge status={item.isActive ? 'ACTIVE' : 'INACTIVE'} /> },
    { key: 'actions', label: '', render: (item: any) => (
      <div className="flex gap-2 justify-end">
        <Link href={`/products/${item.id}`} className="p-1.5 hover:bg-gray-100 rounded" title="Edit"><Pencil className="w-4 h-4 text-gray-500" /></Link>
        <button onClick={() => toggleActive(item.id, item.isActive)} className="p-1.5 hover:bg-gray-100 rounded" title={item.isActive ? 'Deactivate' : 'Activate'}>
          {item.isActive ? <PowerOff className="w-4 h-4 text-red-400" /> : <Power className="w-4 h-4 text-emerald-400" />}
        </button>
      </div>
    )},
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-800">Products</h2>
          <p className="text-sm text-gray-500">Manage your product catalog</p>
        </div>
        <Link href="/products/add" className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700 transition-colors">
          <Plus className="w-4 h-4" /> Add Product
        </Link>
      </div>
      <DataTable columns={columns} data={products} loading={loading} searchable onSearch={setSearch} page={page} totalPages={totalPages} onPageChange={setPage} emptyMessage="No products yet. Create your first product!" />
    </div>
  );
}
