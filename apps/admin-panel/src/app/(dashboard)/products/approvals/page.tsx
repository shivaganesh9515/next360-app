'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Package, CheckCircle, XCircle, Clock, ChevronDown, Eye } from 'lucide-react';
import StatusBadge from '@/components/StatusBadge';
import { adminApi } from '@/lib/api';

interface PendingProduct {
  id: string;
  name: string;
  images?: string[];
  vendor?: { id: string; storeName: string };
  category?: { name: string };
  brand?: { name: string };
  storeType: string;
  price: number;
  stock: number;
  isApproved: boolean;
  createdAt: string;
}

export default function ProductApprovalsPage() {
  const router = useRouter();
  const [products, setProducts] = useState<PendingProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [approving, setApproving] = useState(false);
  const [confirmAction, setConfirmAction] = useState<{
    type: 'single' | 'bulk';
    action: 'approve' | 'reject';
    ids: string[];
    label: string;
  } | null>(null);
  const [successMsg, setSuccessMsg] = useState('');

  const loadProducts = useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminApi.getProducts({ page, limit: 20, isApproved: false });
      // api.ts's request() already unwraps the backend's {success, data, meta} envelope
      // and returns body.data directly — so `res` is the data array, not the envelope.
      // Using res?.data would be undefined (array has no .data property).
      setProducts(Array.isArray(res) ? res : []);
      // Pagination meta is lost after the unwrap — totalPages defaults to 1.
      // See note in api.ts about this limitation across the whole admin panel.
    } catch {
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => { loadProducts(); }, [loadProducts]);

  // Reset selection when page changes
  useEffect(() => { setSelected(new Set()); }, [page]);

  const toggleSelect = (id: string) => {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selected.size === products.length && products.length > 0) {
      setSelected(new Set());
    } else {
      setSelected(new Set(products.map(p => p.id)));
    }
  };

  const handleBulkApprove = async () => {
    if (!confirmAction) return;
    setApproving(true);
    const { ids, action } = confirmAction;
    let successCount = 0;
    let failCount = 0;

    // Sequential to avoid hammering the API
    for (const id of ids) {
      try {
        if (action === 'approve') {
          // Use the correct backend endpoint: PATCH /products/:id/approve
          await adminApi.approveProduct(id);
        } else {
          // Reject: backend has no dedicated reject endpoint yet, so fall
          // back to the generic PATCH /products/:id (only works if the
          // UpdateProductDto accepts isApproved = false).
          await adminApi.updateProduct(id, { isApproved: false });
        }
        successCount++;
      } catch {
        failCount++;
      }
    }

    setApproving(false);
    setConfirmAction(null);
    setSelected(new Set());

    if (failCount > 0) {
      setSuccessMsg(`${successCount} product(s) updated, ${failCount} failed`);
    } else {
      setSuccessMsg(`${successCount} product(s) successfully ${confirmAction.action === 'approve' ? 'approved' : 'rejected'}`);
    }

    setTimeout(() => setSuccessMsg(''), 4000);
    loadProducts();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Product Approvals</h2>
          <p className="text-sm text-slate-500">
            Review and approve products submitted by vendors
          </p>
        </div>
        <div className="flex items-center gap-2 text-sm text-slate-400">
          <Clock className="w-4 h-4" />
          <span>{products.length} pending</span>
        </div>
      </div>

      {/* Success banner */}
      {successMsg && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3 flex items-center gap-2 text-sm text-emerald-700 admin-animate-in">
          <CheckCircle className="w-4 h-4 shrink-0" />
          {successMsg}
        </div>
      )}

      {/* Bulk action bar */}
      {selected.size > 0 && (
        <div className="bg-white border border-emerald-200 rounded-xl px-4 py-3 flex items-center justify-between shadow-sm">
          <p className="text-sm text-slate-700">
            <span className="font-semibold">{selected.size}</span> product(s) selected
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setConfirmAction({
                type: 'bulk', action: 'approve', ids: Array.from(selected),
                label: `Approve ${selected.size} products`,
              })}
              disabled={approving}
              className="px-4 py-1.5 text-sm bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 transition-colors flex items-center gap-1.5"
            >
              <CheckCircle className="w-3.5 h-3.5" />
              Approve Selected
            </button>
            <button
              onClick={() => setConfirmAction({
                type: 'bulk', action: 'reject', ids: Array.from(selected),
                label: `Reject ${selected.size} products`,
              })}
              disabled={approving}
              className="px-4 py-1.5 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors flex items-center gap-1.5"
            >
              <XCircle className="w-3.5 h-3.5" />
              Reject Selected
            </button>
            <button
              onClick={() => setSelected(new Set())}
              className="px-4 py-1.5 text-sm text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
            >
              Clear
            </button>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/50">
                <th className="w-10 px-3 py-3">
                  <input
                    type="checkbox"
                    checked={products.length > 0 && selected.size === products.length}
                    onChange={toggleSelectAll}
                    className="w-4 h-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                    aria-label="Select all products"
                  />
                </th>
                <th className="text-left py-3 pr-4 font-medium text-slate-500 text-xs uppercase tracking-wider">
                  Product
                </th>
                <th className="text-left py-3 pr-4 font-medium text-slate-500 text-xs uppercase tracking-wider">
                  Vendor
                </th>
                <th className="text-left py-3 pr-4 font-medium text-slate-500 text-xs uppercase tracking-wider">
                  Category
                </th>
                <th className="text-left py-3 pr-4 font-medium text-slate-500 text-xs uppercase tracking-wider">
                  Store
                </th>
                <th className="text-right py-3 pr-4 font-medium text-slate-500 text-xs uppercase tracking-wider">
                  Price
                </th>
                <th className="text-right py-3 pr-4 font-medium text-slate-500 text-xs uppercase tracking-wider">
                  Submitted
                </th>
                <th className="w-28 py-3 pr-3 font-medium text-slate-500 text-xs uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-16 text-center">
                    <div className="flex flex-col items-center gap-2 text-slate-400">
                      <div className="w-6 h-6 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin" />
                      <span className="text-sm">Loading products...</span>
                    </div>
                  </td>
                </tr>
              ) : products.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-16 text-center text-slate-400">
                    <Package className="w-10 h-10 mx-auto mb-3 opacity-40" />
                    <p className="text-sm font-medium">No products pending approval</p>
                    <p className="text-xs mt-1">All submitted products have been reviewed</p>
                  </td>
                </tr>
              ) : (
                products.map((product) => (
                  <tr
                    key={product.id}
                    className={`border-b border-slate-50 last:border-0 transition-colors ${
                      selected.has(product.id) ? 'bg-emerald-50/50' : 'hover:bg-slate-50'
                    }`}
                  >
                    <td className="px-3 py-3">
                      <input
                        type="checkbox"
                        checked={selected.has(product.id)}
                        onChange={() => toggleSelect(product.id)}
                        className="w-4 h-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                        aria-label={`Select ${product.name}`}
                      />
                    </td>
                    <td className="py-3 pr-4 cursor-pointer" onClick={() => router.push(`/products/${product.id}`)}>
                      <div className="flex items-center gap-3">
                        {product.images?.[0] ? (
                          <img src={product.images[0]} alt="" className="w-10 h-10 rounded-lg object-cover bg-slate-100" />
                        ) : (
                          <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center">
                            <Package className="w-5 h-5 text-slate-400" />
                          </div>
                        )}
                        <div>
                          <p className="font-medium text-slate-800 text-sm">{product.name}</p>
                          <p className="text-xs text-slate-400">{product.brand?.name || ''}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 pr-4 text-slate-600">
                      {product.vendor?.storeName || '-'}
                    </td>
                    <td className="py-3 pr-4 text-slate-600">
                      {product.category?.name || '-'}
                    </td>
                    <td className="py-3 pr-4">
                      <StatusBadge status={product.storeType} />
                    </td>
                    <td className="py-3 pr-4 text-right font-mono font-medium text-slate-800 tabular-nums">
                      ₹{(product.price || 0).toLocaleString('en-IN')}
                    </td>
                    <td className="py-3 pr-4 text-right text-slate-400 tabular-nums text-xs">
                      {new Date(product.createdAt).toLocaleDateString('en-IN', {
                        day: '2-digit', month: 'short', year: 'numeric',
                      })}
                    </td>
                    <td className="py-3 pr-3">
                      <div className="flex gap-1.5">
                        <button
                          onClick={(e) => { e.stopPropagation(); setConfirmAction({
                            type: 'single', action: 'approve', ids: [product.id],
                            label: product.name,
                          }); }}
                          className="px-2 py-1 text-xs bg-emerald-100 text-emerald-700 rounded-md hover:bg-emerald-200 transition-colors flex items-center gap-1"
                          title="Approve"
                        >
                          <CheckCircle className="w-3 h-3" />
                          Approve
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); setConfirmAction({
                            type: 'single', action: 'reject', ids: [product.id],
                            label: product.name,
                          }); }}
                          className="px-2 py-1 text-xs bg-red-100 text-red-700 rounded-md hover:bg-red-200 transition-colors flex items-center gap-1"
                          title="Reject"
                        >
                          <XCircle className="w-3 h-3" />
                          Reject
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); router.push(`/products/${product.id}`); }}
                          className="p-1 hover:bg-slate-100 rounded-md transition-colors"
                          title="View details"
                        >
                          <Eye className="w-3.5 h-3.5 text-slate-500" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-slate-100">
            <p className="text-sm text-slate-500">
              Page <span className="font-medium">{page}</span> of{' '}
              <span className="font-medium">{totalPages}</span>
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setPage(Math.max(1, page - 1))}
                disabled={page <= 1}
                className="px-3 py-1.5 text-sm border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-40 transition-colors"
              >
                Previous
              </button>
              <button
                onClick={() => setPage(Math.min(totalPages, page + 1))}
                disabled={page >= totalPages}
                className="px-3 py-1.5 text-sm border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-40 transition-colors"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Confirmation Dialog */}
      {confirmAction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-xl p-6 max-w-sm w-full mx-4 shadow-xl">
            {confirmAction.type === 'single' ? (
              <>
                <h3 className="text-lg font-semibold text-slate-900 mb-2">
                  {confirmAction.action === 'approve' ? 'Approve' : 'Reject'} Product
                </h3>
                <p className="text-sm text-slate-600 mb-6">
                  {confirmAction.action === 'approve'
                    ? `Approve "${confirmAction.label}"? It will become visible in the storefront.`
                    : `Reject "${confirmAction.label}"? The vendor will be notified.`}
                </p>
              </>
            ) : (
              <>
                <h3 className="text-lg font-semibold text-slate-900 mb-2">
                  Bulk {confirmAction.action === 'approve' ? 'Approve' : 'Reject'}
                </h3>
                <p className="text-sm text-slate-600 mb-6">
                  {confirmAction.action === 'approve'
                    ? `${confirmAction.ids.length} products will be approved and become visible in the storefront.`
                    : `${confirmAction.ids.length} products will be rejected. Vendors will be notified.`}
                </p>
              </>
            )}
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setConfirmAction(null)}
                disabled={approving}
                className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleBulkApprove}
                disabled={approving}
                className={`px-4 py-2 text-sm text-white rounded-lg transition-colors disabled:opacity-50 flex items-center gap-2 ${
                  confirmAction.action === 'approve'
                    ? 'bg-emerald-600 hover:bg-emerald-700'
                    : 'bg-red-600 hover:bg-red-700'
                }`}
              >
                {approving && (
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                )}
                {approving
                  ? 'Processing...'
                  : confirmAction.action === 'approve' ? 'Approve' : 'Reject'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
