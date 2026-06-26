'use client';

import { useState, useEffect } from 'react';
import { vendorApi } from '@/lib/api';
import DataTable from '@/components/DataTable';
import StatusBadge from '@/components/StatusBadge';

export default function InventoryPage() {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const res = await vendorApi.getProducts({ limit: 100 });
      setProducts(res.data || []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchProducts(); }, []);

  const updateStock = async (id: string, stock: number) => {
    try { await vendorApi.updateProduct(id, { stock }); fetchProducts(); }
    catch (e) { console.error(e); }
  };

  const columns = [
    { key: 'name', label: 'Product', render: (item: any) => (
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-gray-100 rounded-lg overflow-hidden">
          {item.images?.[0] ? <img src={item.images[0]} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">Img</div>}
        </div>
        <span className="font-medium">{item.name}</span>
      </div>
    )},
    { key: 'sku', label: 'SKU', render: (item: any) => <span className="text-gray-400 text-sm">{item.sku || '-'}</span> },
    { key: 'stock', label: 'Current Stock', render: (item: any) => (
      <input type="number" defaultValue={item.stock} onBlur={(e) => { const v = parseInt(e.target.value); if (v !== item.stock) updateStock(item.id, v); }} className="w-20 px-2 py-1 border border-gray-200 rounded text-sm" />
    )},
    { key: 'isActive', label: 'Status', render: (item: any) => <StatusBadge status={item.isActive ? 'ACTIVE' : 'INACTIVE'} /> },
  ];

  return (
    <div className="space-y-6">
      <div><h2 className="text-xl font-bold text-gray-800">Inventory</h2><p className="text-sm text-gray-500">Manage product stock levels</p></div>
      <DataTable columns={columns} data={products} loading={loading} emptyMessage="No products in inventory" />
    </div>
  );
}
