'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Package, Plus, Pencil, Trash2, Eye, EyeOff, CheckCircle } from 'lucide-react';
import DataTable from '@/components/DataTable';
import StatusBadge from '@/components/StatusBadge';
import { adminApi } from '@/lib/api';

export default function ProductsPage() {
  const router = useRouter();
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');
  const [storeFilter, setStoreFilter] = useState('');
  const [confirmAction, setConfirmAction] = useState<{ id: string; action: string; name: string } | null>(null);

  useEffect(() => { loadProducts(); }, [page, statusFilter, storeFilter]);

  const loadProducts = async () => {
    setLoading(true);
    try {
      const params: any = { page, limit: 20 };
      if (search) params.search = search;
      if (statusFilter) params.status = statusFilter;
      if (storeFilter) params.storeType = storeFilter;
      const res = await adminApi.getProducts(params);
      setProducts(res?.data || []);
      setTotalPages(res?.meta?.totalPages || 1);
    } catch { setProducts([]); } finally { setLoading(false); }
  };

  const handleApproval = async (id: string, isApproved: boolean) => {
    try { await adminApi.updateProductApproval(id, isApproved); loadProducts(); setConfirmAction(null); }
    catch (err: any) { alert(err.message); }
  };

  const columns = [
    { key: 'name', label: 'Product', render: (p: any) => (
      <div className="flex items-center gap-3">
        {p.images?.[0] ? <img src={p.images[0]} alt="" className="w-10 h-10 rounded-lg object-cover bg-gray-100" /> : <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center"><Package className="w-5 h-5 text-gray-400" /></div>}
        <div><p className="font-medium text-gray-800 text-sm">{p.name}</p><p className="text-xs text-gray-500">{p.brand?.name || ''}</p></div>
      </div>
    )},
    { key: 'vendor', label: 'Vendor', render: (p: any) => p.vendor?.storeName || '-' },
    { key: 'category', label: 'Category', render: (p: any) => p.category?.name || '-' },
    { key: 'storeType', label: 'Store', render: (p: any) => <StatusBadge status={p.storeType} /> },
    { key: 'price', label: 'Price', render: (p: any) => <span className="font-mono">₹{(p.price || 0).toLocaleString()}</span> },
    { key: 'stock', label: 'Stock', render: (p: any) => <span className={`font-mono ${p.stock <= 0 ? 'text-red-600' : 'text-gray-800'}`}>{p.stock || 0}</span> },
    { key: 'isApproved', label: 'Status', render: (p: any) => p.isApproved ? <StatusBadge status="ACTIVE" /> : <StatusBadge status="PENDING" /> },
    { key: 'actions', label: 'Actions', render: (p: any) => (
      <div className="flex gap-1">
        {!p.isApproved && <button onClick={(e) => { e.stopPropagation(); setConfirmAction({ id: p.id, action: 'approve', name: p.name }); }} className="px-2 py-1 text-xs bg-emerald-100 text-emerald-700 rounded hover:bg-emerald-200">Approve</button>}
        <button onClick={(e) => { e.stopPropagation(); router.push(`/products/${p.id}`); }} className="p-1.5 hover:bg-gray-100 rounded"><Eye className="w-3.5 h-3.5 text-gray-600" /></button>
      </div>
    )},
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h2 className="text-xl font-bold text-gray-800">Products</h2><p className="text-sm text-gray-500">Manage product catalog across all vendors</p></div>
      </div>

      <div className="flex gap-3 flex-wrap">
        {['', 'ORGANIC', 'NATURAL', 'ECO_FRIENDLY'].map(s => (
          <button key={s} onClick={() => { setStoreFilter(s); setPage(1); }}
            className={`px-3 py-1.5 text-xs rounded-lg border transition-colors ${storeFilter === s ? 'bg-emerald-600 text-white border-emerald-600' : 'border-gray-200 text-gray-600 hover:bg-gray-100'}`}>
            {s || 'All Stores'}
          </button>
        ))}
      </div>

      <DataTable columns={columns} data={products} loading={loading} searchable searchPlaceholder="Search products..." onSearch={(q) => { setSearch(q); setPage(1); }} page={page} totalPages={totalPages} onPageChange={setPage} onRowClick={(p) => router.push(`/products/${p.id}`)} emptyMessage="No products found" emptyIcon={<Package className="w-10 h-10" />} />

      {confirmAction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-xl p-6 max-w-sm w-full mx-4 shadow-xl">
            <h3 className="text-lg font-semibold text-gray-800 mb-2">Approve Product</h3>
            <p className="text-sm text-gray-600 mb-6">Approve "{confirmAction.name}"? It will become visible to customers.</p>
            <div className="flex gap-3 justify-end">
              <button onClick={() => setConfirmAction(null)} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg">Cancel</button>
              <button onClick={() => handleApproval(confirmAction.id, true)} className="px-4 py-2 text-sm bg-emerald-600 text-white rounded-lg hover:bg-emerald-700">Approve</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
