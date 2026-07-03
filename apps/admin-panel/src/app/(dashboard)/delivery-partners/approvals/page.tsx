'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Clock, CheckCircle, XCircle } from 'lucide-react';
import DataTable from '@/components/DataTable';
import StatusBadge from '@/components/StatusBadge';
import { adminApi } from '@/lib/api';

export default function DeliveryPartnerApprovalsPage() {
  const router = useRouter();
  const [partners, setPartners] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [confirmAction, setConfirmAction] = useState<{ id: string; action: string; name: string } | null>(null);

  useEffect(() => { loadPending(); }, []);

  const loadPending = async () => {
    setLoading(true);
    try { const res = await adminApi.getDeliveryPartners({ status: 'PENDING', limit: 50 }); setPartners(res?.data || []); }
    catch { setPartners([]); } finally { setLoading(false); }
  };

  const handleStatus = async (id: string, status: string) => {
    try { await adminApi.updateDeliveryPartnerStatus(id, status); loadPending(); setConfirmAction(null); }
    catch (err: any) { alert(err.message); }
  };

  const columns = [
    { key: 'name', label: 'Name', render: (p: any) => <span className="font-medium text-gray-800">{p.name || p.user?.name || '-'}</span> },
    { key: 'phone', label: 'Phone', render: (p: any) => p.phone || p.user?.phone || '-' },
    { key: 'zone', label: 'Zone', render: (p: any) => p.zone?.name || '-' },
    { key: 'createdAt', label: 'Applied', render: (p: any) => new Date(p.createdAt).toLocaleDateString() },
    { key: 'actions', label: 'Actions', render: (p: any) => (
      <div className="flex gap-2">
        <button onClick={(e) => { e.stopPropagation(); setConfirmAction({ id: p.id, action: 'AVAILABLE', name: p.name || p.user?.name }); }} className="px-3 py-1.5 text-xs bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 flex items-center gap-1"><CheckCircle className="w-3 h-3" /> Approve</button>
        <button onClick={(e) => { e.stopPropagation(); setConfirmAction({ id: p.id, action: 'REJECTED', name: p.name || p.user?.name }); }} className="px-3 py-1.5 text-xs bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center gap-1"><XCircle className="w-3 h-3" /> Reject</button>
      </div>
    )},
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-gray-800">Delivery Partner Approvals</h2>
        <p className="text-sm text-gray-500">Review delivery partner applications</p>
      </div>

      <DataTable columns={columns} data={partners} loading={loading} emptyMessage="No pending approvals" emptyIcon={<Clock className="w-10 h-10" />} />

      {confirmAction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-xl p-6 max-w-sm w-full mx-4 shadow-xl">
            <h3 className="text-lg font-semibold text-gray-800 mb-2">{confirmAction.action === 'AVAILABLE' ? 'Approve' : 'Reject'} Partner</h3>
            <p className="text-sm text-gray-600 mb-6">{confirmAction.action === 'AVAILABLE' ? `Approve ${confirmAction.name}?` : `Reject ${confirmAction.name}?`}</p>
            <div className="flex gap-3 justify-end">
              <button onClick={() => setConfirmAction(null)} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg">Cancel</button>
              <button onClick={() => handleStatus(confirmAction.id, confirmAction.action)} className={`px-4 py-2 text-sm text-white rounded-lg ${confirmAction.action === 'AVAILABLE' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-red-600 hover:bg-red-700'}`}>{confirmAction.action === 'AVAILABLE' ? 'Approve' : 'Reject'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
