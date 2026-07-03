'use client';

import { useState, useEffect } from 'react';
import { Package, AlertTriangle } from 'lucide-react';
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

  useEffect(() => { loadInventory(); }, [page]);

  const loadInventory = async () => {
    setLoading(true);
    try {
      const res = await adminApi.getInventory({ page, limit: 20 });
      setInventory(res?.data || []);
      setTotalPages(res?.meta?.totalPages || 1);
      setLowStockCount(res?.summary?.lowStockCount || 0);
    } catch { setInventory([]); } finally { setLoading(false); }
  };

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

  return (
    <div className="space-y-6">
      <div><h2 className="text-xl font-bold text-gray-800">Inventory</h2><p className="text-sm text-gray-500">Monitor stock levels across all vendors</p></div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <StatsCard title="Low Stock Items" value={lowStockCount.toString()} icon={<AlertTriangle className="w-5 h-5" />} color={lowStockCount > 0 ? 'red' : 'emerald'} />
        <StatsCard title="Total SKUs" value={inventory.length.toString()} icon={<Package className="w-5 h-5" />} color="blue" />
      </div>

      <DataTable columns={columns} data={inventory} loading={loading} page={page} totalPages={totalPages} onPageChange={setPage} emptyMessage="No inventory data" emptyIcon={<Package className="w-10 h-10" />} />
    </div>
  );
}
