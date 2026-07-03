'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Clock, CheckCircle, XCircle } from 'lucide-react';
import DataTable from '@/components/DataTable';
import StatusBadge from '@/components/StatusBadge';
import { adminApi } from '@/lib/api';

export default function VendorApprovalsPage() {
  const router = useRouter();
  const [vendors, setVendors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [confirmAction, setConfirmAction] = useState<{ id: string; action: string; name: string } | null>(null);

  useEffect(() => { loadPendingVendors(); }, []);

  const loadPendingVendors = async () => {
    setLoading(true);
    try {
      const res = await adminApi.getVendors({ status: 'PENDING', limit: 50 });
      setVendors(res?.data || []);
    } catch { setVendors([]); } finally { setLoading(false); }
  };

  const handleStatusChange = async (id: string, status: string) => {
    try { await adminApi.updateVendorStatus(id, status); loadPendingVendors(); setConfirmAction(null); }
    catch (err: any) { alert(err.message || 'Failed to update vendor'); }
  };

  const columns = [
    { key: 'storeName', label: 'Store', render: (v: any) => <span className="font-medium text-gray-800">{v.storeName}</span> },
    { key: 'ownerName', label: 'Owner', render: (v: any) => v.ownerName || v.user?.name || '-' },
    { key: 'storeType', label: 'Type', render: (v: any) => <StatusBadge status={v.storeType} /> },
    { key: 'createdAt', label: 'Applied', render: (v: any) => new Date(v.createdAt).toLocaleDateString() },
    { key: 'actions', label: 'Actions', render: (v: any) => (
      <div className="flex gap-2">
        <button onClick={(e) => { e.stopPropagation(); setConfirmAction({ id: v.id, action: 'APPROVED', name: v.storeName }); }} className="px-3 py-1.5 text-xs bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 flex items-center gap-1">
          <CheckCircle className="w-3 h-3" /> Approve
        </button>
        <button onClick={(e) => { e.stopPropagation(); setConfirmAction({ id: v.id, action: 'REJECTED', name: v.storeName }); }} className="px-3 py-1.5 text-xs bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center gap-1">
          <XCircle className="w-3 h-3" /> Reject
        </button>
      </div>
    )},
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-gray-800">Vendor Approvals</h2>
        <p className="text-sm text-gray-500">Review and approve vendor applications</p>
      </div>

      <DataTable columns={columns} data={vendors} loading={loading} onRowClick={(v) => router.push(`/vendors/${v.id}`)} emptyMessage="No pending vendor approvals" emptyIcon={<Clock className="w-10 h-10" />} />

      {confirmAction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-xl p-6 max-w-sm w-full mx-4 shadow-xl">
            <h3 className="text-lg font-semibold text-gray-800 mb-2">{confirmAction.action === 'APPROVED' ? 'Approve' : 'Reject'} Vendor</h3>
            <p className="text-sm text-gray-600 mb-6">{confirmAction.action === 'APPROVED' ? `Approve "${confirmAction.name}"? They will be able to list products.` : `Reject "${confirmAction.name}"? They will be notified.`}</p>
            <div className="flex gap-3 justify-end">
              <button onClick={() => setConfirmAction(null)} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg">Cancel</button>
              <button onClick={() => handleStatusChange(confirmAction.id, confirmAction.action)} className={`px-4 py-2 text-sm text-white rounded-lg ${confirmAction.action === 'APPROVED' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-red-600 hover:bg-red-700'}`}>{confirmAction.action === 'APPROVED' ? 'Approve' : 'Reject'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
