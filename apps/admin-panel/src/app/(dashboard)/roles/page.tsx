'use client';

import { useState, useEffect } from 'react';
import { Shield, Plus, Pencil, Trash2, Check, X } from 'lucide-react';
import DataTable from '@/components/DataTable';
import { adminApi } from '@/lib/api';

interface Permission {
  id: string;
  name: string;
  resource: string;
  action: string;
}

interface Role {
  id: string;
  name: string;
  description: string | null;
  permissions: string[];
  isSystem?: boolean;
  _count?: { users?: number };
  userCount?: number;
}

export default function RolesPage() {
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editRole, setEditRole] = useState<Role | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [deletingRoleName, setDeletingRoleName] = useState('');
  const [form, setForm] = useState({ name: '', description: '', permissions: [] as string[] });
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Live permissions from backend
  const [allPermissions, setAllPermissions] = useState<Permission[]>([]);

  useEffect(() => {
    loadRoles();
    loadPermissions();
  }, []);

  const loadRoles = async () => {
    setLoading(true);
    try {
      const res = await adminApi.getRoles();
      setRoles(res?.data || res || []);
    } catch {
      setRoles([]);
    } finally {
      setLoading(false);
    }
  };

  const loadPermissions = async () => {
    try {
      const res = await adminApi.getPermissions();
      setAllPermissions(res?.data || res || []);
    } catch {
      setAllPermissions([]);
    }
  };

  const showError = (msg: string) => {
    setError(msg);
    setTimeout(() => setError(null), 5000);
  };

  const showSuccess = (msg: string) => {
    setSuccess(msg);
    setTimeout(() => setSuccess(null), 3000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editRole) {
        await adminApi.updateRole(editRole.id, form);
        showSuccess('Role updated successfully');
      } else {
        await adminApi.createRole(form);
        showSuccess('Role created successfully');
      }
      setShowModal(false);
      setEditRole(null);
      setForm({ name: '', description: '', permissions: [] });
      loadRoles();
    } catch (err: any) {
      showError(err.message || 'Failed to save role');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await adminApi.deleteRole(id);
      setConfirmDelete(null);
      showSuccess('Role deleted successfully');
      loadRoles();
    } catch (err: any) {
      showError(err.message || 'Failed to delete role');
      setConfirmDelete(null);
    }
  };

  // Group permissions by resource for the modal
  const groupedPermissions = allPermissions.reduce<Record<string, Permission[]>>((acc, p) => {
    if (!acc[p.resource]) acc[p.resource] = [];
    acc[p.resource].push(p);
    return acc;
  }, {});

  // Simple search filter for roles (client-side)
  const [searchQuery, setSearchQuery] = useState('');
  const filteredRoles = roles.filter((r) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      r.name.toLowerCase().includes(q) ||
      (r.description || '').toLowerCase().includes(q) ||
      (r.permissions || []).some((p) => p.toLowerCase().includes(q))
    );
  });

  const columns = [
    {
      key: 'name',
      label: 'Role',
      render: (r: Role) => (
        <div className="flex items-center gap-2">
          <span className="font-medium text-gray-800">{r.name}</span>
          {r.isSystem && (
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-gray-100 text-gray-500 font-medium">SYSTEM</span>
          )}
        </div>
      ),
    },
    {
      key: 'description',
      label: 'Description',
      render: (r: Role) => (
        <span className="text-sm text-gray-600">{r.description || '—'}</span>
      ),
    },
    {
      key: 'permissions',
      label: 'Permissions',
      render: (r: Role) => {
        const perms = r.permissions || [];
        if (perms.length === 0) return <span className="text-xs text-gray-400">None</span>;
        return (
          <div className="flex flex-wrap gap-1 max-w-xs">
            {perms.slice(0, 5).map((p) => (
              <span
                key={p}
                className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200"
              >
                {p}
              </span>
            ))}
            {perms.length > 5 && (
              <span className="text-[10px] text-gray-400">+{perms.length - 5} more</span>
            )}
          </div>
        );
      },
    },
    {
      key: 'actions',
      label: '',
      render: (r: Role) => (
        <div className="flex gap-1 justify-end">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setEditRole(r);
              setForm({
                name: r.name,
                description: r.description || '',
                permissions: r.permissions || [],
              });
              setShowModal(true);
            }}
            className="p-1.5 hover:bg-gray-100 rounded"
            title="Edit role"
          >
            <Pencil className="w-3.5 h-3.5 text-gray-600" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setDeletingRoleName(r.name);
              setConfirmDelete(r.id);
            }}
            className="p-1.5 hover:bg-red-50 rounded"
            title="Delete role"
          >
            <Trash2 className="w-3.5 h-3.5 text-red-500" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Flash messages */}
      {error && (
        <div className="flex items-center gap-2 px-4 py-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
          <X className="w-4 h-4 shrink-0" />
          <span>{error}</span>
          <button onClick={() => setError(null)} className="ml-auto text-red-400 hover:text-red-600">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
      {success && (
        <div className="flex items-center gap-2 px-4 py-3 bg-emerald-50 border border-emerald-200 rounded-lg text-sm text-emerald-700">
          <Check className="w-4 h-4 shrink-0" />
          <span>{success}</span>
          <button onClick={() => setSuccess(null)} className="ml-auto text-emerald-400 hover:text-emerald-600">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-800">Roles & Permissions</h2>
          <p className="text-sm text-gray-500">Manage admin roles and access control</p>
        </div>
        <button
          onClick={() => {
            setEditRole(null);
            setForm({ name: '', description: '', permissions: [] });
            setShowModal(true);
          }}
          className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm hover:bg-emerald-700"
        >
          <Plus className="w-4 h-4" /> Add Role
        </button>
      </div>

      {/* Client-side search */}
      <div className="relative max-w-sm">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search roles..."
          className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
        />
        <svg
          className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      </div>

      <DataTable
        columns={columns}
        data={filteredRoles}
        loading={loading}
        emptyMessage="No roles configured"
        emptyIcon={<Shield className="w-10 h-10" />}
      />

      {/* Create/Edit Role Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-xl p-6 max-w-xl w-full mx-4 shadow-xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">
              {editRole ? 'Edit Role' : 'Add Role'}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-sm text-gray-600 mb-1 block">Role Name *</label>
                <input
                  type="text"
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500"
                  placeholder="e.g. Content Manager"
                />
              </div>
              <div>
                <label className="text-sm text-gray-600 mb-1 block">Description</label>
                <input
                  type="text"
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500"
                  placeholder="What this role can do"
                />
              </div>
              <div>
                <label className="text-sm text-gray-600 mb-2 block">Permissions</label>
                {allPermissions.length === 0 ? (
                  <p className="text-xs text-gray-400 italic">
                    No permissions loaded. Create permissions first.
                  </p>
                ) : (
                  <div className="space-y-3 max-h-64 overflow-y-auto border border-gray-200 rounded-lg p-3">
                    {Object.entries(groupedPermissions).map(([resource, perms]) => (
                      <div key={resource}>
                        <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
                          {resource.replace(/_/g, ' ')}
                        </h4>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                          {perms.map((p) => (
                            <label
                              key={p.id}
                              className={`flex items-center gap-2 px-2 py-1.5 rounded text-xs cursor-pointer border transition-colors ${
                                form.permissions.includes(p.name)
                                  ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
                                  : 'bg-white border-gray-100 text-gray-600 hover:border-gray-200'
                              }`}
                            >
                              <input
                                type="checkbox"
                                checked={form.permissions.includes(p.name)}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setForm({ ...form, permissions: [...form.permissions, p.name] });
                                  } else {
                                    setForm({
                                      ...form,
                                      permissions: form.permissions.filter((x) => x !== p.name),
                                    });
                                  }
                                }}
                                className="sr-only"
                              />
                              {form.permissions.includes(p.name) ? (
                                <Check className="w-3 h-3 text-emerald-600 shrink-0" />
                              ) : (
                                <div className="w-3 h-3 rounded border border-gray-300 shrink-0" />
                              )}
                              <span>{p.action}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div className="flex gap-3 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    setEditRole(null);
                  }}
                  className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
                >
                  {editRole ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-xl p-6 max-w-sm w-full mx-4 shadow-xl">
            <h3 className="text-lg font-semibold text-gray-800 mb-2">Delete Role</h3>
            <p className="text-sm text-gray-600 mb-1">
              Are you sure you want to delete <strong>{deletingRoleName}</strong>?
            </p>
            <p className="text-sm text-gray-500 mb-6">This action cannot be undone.</p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setConfirmDelete(null)}
                className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(confirmDelete)}
                className="px-4 py-2 text-sm text-white bg-red-600 rounded-lg hover:bg-red-700"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
