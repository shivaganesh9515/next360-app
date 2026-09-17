'use client';

import { useState, useEffect } from 'react';
import { Package, RefreshCw, RotateCcw } from 'lucide-react';
import { vendorApi } from '@/lib/api';

export default function LowStockPage() {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchProducts = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await vendorApi.getProducts({ limit: 100 });
      // Backend double-nests: { data: { data: [...], meta: {...} } }
      const all = Array.isArray(res) ? res
        : Array.isArray((res as any)?.data) ? (res as any).data
        : Array.isArray((res as any)?.data?.data) ? (res as any).data.data : [];
      setProducts(all.filter((p: any) => p.stock <= 5 && p.isActive));
    } catch (e) {
      setError(e instanceof Error ? e : new Error(String(e)));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchProducts(); }, []);

  const restock = async (id: string, currentStock: number) => {
    try { await vendorApi.updateProduct(id, { stock: currentStock + 50 }); fetchProducts(); }
    catch (e) { console.error(e); }
  };

  if (loading) return (
    <div className="space-y-4" role="status" aria-label="Loading low stock alerts">
      <div className="h-8 w-48 bg-slate-200 rounded animate-pulse" />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-32 bg-slate-100 rounded-xl animate-pulse" />
        ))}
      </div>
      <span className="sr-only">Loading low stock alerts...</span>
    </div>
  );

  if (error) return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h2 className="text-xl font-bold text-slate-900">Low Stock Alerts</h2></div>
      </div>
      <div className="flex flex-col items-center justify-center py-16 text-center bg-white rounded-xl border border-slate-200" role="alert">
        <div className="w-11 h-11 rounded-full bg-rose-50 flex items-center justify-center mb-3">
          <Package className="w-5 h-5 text-rose-500" aria-hidden="true" />
        </div>
        <p className="text-sm font-medium text-slate-700">Couldn&apos;t load stock data</p>
        <p className="text-xs text-slate-400 mt-1 max-w-xs">{error.message}</p>
        <button
          type="button"
          onClick={fetchProducts}
          className="mt-4 inline-flex items-center gap-1.5 px-3.5 py-2 text-sm font-medium text-emerald-700 bg-emerald-50 rounded-lg hover:bg-emerald-100 transition-colors duration-150"
        >
          <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
          Retry
        </button>
      </div>
    </div>
  );

  if (products.length === 0) return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h2 className="text-xl font-bold text-slate-900">Low Stock Alerts</h2><p className="text-sm text-slate-500">Products running low on inventory</p></div>
        <button onClick={fetchProducts} className="inline-flex items-center gap-2 px-3 py-2 border border-slate-200 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors"><RefreshCw className="w-4 h-4" /> Refresh</button>
      </div>
      <div className="text-center py-16 bg-white rounded-xl border border-slate-200">
        <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Package className="w-8 h-8 text-emerald-600" />
        </div>
        <h3 className="text-lg font-semibold text-slate-900 mb-1">All products are well-stocked!</h3>
        <p className="text-sm text-slate-500">No low stock alerts at the moment.</p>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h2 className="text-xl font-bold text-slate-900">Low Stock Alerts</h2><p className="text-sm text-slate-500">{products.length} product(s) running low</p></div>
        <button onClick={fetchProducts} className="inline-flex items-center gap-2 px-3 py-2 border border-slate-200 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors"><RefreshCw className="w-4 h-4" /> Refresh</button>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {products.map((p: any) => (
          <div key={p.id} className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 bg-amber-50 rounded-lg overflow-hidden flex-shrink-0">
                {p.images?.[0] ? <img src={p.images[0]} className="w-full h-full object-cover" alt={p.name} /> : <div className="w-full h-full flex items-center justify-center text-amber-400 text-sm">📦</div>}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-slate-900 text-sm truncate">{p.name}</p>
                <p className="text-xs text-slate-400">SKU: {p.sku || 'N/A'}</p>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <span className="text-2xl font-bold text-red-500">{p.stock}</span>
                <span className="text-sm text-slate-400 ml-1">in stock</span>
              </div>
              <button onClick={() => restock(p.id, p.stock)} className="px-3 py-1.5 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700">Restock</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
