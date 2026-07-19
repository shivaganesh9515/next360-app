'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Plus, Pencil, Power, PowerOff, Check, X, DollarSign, AlertTriangle } from 'lucide-react';
import { vendorApi } from '@/lib/api';
import DataTable from '@/components/DataTable';
import StatusBadge from '@/components/StatusBadge';

export default function ProductsPage() {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Selection state
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [selectAll, setSelectAll] = useState(false);

  // Bulk action state
  const [bulkProcessing, setBulkProcessing] = useState(false);
  const [showPriceModal, setShowPriceModal] = useState(false);
  const [bulkPrice, setBulkPrice] = useState('');
  const [bulkResult, setBulkResult] = useState<{ success: number; failed: number } | null>(null);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const res = await vendorApi.getProducts({ search, page, limit: 20 });
      setProducts((Array.isArray(res) ? res : (res as any)?.data) || []);
      setTotalPages(res.meta?.totalPages || 1);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchProducts(); }, [page, search]);

  // Reset selection when page changes or products list changes
  useEffect(() => {
    setSelectedIds(new Set());
    setSelectAll(false);
  }, [page, search]);

  const toggleProductSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectAll) {
      setSelectedIds(new Set());
      setSelectAll(false);
    } else {
      setSelectedIds(new Set(products.map((p) => p.id)));
      setSelectAll(true);
    }
  };

  const toggleActive = async (id: string, isActive: boolean) => {
    try { await vendorApi.updateProduct(id, { isActive: !isActive }); fetchProducts(); }
    catch (e) { console.error(e); }
  };

  const executeBulkAction = async (action: 'activate' | 'deactivate' | 'price') => {
    if (selectedIds.size === 0) return;
    if (action === 'price') {
      setShowPriceModal(true);
      setBulkPrice('');
      return;
    }

    setBulkProcessing(true);
    setBulkResult(null);
    let success = 0;
    let failed = 0;

    const isActive = action === 'activate';
    const ids = Array.from(selectedIds);

    for (const id of ids) {
      try {
        await vendorApi.updateProduct(id, { isActive });
        success++;
      } catch (e) {
        failed++;
        console.error(`Failed to ${action} product ${id}:`, e);
      }
    }

    setBulkResult({ success, failed });
    setBulkProcessing(false);
    setSelectedIds(new Set());
    setSelectAll(false);
    fetchProducts();

    // Auto-dismiss result after 4 seconds
    setTimeout(() => setBulkResult(null), 4000);
  };

  const submitBulkPrice = async () => {
    const price = Number(bulkPrice);
    if (isNaN(price) || price < 0) return;

    setShowPriceModal(false);
    setBulkProcessing(true);
    setBulkResult(null);

    let success = 0;
    let failed = 0;
    const ids = Array.from(selectedIds);

    for (const id of ids) {
      try {
        await vendorApi.updateProduct(id, { price });
        success++;
      } catch (e) {
        failed++;
        console.error(`Failed to update price for product ${id}:`, e);
      }
    }

    setBulkResult({ success, failed });
    setBulkProcessing(false);
    setSelectedIds(new Set());
    setSelectAll(false);
    fetchProducts();

    setTimeout(() => setBulkResult(null), 4000);
  };

  const columns = [
    {
      key: 'select',
      label: (
        <input
          type="checkbox"
          checked={selectAll && products.length > 0}
          onChange={toggleSelectAll}
          className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
        />
      ),
      render: (item: any) => (
        <input
          type="checkbox"
          checked={selectedIds.has(item.id)}
          onChange={() => toggleProductSelect(item.id)}
          onClick={(e) => e.stopPropagation()}
          className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
        />
      ),
    },
    { key: 'name', label: 'Product', render: (item: any) => (
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-slate-100 rounded-lg overflow-hidden flex-shrink-0">
          {item.images?.[0] ? <img src={item.images[0]} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-slate-400 text-xs">No img</div>}
        </div>
        <div>
          <p className="font-medium text-slate-800">{item.name}</p>
          <p className="text-xs text-slate-400">SKU: {item.sku || 'N/A'}</p>
        </div>
      </div>
    )},
    { key: 'price', label: 'Price', render: (item: any) => <span>₹{Number(item.price).toLocaleString()}</span> },
    { key: 'stock', label: 'Stock' },
    { key: 'isActive', label: 'Status', render: (item: any) => <StatusBadge status={item.isActive ? 'ACTIVE' : 'INACTIVE'} /> },
    { key: 'actions', label: '', render: (item: any) => (
      <div className="flex gap-2 justify-end">
        <Link href={`/products/${item.id}`} className="p-1.5 hover:bg-slate-100 rounded-md" title="Edit"><Pencil className="w-4 h-4 text-slate-500" /></Link>
        <button onClick={() => toggleActive(item.id, item.isActive)} className="p-1.5 hover:bg-slate-100 rounded-md" title={item.isActive ? 'Deactivate' : 'Activate'}>
          {item.isActive ? <PowerOff className="w-4 h-4 text-red-400" /> : <Power className="w-4 h-4 text-emerald-400" />}
        </button>
      </div>
    )},
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Products</h2>
          <p className="text-sm text-slate-500">Manage your product catalog</p>
        </div>
        <Link href="/products/add" className="inline-flex items-center gap-2 px-4 py-2.5 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700 transition-colors shadow-sm">
          <Plus className="w-4 h-4" /> Add Product
        </Link>
      </div>

      {/* Bulk action toolbar */}
      {selectedIds.size > 0 && (
        <div className="flex items-center justify-between bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3">
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium text-emerald-800">{selectedIds.size} selected</span>
            <button
              onClick={() => { setSelectedIds(new Set()); setSelectAll(false); }}
              className="text-xs text-slate-500 hover:text-slate-700 underline"
            >
              Clear selection
            </button>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => executeBulkAction('activate')}
              disabled={bulkProcessing}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 text-white rounded-lg text-xs font-medium hover:bg-emerald-700 disabled:opacity-50 transition-colors"
            >
              <Check className="w-3.5 h-3.5" /> Activate
            </button>
            <button
              onClick={() => executeBulkAction('deactivate')}
              disabled={bulkProcessing}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-red-300 text-red-600 rounded-lg text-xs font-medium hover:bg-red-50 disabled:opacity-50 transition-colors"
            >
              <X className="w-3.5 h-3.5" /> Deactivate
            </button>
            <button
              onClick={() => executeBulkAction('price')}
              disabled={bulkProcessing}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-slate-300 text-slate-700 rounded-lg text-xs font-medium hover:bg-slate-50 disabled:opacity-50 transition-colors"
            >
              <DollarSign className="w-3.5 h-3.5" /> Update Price
            </button>
          </div>
        </div>
      )}

      {/* Bulk processing indicator */}
      {bulkProcessing && (
        <div className="flex items-center gap-2 text-sm text-slate-500 px-1">
          <div className="w-4 h-4 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
          Processing {selectedIds.size} products...
        </div>
      )}

      {/* Bulk result banner */}
      {bulkResult && (
        <div className={`px-4 py-2.5 rounded-xl text-sm flex items-center gap-2 ${
          bulkResult.failed === 0
            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
            : 'bg-amber-50 text-amber-700 border border-amber-200'
        }`}>
          {bulkResult.failed === 0 ? (
            <><Check className="w-4 h-4" /> Successfully updated {bulkResult.success} product{bulkResult.success !== 1 ? 's' : ''}</>
          ) : (
            <><AlertTriangle className="w-4 h-4" /> Updated {bulkResult.success}, {bulkResult.failed} failed</>
          )}
        </div>
      )}

      <DataTable columns={columns} data={products} loading={loading} searchable onSearch={setSearch} page={page} totalPages={totalPages} onPageChange={setPage} emptyMessage="No products yet. Create your first product!" />

      {/* Price Update Modal */}
      {showPriceModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowPriceModal(false)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm mx-4 p-6" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-emerald-600" />
                <h3 className="text-lg font-semibold text-slate-900">Bulk Price Update</h3>
              </div>
              <button onClick={() => setShowPriceModal(false)} autoFocus className="p-1 hover:bg-slate-100 rounded-md transition-colors">
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>
            <p className="text-sm text-slate-500 mb-4">
              Set a new price for all <span className="font-semibold text-slate-700">{selectedIds.size} selected</span> products.
            </p>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-400 font-medium">₹</span>
              <input
                type="number"
                value={bulkPrice}
                onChange={(e) => setBulkPrice(e.target.value)}
                placeholder="Enter new price"
                min={0}
                step={0.01}
                className="w-full pl-8 pr-4 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent"
              />
            </div>
            <div className="flex gap-3 mt-5">
              <button
                onClick={() => setShowPriceModal(false)}
                className="flex-1 px-4 py-2.5 border border-slate-200 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={submitBulkPrice}
                disabled={!bulkPrice || isNaN(Number(bulkPrice)) || Number(bulkPrice) < 0}
                className="flex-1 px-4 py-2.5 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700 disabled:opacity-50 transition-colors"
              >
                Update Price
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
