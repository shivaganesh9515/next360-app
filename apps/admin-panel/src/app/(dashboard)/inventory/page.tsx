'use client';

import { useState, useEffect } from 'react';
import { Package, AlertTriangle, Search, Filter } from 'lucide-react';
import DataTable from '@/components/DataTable';
import StatusBadge from '@/components/StatusBadge';
import StatsCard from '@/components/StatsCard';
import { adminApi } from '@/lib/api';

export default function InventoryPage() {
  const [inventory, setInventory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [lowStockCount, setLowStockCount] = useState(0);
  const [search, setSearch] = useState('');
  const [stockFilter, setStockFilter] = useState<'all' | 'out_of_stock' | 'low_stock' | 'in_stock'>('all');

  useEffect(() => { loadInventory(); }, [page, stockFilter]);

  const loadInventory = async () => {
    setLoading(true);
    try {
      const params: any = { page, limit: 20 };
      if (stockFilter !== 'all') params.status = stockFilter;
      const res = await adminApi.getInventory(params);
      setInventory(res?.data || []);
      setTotalPages(res?.meta?.totalPages || 1);
      setLowStockCount(res?.summary?.lowStockCount || 0);
    } catch { setInventory([]); } finally { setLoading(false); }
  };

  // Client-side search (product name / SKU)
  const filteredInventory = search
    ? inventory.filter(i => {
        const q = search.toLowerCase();
        return (i.product?.name || '').toLowerCase().includes(q)
          || (i.sku || '').toLowerCase().includes(q)
          || (i.vendor?.storeName || '').toLowerCase().includes(q);
      })
    : inventory;

  const columns = [
    { key: 'product', label: 'Product', render: (i: any) => <span className="font-medium text-gray-800">{i.product?.name || '-'}</span> },
    { key: 'vendor', label: 'Vendor', render: (i: any) => i.vendor?.storeName || '-' },
    { key: 'sku', label: 'SKU', render: (i: any) => <span className="font-mono text-xs">{i.sku || '-'}</span> },
    { key: 'stock', label: 'Stock', render: (i: any) => (
      <span className={`font-mono font-bold ${i.stock <= 0 ? 'text-red-600' : i.stock <= (i.lowStockThreshold || 5) ? 'text-amber-600' : 'text-emerald-600'}`}>
        {i.stock}
      </span>
    )},
    { key: 'lowStockThreshold', label: 'Threshold', render: (i: any) => i.lowStockThreshold || 5 },
    { key: 'status', label: 'Status', render: (i: any) => {
      if (i.stock <= 0) return <StatusBadge status="OUT_OF_STOCK" />;
      if (i.stock <= (i.lowStockThreshold || 5)) return <StatusBadge status="LOW_STOCK" />;
      return <StatusBadge status="IN_STOCK" />;
    }},
  ];

  const stockFilters = [
    { key: 'all' as const, label: 'All', count: inventory.length },
    { key: 'out_of_stock' as const, label: 'Out of Stock', count: inventory.filter(i => i.stock <= 0).length },
    { key: 'low_stock' as const, label: 'Low Stock', count: inventory.filter(i => i.stock > 0 && i.stock <= (i.lowStockThreshold || 5)).length },
    { key: 'in_stock' as const, label: 'In Stock', count: inventory.filter(i => i.stock > (i.lowStockThreshold || 5)).length },
  ];

  return (
    <div className="space-y-6">
      <div><h2 className="text-xl font-bold text-gray-800">Inventory</h2><p className="text-sm text-gray-500">Monitor stock levels across all vendors</p></div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <StatsCard title="Low Stock Items" value={lowStockCount.toString()} icon={<AlertTriangle className="w-5 h-5" />} color={lowStockCount > 0 ? 'red' : 'emerald'} />
        <StatsCard title="Total SKUs" value={inventory.length.toString()} icon={<Package className="w-5 h-5" />} color="blue" />
      </div>

      <div className="flex gap-3 flex-wrap items-center">
        <Search className="w-4 h-4 text-gray-400" />
        <input
          type="text"
          placeholder="Search by product, SKU, or vendor..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
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

      <DataTable columns={columns} data={filteredInventory} loading={loading} page={page} totalPages={totalPages} onPageChange={setPage} emptyMessage="No inventory data" emptyIcon={<Package className="w-10 h-10" />} />
    </div>
  );
}
