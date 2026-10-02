'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Truck, AlertTriangle } from 'lucide-react';
import DataTable from '@/components/DataTable';
import StatusBadge from '@/components/StatusBadge';
import { adminApi } from '@/lib/api';

export default function DeliveryPartnersPage() {
  const router = useRouter();
  const [partners, setPartners] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [confirmAction, setConfirmAction] = useState<{ id: string; action: string; name: string } | null>(null);

  // Guards against a slow earlier response overwriting a newer one (rapid page
  // or search changes). Only the newest request may touch state.
  const requestIdRef = useRef(0);

  // `search` is a dependency so typing in the table's search box re-queries the
  // API. GET /delivery-partners does accept `search` (it filters on the
  // partner's name, email and phone), so this is a server-side search and no
  // client-side filtering is needed.
  const loadPartners = useCallback(async () => {
    const requestId = ++requestIdRef.current;
    setLoading(true);
    try {
      const res = await adminApi.getDeliveryPartners({ page, limit: 20, search });
      if (requestId !== requestIdRef.current) return;

      // After the shared normalizer the payload is the row array itself - the
      // backend's `items` key is unwrapped away, so there is nothing to read
      // off `res.items`. Assign the array directly.
      const rows = Array.isArray(res) ? res : [];
      setPartners(rows);

      // The backend paginates and returns totalPages, but the global
      // ResponseInterceptor hoists that metadata into the envelope's `meta`,
      // which the shared normalizer drops when the payload is a bare array.
      // Read it defensively: if the metadata ever survives normalization the
      // pager lights up, otherwise we stay on page 1 rather than inventing a
      // page count. normalizePayload itself is intentionally left untouched.
      const meta = (rows as any)?.meta;
      setTotalPages(meta?.totalPages ?? (rows as any)?.totalPages ?? 1);
      setError(null);
    } catch (err: any) {
      if (requestId !== requestIdRef.current) return;
      setPartners([]);
      setTotalPages(1);
      setError(err?.message || 'Could not load delivery partners.');
    } finally {
      if (requestId === requestIdRef.current) setLoading(false);
    }
  }, [page, search]);

  useEffect(() => { loadPartners(); }, [loadPartners]);

  const handleStatusChange = async (id: string, status: string) => {
    try { await adminApi.updateDeliveryPartnerStatus(id, status); await loadPartners(); setConfirmAction(null); }
    catch (err: any) { alert(err.message || 'Failed to update partner'); }
  };

  const columns = [
    { key: 'name', label: 'Name', render: (p: any) => <span className="font-medium text-gray-800">{p.name || p.user?.name || '-'}</span> },
    { key: 'email', label: 'Email', render: (p: any) => p.email || p.user?.email || '-' },
    { key: 'phone', label: 'Phone', render: (p: any) => p.phone || p.user?.phone || '-' },
    { key: 'status', label: 'Status', render: (p: any) => <StatusBadge status={p.status || 'OFFLINE'} /> },
    { key: 'zone', label: 'Zone', render: (p: any) => p.zone?.name || '-' },
    { key: 'completedDeliveries', label: 'Deliveries', render: (p: any) => p.completedDeliveries || 0 },
    { key: 'rating', label: 'Rating', render: (p: any) => p.rating ? `${p.rating.toFixed(1)} ★` : '-' },
    { key: 'actions', label: 'Actions', render: (p: any) => (
      <div className="flex gap-1">
        {p.status !== 'SUSPENDED' ? (
          <button onClick={(e) => { e.stopPropagation(); setConfirmAction({ id: p.id, action: 'SUSPENDED', name: p.name || p.user?.name }); }} className="px-2 py-1 text-xs bg-orange-100 text-orange-700 rounded hover:bg-orange-200">Suspend</button>
        ) : (
          <button onClick={(e) => { e.stopPropagation(); setConfirmAction({ id: p.id, action: 'AVAILABLE', name: p.name || p.user?.name }); }} className="px-2 py-1 text-xs bg-emerald-100 text-emerald-700 rounded hover:bg-emerald-200">Activate</button>
        )}
      </div>
    )},
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-gray-800">Delivery Partners</h2>
        <p className="text-sm text-gray-500">Manage delivery partner accounts</p>
      </div>

      {error && (
        <div className="flex items-center gap-2 px-4 py-3 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-700">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
          <button onClick={loadPartners} className="ml-auto text-amber-600 hover:text-amber-800 text-xs font-medium">
            Retry
          </button>
        </div>
      )}

      <DataTable columns={columns} data={partners} loading={loading} searchable searchPlaceholder="Search partners..." onSearch={(q) => { setSearch(q); setPage(1); }} page={page} totalPages={totalPages} onPageChange={setPage} onRowClick={(p) => router.push(`/delivery-partners/${p.id}`)} emptyMessage={error ? 'Could not load delivery partners' : 'No delivery partners found'} emptyIcon={<Truck className="w-10 h-10" />} />

      {confirmAction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-xl p-6 max-w-sm w-full mx-4 shadow-xl">
            <h3 className="text-lg font-semibold text-gray-800 mb-2">{confirmAction.action === 'SUSPENDED' ? 'Suspend' : 'Activate'} Partner</h3>
            <p className="text-sm text-gray-600 mb-6">{confirmAction.action === 'SUSPENDED' ? `Suspend ${confirmAction.name}?` : `Reactivate ${confirmAction.name}?`}</p>
            <div className="flex gap-3 justify-end">
              <button onClick={() => setConfirmAction(null)} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg">Cancel</button>
              <button onClick={() => handleStatusChange(confirmAction.id, confirmAction.action)} className={`px-4 py-2 text-sm text-white rounded-lg ${confirmAction.action === 'SUSPENDED' ? 'bg-orange-600 hover:bg-orange-700' : 'bg-emerald-600 hover:bg-emerald-700'}`}>{confirmAction.action === 'SUSPENDED' ? 'Suspend' : 'Activate'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
