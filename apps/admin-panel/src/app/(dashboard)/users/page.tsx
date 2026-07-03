'use client';

import { useState, useEffect } from 'react';
import { Users as UsersIcon } from 'lucide-react';
import DataTable from '@/components/DataTable';
import StatusBadge from '@/components/StatusBadge';
import { adminApi } from '@/lib/api';

export default function UsersPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [confirmAction, setConfirmAction] = useState<{ id: string; action: string; name: string } | null>(null);

  useEffect(() => {
    loadUsers();
  }, [page, roleFilter]);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const params: any = { page, limit: 20 };
      if (roleFilter !== 'ALL') params.role = roleFilter;
      if (search) params.search = search;
      const res = await adminApi.getUsers(params);
      setUsers(res?.data || []);
      setTotalPages(res?.meta?.totalPages || 1);
    } catch {
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (id: string, status: string) => {
    try {
      await adminApi.updateUserStatus(id, status);
      loadUsers();
      setConfirmAction(null);
    } catch (err: any) {
      alert(err.message || 'Failed to update user');
    }
  };

  const columns = [
    { key: 'name', label: 'Name', render: (u: any) => (
      <span className="font-medium text-gray-800">{u.name}</span>
    )},
    { key: 'email', label: 'Email' },
    { key: 'phone', label: 'Phone', render: (u: any) => u.phone || '-' },
    { key: 'role', label: 'Role', render: (u: any) => <StatusBadge status={u.role} /> },
    { key: 'status', label: 'Status', render: (u: any) => <StatusBadge status={u.status || 'ACTIVE'} /> },
    { key: 'createdAt', label: 'Joined', render: (u: any) => new Date(u.createdAt).toLocaleDateString() },
    { key: 'actions', label: 'Actions', render: (u: any) => (
      <div className="flex gap-1">
        {u.status !== 'SUSPENDED' ? (
          <button
            onClick={(e) => { e.stopPropagation(); setConfirmAction({ id: u.id, action: 'SUSPENDED', name: u.name }); }}
            className="px-2 py-1 text-xs bg-orange-100 text-orange-700 rounded hover:bg-orange-200"
          >
            Suspend
          </button>
        ) : (
          <button
            onClick={(e) => { e.stopPropagation(); setConfirmAction({ id: u.id, action: 'ACTIVE', name: u.name }); }}
            className="px-2 py-1 text-xs bg-emerald-100 text-emerald-700 rounded hover:bg-emerald-200"
          >
            Activate
          </button>
        )}
      </div>
    )},
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-gray-800">Users</h2>
        <p className="text-sm text-gray-500">Manage all platform users</p>
      </div>

      <div className="flex gap-2 flex-wrap">
        {['ALL', 'CUSTOMER', 'VENDOR', 'DELIVERY_PARTNER', 'ADMIN'].map((r) => (
          <button
            key={r}
            onClick={() => { setRoleFilter(r); setPage(1); }}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              roleFilter === r ? 'bg-emerald-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {r === 'ALL' ? 'All Roles' : r.replace(/_/g, ' ')}
          </button>
        ))}
      </div>

      <DataTable
        columns={columns}
        data={users}
        loading={loading}
        searchable
        searchPlaceholder="Search users by name, email, phone..."
        onSearch={(q) => { setSearch(q); setPage(1); }}
        page={page}
        totalPages={totalPages}
        onPageChange={setPage}
        emptyMessage="No users found"
        emptyIcon={<UsersIcon className="w-10 h-10" />}
      />

      {confirmAction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-xl p-6 max-w-sm w-full mx-4 shadow-xl">
            <h3 className="text-lg font-semibold text-gray-800 mb-2">
              {confirmAction.action === 'SUSPENDED' ? 'Suspend' : 'Activate'} User
            </h3>
            <p className="text-sm text-gray-600 mb-6">
              {confirmAction.action === 'SUSPENDED'
                ? `Suspend ${confirmAction.name}? They will not be able to access the platform.`
                : `Reactivate ${confirmAction.name}? They will regain platform access.`
              }
            </p>
            <div className="flex gap-3 justify-end">
              <button onClick={() => setConfirmAction(null)} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg">Cancel</button>
              <button
                onClick={() => handleStatusChange(confirmAction.id, confirmAction.action)}
                className={`px-4 py-2 text-sm text-white rounded-lg ${
                  confirmAction.action === 'SUSPENDED' ? 'bg-orange-600 hover:bg-orange-700' : 'bg-emerald-600 hover:bg-emerald-700'
                }`}
              >
                {confirmAction.action === 'SUSPENDED' ? 'Suspend' : 'Activate'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
