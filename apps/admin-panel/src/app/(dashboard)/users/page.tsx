'use client';

import { useState, useEffect, useRef } from 'react';
import { Users as UsersIcon } from 'lucide-react';
import DataTable from '@/components/DataTable';
import StatusBadge from '@/components/StatusBadge';
import { adminApi } from '@/lib/api';

/** Canonical `UserRole` values. The button label is derived for display only —
 *  the value sent to the API (and matched against `user.role`) is the enum
 *  form, so `DELIVERY PARTNER` on screen is `DELIVERY_PARTNER` on the wire. */
const ROLE_FILTERS = ['ALL', 'CUSTOMER', 'VENDOR', 'DELIVERY_PARTNER', 'ADMIN'] as const;

/** Tolerant comparison so `DELIVERY_PARTNER`, `DELIVERY PARTNER` and
 *  `delivery-partner` all match the same users. */
const normalizeRole = (value: unknown) =>
  String(value ?? '').trim().toUpperCase().replace(/[\s-]+/g, '_');

export default function UsersPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('ALL');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [confirmAction, setConfirmAction] = useState<{ id: string; action: string; name: string } | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Identifies the newest in-flight request. Switching filters fires several
  // requests in quick succession; without this a slower earlier response can
  // land last and overwrite the table with rows for the previous filter.
  const requestId = useRef(0);

  // `search` is a dependency: it previously wasn't, so typing in the search box
  // only ever took effect once the page or role filter happened to change.
  useEffect(() => {
    loadUsers();
  }, [page, roleFilter, search]);

  const loadUsers = async () => {
    const id = ++requestId.current;
    setLoading(true);
    try {
      // "All Roles" is expressed by omitting `role` entirely — the backend also
      // accepts role=ALL, but sending nothing is unambiguous.
      const params: any = { page, limit: 20 };
      if (roleFilter !== 'ALL') params.role = normalizeRole(roleFilter);
      if (search) params.search = search;
      const res = await adminApi.getUsers(params);
      if (id !== requestId.current) return;
      const list: any[] = (Array.isArray(res) ? res : (res as any)?.data) || [];
      // The API filters by role server-side; this guard means a selected tab can
      // never display another role's users. It is a no-op on a correctly
      // filtered response, and `list` is passed through untouched for ALL.
      const rows = roleFilter === 'ALL'
        ? list
        : list.filter((u) => normalizeRole(u.role) === normalizeRole(roleFilter));
      setUsers(rows);
      setTotalPages(res?.meta?.totalPages || 1);
      setError(null);
    } catch (err: any) {
      // Kept separate from "no users": a failed request used to be reported as
      // an empty table, which made a 400 from the API indistinguishable from a
      // genuinely empty result and hid the real cause.
      if (id === requestId.current) {
        setUsers([]);
        setTotalPages(1);
        setError(err?.message || 'Failed to load users');
      }
    } finally {
      if (id === requestId.current) setLoading(false);
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
    { key: 'loyaltyTier', label: 'Loyalty', render: (u: any) => {
      const tier = u.loyaltyTier || u.userMetrics?.tier || '-';
      const points = u.pointsBalance ?? u.userMetrics?.pointsBalance ?? null;
      return (
        <div className="flex flex-col">
          <StatusBadge status={tier} />
          {points !== null && <span className="text-xs text-gray-400 mt-0.5">{points} pts</span>}
        </div>
      );
    }},
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
        {ROLE_FILTERS.map((r) => (
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
        emptyMessage={error ? `Couldn't load users — ${error}` : 'No users found'}
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
