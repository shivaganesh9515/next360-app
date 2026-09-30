'use client';

import { useState, useEffect, useRef } from 'react';
import { Package, AlertTriangle, Search, Filter } from 'lucide-react';
import DataTable from '@/components/DataTable';
import StatusBadge from '@/components/StatusBadge';
import StatsCard from '@/components/StatsCard';
import { adminApi } from '@/lib/api';

type StockFilter = 'all' | 'out_of_stock' | 'low_stock' | 'in_stock';

interface InventoryCounts { all: number; outOfStock: number; lowStock: number; inStock: number; }

export default function InventoryPage() {
  const [inventory, setInventory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [lowStockCount, setLowStockCount] = useState(0);
  const [counts, setCounts] = useState<InventoryCounts>({ all: 0, outOfStock: 0, lowStock: 0, inStock: 0 });
  const [threshold, setThreshold] = useState(10);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [stockFilter, setStockFilter] = useState<StockFilter>('all');

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(t);
  }, [search]);

  // Any change to the query re-runs the request; a request id guards against an
  // older in-flight response landing after a newer one and repainting the grid.
  const reqIdRef = useRef(0);

  useEffect(() => { loadInventory(); }, [page, stockFilter, debouncedSearch]);

  const loadInventory = async () => {
    const reqId = ++reqIdRef.current;
    setLoading(true);
    try {
      const params: any = { page, limit: 20 };
      if (stockFilter !== 'all') params.status = stockFilter;
      if (debouncedSearch.trim()) params.search = debouncedSearch.trim();
      const res = await adminApi.getInventory(params);
      if (reqId !== reqIdRef.current) return; // stale response, discard

      setInventory((Array.isArray(res) ? res : (res as any)?.data) || []);
      setTotalPages(res?.meta?.totalPages || 1);
      setThreshold(res?.meta?.threshold || 10);
      // Tab badges come from the server so they describe the whole filtered
      // scope, not just the 20 rows currently on screen.
      const c = (res as any)?.meta?.counts;
      if (c) setCounts(c);
      setLowStockCount(c?.lowStock ?? 0);
      setError('');
    } catch (e: any) {
      if (reqId !== reqIdRef.current) return;
      setInventory([]);
      setCounts({ all: 0, outOfStock: 0, lowStock: 0, inStock: 0 });
      setLowStockCount(0);
      const msg = e?.message || 'Could not load inventory';
      setError(msg);
      console.error('[inventory] load failed', e);
    } finally {
      if (reqId === reqIdRef.current) setLoading(false);
    }
  };

  /**
   * Mirrors the backend's resolveStockStatus() so the badge on a row can never
   * disagree with the bucket that row is filed under. Uses the threshold the
   * server resolved instead of the old hardcoded `|| 5` fallback.
   */
  const statusOf = (i: any): StockFilter => {
    if (i.stock <= 0) return 'out_of_stock';
    if (i.stock < (i.lowStockThreshold ?? threshold)) return 'low_stock';
    return 'in_stock';
  };

  const columns = [
    { key: 'product', label: 'Product', render: (i: any) => <span className="font-medium text-gray-800">{i.product?.name || i.name || '-'}</span> },
    { key: 'vendor', label: 'Vendor', render: (i: any) => i.vendor?.storeName || '-' },
    { key: 'sku', label: 'SKU', render: (i: any) => <span className="font-mono text-xs">{i.sku || '-'}</span> },
    { key: 'stock', label: 'Stock', render: (i: any) => (
      <span className={`font-mono font-bold ${i.stock <= 0 ? 'text-red-600' : i.stock < (i.lowStockThreshold ?? threshold) ? 'text-amber-600' : 'text-emerald-600'}`}>
        {i.stock}
      </span>
    )},
    { key: 'lowStockThreshold', label: 'Threshold', render: (i: any) => i.lowStockThreshold ?? threshold },
    { key: 'status', label: 'Status', render: (i: any) => {
      const s = statusOf(i);
      if (s === 'out_of_stock') return <StatusBadge status="OUT_OF_STOCK" />;
      if (s === 'low_stock') return <StatusBadge status="LOW_STOCK" />;
      return <StatusBadge status="IN_STOCK" />;
    }},
  ];

  const stockFilters: { key: StockFilter; label: string; count: number }[] = [
    { key: 'all', label: 'All', count: counts.all },
    { key: 'out_of_stock', label: 'Out of Stock', count: counts.outOfStock },
    { key: 'low_stock', label: 'Low Stock', count: counts.lowStock },
    { key: 'in_stock', label: 'In Stock', count: counts.inStock },
  ];

  return (
    <div className="space-y-6">
      <div><h2 className="text-xl font-bold text-gray-800">Inventory</h2><p className="text-sm text-gray-500">Monitor stock levels across all vendors</p></div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <StatsCard title="Low Stock Items" value={lowStockCount.toString()} icon={<AlertTriangle className="w-5 h-5" />} color={lowStockCount > 0 ? 'red' : 'emerald'} />
        <StatsCard title="Total SKUs" value={counts.all.toString()} icon={<Package className="w-5 h-5" />} color="blue" />
      </div>

      <div className="flex gap-3 flex-wrap items-center">
        <Search className="w-4 h-4 text-gray-400" />
        <input
          type="text"
          placeholder="Search by product, SKU, or vendor..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          className="px-3 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
        />
        <Filter className="w-4 h-4 text-gray-400 ml-2" />
        {stockFilters.map(f => (
          <button key={f.key} onClick={() => { setStockFilter(f.key); setPage(1); }}
            className={`px-3 py-1.5 text-xs rounded-lg border transition-colors ${stockFilter === f.key ? 'bg-emerald-600 text-white border-emerald-600' : 'border-gray-200 text-gray-600 hover:bg-gray-100'}`}>
            {f.label} ({f.count})
          </button>
        ))}
      </div>

      {error && (
        <div role="alert" className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">{error}</div>
      )}

      <DataTable columns={columns} data={inventory} loading={loading} page={page} totalPages={totalPages} onPageChange={setPage} emptyMessage={error || "No inventory data"} emptyIcon={<Package className="w-10 h-10" />} />
    </div>
  );
}
