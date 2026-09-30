'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Store, Loader2, CheckCheck, ShieldCheck, X } from 'lucide-react';
import DataTable from '@/components/DataTable';
import StatusBadge from '@/components/StatusBadge';
import { adminApi } from '@/lib/api';

export default function VendorsPage() {
  const router = useRouter();
  const [vendors, setVendors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [confirmAction, setConfirmAction] = useState<{ id: string; action: string; label: string } | null>(null);
  const [processing, setProcessing] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkConfirmAction, setBulkConfirmAction] = useState<'APPROVED' | 'REJECTED' | null>(null);
  const [bulkProcessing, setBulkProcessing] = useState(false);
  const [bulkDeliveryOpen, setBulkDeliveryOpen] = useState(false);
  const [bulkDeliveryMin, setBulkDeliveryMin] = useState('10');
  const [bulkDeliveryMax, setBulkDeliveryMax] = useState('20');
  const [bulkDeliveryLabel, setBulkDeliveryLabel] = useState('');
  const [error, setError] = useState<string | null>(null);

  // Tab labels, the stored enum value, and anything a caller passes are folded
  // to the same shape before comparison, so casing/spacing differences between
  // the tab key and the record can never silently fail the match.
  const normalizeStatus = (s: string) => (s || '').trim().toUpperCase().replace(/[\s-]+/g, '_');

  const statusLabels: Record<string, string> = {
    ALL: 'All',
    PENDING: 'Pending',
    APPROVED: 'Approved',
    REJECTED: 'Rejected',
    SUSPENDED: 'Suspended',
  };

  // Guards against out-of-order responses: switching tabs or typing in the
  // search box fires a request per keystroke, and without this a slower earlier
  // response can land last and overwrite the table with rows for the previous
  // filter — which is what made the status tabs look like they "didn't work".
  const requestId = useRef(0);

  // `search` is a dependency: it previously wasn't, so typing in the search box
  // only ever took effect once the page or status filter happened to change.
  useEffect(() => {
    loadVendors();
  }, [page, statusFilter, search]);

  const loadVendors = async () => {
    const id = ++requestId.current;
    setLoading(true);
    try {
      // "All" is expressed by omitting `status` entirely — the backend also
      // accepts status=ALL, but sending nothing is unambiguous.
      const params: any = { page, limit: 20 };
      if (statusFilter !== 'ALL') params.status = statusFilter;
      if (search) params.search = search;
      const res = await adminApi.getVendors(params);
      if (id !== requestId.current) return;
      const list: any[] = (Array.isArray(res) ? res : (res as any)?.data) || [];
      // The API filters by status server-side. This guard means a selected tab
      // can never display another status's vendors. It is a no-op on a
      // correctly filtered response, and `list` is passed through for ALL.
      const rows = statusFilter === 'ALL'
        ? list
        : list.filter((v) => normalizeStatus(v.status) === normalizeStatus(statusFilter));
      setVendors(rows);
      setTotalPages(res?.meta?.totalPages || 1);
      setError(null);
    } catch (err: any) {
      // Kept separate from "no vendors": a failed request used to be reported as
      // an empty table, which made a 400 from the API indistinguishable from a
      // genuinely empty result and hid the real cause.
      if (id === requestId.current) {
        setVendors([]);
        setTotalPages(1);
        setError(err?.message || 'Failed to load vendors');
      }
    } finally {
      if (id === requestId.current) setLoading(false);
    }
  };

  const handleStatusChange = async (id: string, status: string) => {
    setProcessing(true);
    try {
      await adminApi.updateVendorStatus(id, status);
      await loadVendors();
      setConfirmAction(null);
    } catch (err: any) {
      alert(err.message || 'Failed to update vendor');
    } finally {
      setProcessing(false);
    }
  };

  const allSelected = vendors.length > 0 && vendors.every((v) => selectedIds.has(v.id));
  const someSelected = selectedIds.size > 0;

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (allSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(vendors.map((v) => v.id)));
    }
  };

  const clearSelection = () => setSelectedIds(new Set());

  const handleBulkDeliverySave = async () => {
    const min = parseInt(bulkDeliveryMin, 10);
    const max = parseInt(bulkDeliveryMax, 10);
    if (!min || !max || min >= max || min < 1 || max > 180) {
      alert('Please enter valid delivery times (min < max, 1-180 mins).');
      return;
    }
    setBulkProcessing(true);
    const ids = Array.from(selectedIds);
    let successCount = 0;
    let failCount = 0;
    for (const id of ids) {
      try {
        await adminApi.updateVendor(id, {
          deliveryTimeMin: min,
          deliveryTimeMax: max,
          deliveryLabel: bulkDeliveryLabel || null,
        });
        successCount++;
      } catch {
        failCount++;
      }
    }
    setBulkDeliveryOpen(false);
    setSelectedIds(new Set());
    await loadVendors();
    setBulkProcessing(false);
    if (failCount > 0) {
      alert(`Delivery times updated for ${successCount} vendor(s), ${failCount} failed.`);
    }
  };

  const handleBulkAction = async (action: 'APPROVED' | 'REJECTED') => {
    setBulkProcessing(true);
    const ids = Array.from(selectedIds);
    let successCount = 0;
    let failCount = 0;
    for (const id of ids) {
      try {
        await adminApi.updateVendorStatus(id, action);
        successCount++;
      } catch {
        failCount++;
      }
    }
    setBulkConfirmAction(null);
    setSelectedIds(new Set());
    await loadVendors();
    setBulkProcessing(false);
    if (failCount > 0) {
      alert(`${successCount} vendor(s) ${action === 'APPROVED' ? 'approved' : 'rejected'}, ${failCount} failed.`);
    }
  };

  const columns = [
    {
      key: 'select',
      label: '',
      headerRender: () => (
        <input
          type="checkbox"
          checked={allSelected}
          onChange={toggleSelectAll}
          className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
          aria-label={allSelected ? 'Deselect all' : 'Select all'}
        />
      ),
      render: (v: any) => (
        <input
          type="checkbox"
          checked={selectedIds.has(v.id)}
          onChange={(e) => { e.stopPropagation(); toggleSelect(v.id); }}
          onClick={(e) => e.stopPropagation()}
          className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
          aria-label={`Select ${v.storeName || v.name}`}
        />
      ),
    },
    { key: 'storeName', label: 'Store Name', render: (v: any) => (
      <span className="font-medium text-gray-800">{v.storeName}</span>
    )},
    { key: 'ownerName', label: 'Owner', render: (v: any) => v.ownerName || v.user?.name || '-' },
    { key: 'email', label: 'Email', render: (v: any) => v.email || v.user?.email || '-' },
    { key: 'storeType', label: 'Store Type', render: (v: any) => <StatusBadge status={v.storeType} /> },
    { key: 'delivery', label: 'Delivery', render: (v: any) => {
      const min = v.deliveryTimeMin;
      const max = v.deliveryTimeMax;
      const label = v.deliveryLabel;
      if (min == null || max == null) return <span className="text-gray-400 text-xs">—</span>;
      return (
        <span className="text-sm text-gray-700">
          {min}-{max} min{label ? <span className="text-gray-400"> • {label}</span> : ''}
        </span>
      );
    }},
    { key: 'status', label: 'Status', render: (v: any) => <StatusBadge status={v.status} /> },
    { key: 'kycStatus', label: 'KYC', render: (v: any) => <StatusBadge status={v.kycStatus || 'INCOMPLETE'} /> },
    { key: 'productsCount', label: 'Products', render: (v: any) => v._count?.products || v.productsCount || 0 },
    { key: 'createdAt', label: 'Joined', render: (v: any) => new Date(v.createdAt).toLocaleDateString() },
    { key: 'actions', label: 'Actions', render: (v: any) => (
      <div className="flex gap-1">
        <button
          onClick={(e) => { e.stopPropagation(); router.push(`/vendors/${v.id}`); }}
          className="inline-flex items-center gap-1 px-2 py-1 text-xs bg-blue-50 text-blue-700 rounded hover:bg-blue-100"
          title="Review uploaded KYC documents"
        >
          <ShieldCheck className="w-3 h-3" /> Review KYC
        </button>
        {v.status === 'PENDING' && (
          <>
            <button
              onClick={(e) => { e.stopPropagation(); setConfirmAction({ id: v.id, action: 'APPROVED', label: 'Approve' }); }}
              className="px-2 py-1 text-xs bg-emerald-100 text-emerald-700 rounded hover:bg-emerald-200"
            >
              Approve
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); setConfirmAction({ id: v.id, action: 'REJECTED', label: 'Reject' }); }}
              className="px-2 py-1 text-xs bg-red-100 text-red-700 rounded hover:bg-red-200"
            >
              Reject
            </button>
          </>
        )}
        {v.status === 'APPROVED' && (
          <button
            onClick={(e) => { e.stopPropagation(); setConfirmAction({ id: v.id, action: 'SUSPENDED', label: 'Suspend' }); }}
            className="px-2 py-1 text-xs bg-orange-100 text-orange-700 rounded hover:bg-orange-200"
          >
            Suspend
          </button>
        )}
        {v.status === 'SUSPENDED' && (
          <button
            onClick={(e) => { e.stopPropagation(); setConfirmAction({ id: v.id, action: 'APPROVED', label: 'Reactivate' }); }}
            className="px-2 py-1 text-xs bg-emerald-100 text-emerald-700 rounded hover:bg-emerald-200"
          >
            Reactivate
          </button>
        )}
      </div>
    )},
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-800">Vendors</h2>
          <p className="text-sm text-gray-500">Manage all vendor accounts and approvals</p>
        </div>
      </div>

      <div className="flex gap-2 flex-wrap">
        {['ALL', 'PENDING', 'APPROVED', 'REJECTED', 'SUSPENDED'].map((s) => (
          <button
            key={s}
            onClick={() => { setStatusFilter(s); setPage(1); }}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              statusFilter === s ? 'bg-emerald-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {statusLabels[s] || s}
          </button>
        ))}
      </div>

      {someSelected && !loading && (
        <div className="flex items-center gap-3 px-4 py-2.5 bg-emerald-50 border border-emerald-200 rounded-lg">
          <span className="text-sm font-medium text-emerald-800">
            {selectedIds.size} vendor{selectedIds.size !== 1 ? 's' : ''} selected
          </span>
          <div className="flex-1" />
          <button
            onClick={() => setBulkDeliveryOpen(true)}
            disabled={bulkProcessing}
            className="px-3 py-1.5 text-xs bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-60 flex items-center gap-1.5"
          >
            🕐 Set Delivery
          </button>
          <button
            onClick={() => setBulkConfirmAction('APPROVED')}
            disabled={bulkProcessing}
            className="px-3 py-1.5 text-xs bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-60 flex items-center gap-1.5"
          >
            <CheckCheck className="w-3.5 h-3.5" />
            {bulkProcessing ? 'Approving...' : 'Approve All'}
          </button>
          <button
            onClick={() => setBulkConfirmAction('REJECTED')}
            disabled={bulkProcessing}
            className="px-3 py-1.5 text-xs bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-60 flex items-center gap-1.5"
          >
            <X className="w-3.5 h-3.5" />
            {bulkProcessing ? 'Rejecting...' : 'Reject All'}
          </button>
          <button
            onClick={clearSelection}
            disabled={bulkProcessing}
            className="px-3 py-1.5 text-xs text-gray-600 hover:bg-gray-200 rounded-lg disabled:opacity-50"
          >
            Clear
          </button>
        </div>
      )}

      <DataTable
        columns={columns}
        data={vendors}
        loading={loading}
        searchable
        searchPlaceholder="Search vendors by name, email..."
        onSearch={(q) => { setSearch(q); setPage(1); }}
        page={page}
        totalPages={totalPages}
        onPageChange={setPage}
        onRowClick={(v) => router.push(`/vendors/${v.id}`)}
        emptyMessage={
          error ? (
            <>
              <p className="text-red-600">{error}</p>
              <p className="text-xs text-gray-400 mt-1">Please try again.</p>
            </>
          ) : (
            <>
              <p>No vendors found</p>
              <p className="text-xs text-gray-400 mt-1">Vendors will appear here once they register.</p>
            </>
          )
        }
        emptyIcon={<Store className="w-10 h-10" />}
      />

      {confirmAction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-xl p-6 max-w-sm w-full mx-4 shadow-xl">
            <h3 className="text-lg font-semibold text-gray-800 mb-2">Confirm {confirmAction.label}</h3>
            <p className="text-sm text-gray-600 mb-6">
              Are you sure you want to {confirmAction.label.toLowerCase()} this vendor?
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setConfirmAction(null)}
                className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={() => handleStatusChange(confirmAction.id, confirmAction.action)}
                disabled={processing}
                className={`px-4 py-2 text-sm text-white rounded-lg flex items-center gap-2 disabled:opacity-60 ${
                  confirmAction.action === 'APPROVED' ? 'bg-emerald-600 hover:bg-emerald-700' :
                  confirmAction.action === 'REJECTED' ? 'bg-red-600 hover:bg-red-700' :
                  'bg-orange-600 hover:bg-orange-700'
                }`}
              >
                {processing && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                {processing ? `${confirmAction.label}ing...` : confirmAction.label}
              </button>
            </div>
          </div>
        </div>
      )}

      {bulkDeliveryOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4 shadow-xl">
            <h3 className="text-lg font-semibold text-gray-800 mb-1">
              Set Delivery Time — {selectedIds.size} Vendor{selectedIds.size !== 1 ? 's' : ''}
            </h3>
            <p className="text-sm text-gray-500 mb-5">
              Update delivery estimates for all selected vendors.
            </p>

            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Min (mins)</label>
                <input
                  type="number"
                  min={1}
                  max={120}
                  value={bulkDeliveryMin}
                  onChange={(e) => setBulkDeliveryMin(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Max (mins)</label>
                <input
                  type="number"
                  min={1}
                  max={180}
                  value={bulkDeliveryMax}
                  onChange={(e) => setBulkDeliveryMax(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-xs font-medium text-gray-600 mb-1">Label (optional)</label>
              <input
                type="text"
                value={bulkDeliveryLabel}
                onChange={(e) => setBulkDeliveryLabel(e.target.value)}
                placeholder="e.g. Farm Direct, Handcrafted"
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div className="bg-blue-50 border border-blue-100 rounded-lg px-3 py-2 mb-5">
              <p className="text-xs text-blue-700 font-medium">
                Preview: {bulkDeliveryMin || '?'}-{bulkDeliveryMax || '?'} min{bulkDeliveryLabel ? ` • ${bulkDeliveryLabel}` : ''}
              </p>
            </div>

            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setBulkDeliveryOpen(false)}
                disabled={bulkProcessing}
                className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={handleBulkDeliverySave}
                disabled={bulkProcessing}
                className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-60 flex items-center gap-2"
              >
                {bulkProcessing && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                {bulkProcessing ? 'Saving...' : 'Save to All'}
              </button>
            </div>
          </div>
        </div>
      )}

      {bulkConfirmAction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-xl p-6 max-w-sm w-full mx-4 shadow-xl">
            <h3 className="text-lg font-semibold text-gray-800 mb-2">
              {bulkConfirmAction === 'APPROVED' ? 'Approve' : 'Reject'} {selectedIds.size} Vendor{selectedIds.size !== 1 ? 's' : ''}
            </h3>
            <p className="text-sm text-gray-600 mb-6">
              Are you sure you want to {bulkConfirmAction === 'APPROVED' ? 'approve' : 'reject'} {selectedIds.size} selected vendor{selectedIds.size !== 1 ? 's' : ''}?
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setBulkConfirmAction(null)}
                disabled={bulkProcessing}
                className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={() => handleBulkAction(bulkConfirmAction)}
                disabled={bulkProcessing}
                className={`px-4 py-2 text-sm text-white rounded-lg flex items-center gap-2 disabled:opacity-60 ${
                  bulkConfirmAction === 'APPROVED' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-red-600 hover:bg-red-700'
                }`}
              >
                {bulkProcessing && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                {bulkProcessing
                  ? `${bulkConfirmAction === 'APPROVED' ? 'Approving' : 'Rejecting'}...`
                  : bulkConfirmAction === 'APPROVED' ? 'Approve All' : 'Reject All'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
