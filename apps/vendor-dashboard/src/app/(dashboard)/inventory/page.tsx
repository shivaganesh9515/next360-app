'use client';

import { useState, useEffect, useRef } from 'react';
import { vendorApi } from '@/lib/api';
import DataTable from '@/components/DataTable';
import StatusBadge from '@/components/StatusBadge';

const PAGE_LIMIT = 20;
const SEARCH_DEBOUNCE_MS = 400;

export default function InventoryPage() {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [stockError, setStockError] = useState<string | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Debounce the search input so we don't fire a request per keystroke.
  const handleSearch = (q: string) => {
    setSearch(q);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setDebouncedSearch(q);
      setPage(1);
    }, SEARCH_DEBOUNCE_MS);
  };

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const res = await vendorApi.getProducts({ search: debouncedSearch || undefined, page, limit: PAGE_LIMIT });
      setProducts((Array.isArray(res) ? res : (res as any)?.data) || []);
      setTotalPages((res as any)?.meta?.totalPages || 1);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchProducts(); }, [debouncedSearch, page]); // eslint-disable-line react-hooks/exhaustive-deps

  const updateStock = async (id: string, rawValue: string, currentStock: number) => {
    setStockError(null);
    const stock = Number(rawValue);
    if (rawValue.trim() === '' || Number.isNaN(stock) || !Number.isInteger(stock)) {
      setStockError('Stock must be a whole number.');
      fetchProducts();
      return;
    }
    if (stock < 0) {
      setStockError('Stock cannot be negative.');
      fetchProducts();
      return;
    }
    if (stock === currentStock) return;
    try {
      await vendorApi.updateProduct(id, { stock });
      fetchProducts();
    }
    catch (e: any) {
      setStockError(e?.message || 'Failed to update stock.');
      fetchProducts();
    }
  };

  const columns = [
    { key: 'name', label: 'Product', render: (item: any) => (
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-slate-100 rounded-lg overflow-hidden">
          {item.images?.[0] ? <img src={item.images[0]} alt={item.name} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-slate-400 text-xs">Img</div>}
        </div>
        <span className="font-medium">{item.name}</span>
      </div>
    )},
    { key: 'sku', label: 'SKU', render: (item: any) => <span className="text-slate-400 text-sm">{item.sku || '-'}</span> },
    { key: 'stock', label: 'Current Stock', render: (item: any) => (
      <input
        type="number"
        min={0}
        step={1}
        defaultValue={item.stock}
        key={`${item.id}-${item.stock}`}
        onBlur={(e) => updateStock(item.id, e.target.value, item.stock)}
        onKeyDown={(e) => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur(); }}
        className="w-20 px-2 py-1.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
        aria-label={`Stock for ${item.name}`}
      />
    )},
    { key: 'isActive', label: 'Status', render: (item: any) => <StatusBadge status={item.isActive ? 'ACTIVE' : 'INACTIVE'} /> },
  ];

  return (
    <div className="space-y-6">
      <div><h2 className="text-xl font-bold text-slate-900">Inventory</h2><p className="text-sm text-slate-500">Manage product stock levels</p></div>
      {stockError && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600" role="alert">
          {stockError}
        </div>
      )}
      <DataTable
        columns={columns}
        data={products}
        loading={loading}
        searchable
        onSearch={handleSearch}
        page={page}
        totalPages={totalPages}
        onPageChange={setPage}
        emptyMessage={search ? `No products match "${search}"` : 'No products in inventory'}
      />
    </div>
  );
}
