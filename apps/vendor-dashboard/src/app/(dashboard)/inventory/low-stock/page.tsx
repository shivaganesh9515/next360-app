'use client';

import { useState, useEffect } from 'react';
import { Package, RefreshCw } from 'lucide-react';
import { vendorApi } from '@/lib/api';

export default function LowStockPage() {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const res = await vendorApi.getProducts({ limit: 100 });
      const all = res.data || [];
      setProducts(all.filter((p: any) => p.stock <= 5 && p.isActive));
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchProducts(); }, []);

  const restock = async (id: string, currentStock: number) => {
    try { await vendorApi.updateProduct(id, { stock: currentStock + 50 }); fetchProducts(); }
    catch (e) { console.error(e); }
  };

  if (loading) return <div className="text-center py-12 text-gray-500">Loading...</div>;

  if (products.length === 0) return (
    <div className="text-center py-16">
      <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
        <Package className="w-8 h-8 text-emerald-600" />
      </div>
      <h3 className="text-lg font-semibold text-gray-800 mb-1">All products are well-stocked!</h3>
      <p className="text-sm text-gray-500">No low stock alerts at the moment.</p>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h2 className="text-xl font-bold text-gray-800">Low Stock Alerts</h2><p className="text-sm text-gray-500">{products.length} product(s) running low</p></div>
        <button onClick={fetchProducts} className="flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50"><RefreshCw className="w-4 h-4" /> Refresh</button>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {products.map((p: any) => (
          <div key={p.id} className="bg-white rounded-xl border border-gray-200 p-4">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 bg-amber-50 rounded-lg overflow-hidden flex-shrink-0">
                {p.images?.[0] ? <img src={p.images[0]} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-amber-400 text-sm">📦</div>}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-800 text-sm truncate">{p.name}</p>
                <p className="text-xs text-gray-400">SKU: {p.sku || 'N/A'}</p>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <span className="text-2xl font-bold text-red-500">{p.stock}</span>
                <span className="text-sm text-gray-400 ml-1">in stock</span>
              </div>
              <button onClick={() => restock(p.id, p.stock)} className="px-3 py-1.5 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700">Restock</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
