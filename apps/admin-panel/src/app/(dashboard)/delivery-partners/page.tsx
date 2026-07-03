'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Truck } from 'lucide-react';
import DataTable from '@/components/DataTable';
import StatusBadge from '@/components/StatusBadge';
import { adminApi } from '@/lib/api';

export default function DeliveryPartnersPage() {
  const router = useRouter();
  const [partners, setPartners] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [confirmAction, setConfirmAction] = useState<{ id: string; action: string; name: string } | null>(null);

  useEffect(() => { loadPartners(); }, [page]);

  const loadPartners = async () => {
    setLoading(true);
    try {
      const res = await adminApi.getDeliveryPartners({ page, limit: 20, search });
      setPartners(res?.data || []);
      setTotalPages(res?.meta?.totalPages || 1);
    } catch { setPartners([]); } finally { setLoading(false); }
  };

  const handleStatusChange = async (id: string, status: string) => {
    try { await adminApi.updateDeliveryPartnerStatus(id, status); loadPartners(); setConfirmAction(null); }
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

      <DataTable columns={columns} data={partners} loading={loading} searchable searchPlaceholder="Search partners..." onSearch={(q) => { setSearch(q); setPage(1); }} page={page} totalPages={totalPages} onPageChange={setPage} onRowClick={(p) => router.push(`/delivery-partners/${p.id}`)} emptyMessage="No delivery partners found" emptyIcon={<Truck className="w-10 h-10" />} />

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
