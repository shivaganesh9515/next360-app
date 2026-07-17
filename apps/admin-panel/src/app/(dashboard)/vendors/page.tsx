'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Store, Plus, Filter } from 'lucide-react';
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

  useEffect(() => {
    loadVendors();
  }, [page, statusFilter]);

  const loadVendors = async () => {
    setLoading(true);
    try {
      const params: any = { page, limit: 20 };
      if (statusFilter !== 'ALL') params.status = statusFilter;
      if (search) params.search = search;
      const res = await adminApi.getVendors(params);
      setVendors((Array.isArray(res) ? res : (res as any)?.data) || []);
      setTotalPages(res?.meta?.totalPages || 1);
    } catch {
      setVendors([]);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (id: string, status: string) => {
    try {
      await adminApi.updateVendorStatus(id, status);
      loadVendors();
      setConfirmAction(null);
    } catch (err: any) {
      alert(err.message || 'Failed to update vendor');
    }
  };

  const columns = [
    { key: 'storeName', label: 'Store Name', render: (v: any) => (
      <span className="font-medium text-gray-800">{v.storeName}</span>
    )},
    { key: 'ownerName', label: 'Owner', render: (v: any) => v.ownerName || v.user?.name || '-' },
    { key: 'email', label: 'Email', render: (v: any) => v.email || v.user?.email || '-' },
    { key: 'storeType', label: 'Store Type', render: (v: any) => <StatusBadge status={v.storeType} /> },
    { key: 'status', label: 'Status', render: (v: any) => <StatusBadge status={v.status} /> },
    { key: 'productsCount', label: 'Products', render: (v: any) => v._count?.products || v.productsCount || 0 },
    { key: 'createdAt', label: 'Joined', render: (v: any) => new Date(v.createdAt).toLocaleDateString() },
    { key: 'actions', label: 'Actions', render: (v: any) => (
      <div className="flex gap-1">
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

      <div className="flex gap-2">
        {['ALL', 'PENDING', 'APPROVED', 'REJECTED', 'SUSPENDED'].map((s) => (
          <button
            key={s}
            onClick={() => { setStatusFilter(s); setPage(1); }}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              statusFilter === s ? 'bg-emerald-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {s}
          </button>
        ))}
      </div>

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
        emptyMessage="No vendors found"
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
                className={`px-4 py-2 text-sm text-white rounded-lg ${
                  confirmAction.action === 'APPROVED' ? 'bg-emerald-600 hover:bg-emerald-700' :
                  confirmAction.action === 'REJECTED' ? 'bg-red-600 hover:bg-red-700' :
                  'bg-orange-600 hover:bg-orange-700'
                }`}
              >
                {confirmAction.label}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
