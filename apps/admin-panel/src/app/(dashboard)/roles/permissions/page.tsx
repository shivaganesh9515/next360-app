'use client';

import { useState, useEffect } from 'react';
import { Shield, Plus, Trash2, Check, X } from 'lucide-react';
import DataTable from '@/components/DataTable';
import { adminApi } from '@/lib/api';

interface Permission {
  id: string;
  name: string;
  resource: string;
  action: string;
}

export default function PermissionsPage() {
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [deletingName, setDeletingName] = useState('');
  const [form, setForm] = useState({ name: '', resource: '', action: '' });
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => { loadPermissions(); }, []);

  const loadPermissions = async () => {
    setLoading(true);
    try {
      const res = await adminApi.getPermissions();
      setPermissions(res?.data || res || []);
    } catch {
      setPermissions([]);
    } finally {
      setLoading(false);
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

  // Auto-generate permission name from resource + action
  const generateName = (resource: string, action: string) => {
    if (!resource || !action) return '';
    return `${resource}:${action}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await adminApi.createPermission(form);
      setShowModal(false);
      setForm({ name: '', resource: '', action: '' });
      showSuccess('Permission created successfully');
      loadPermissions();
    } catch (err: any) {
      showError(err.message || 'Failed to create permission');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await adminApi.deletePermission(id);
      setConfirmDelete(null);
      showSuccess('Permission deleted successfully');
      loadPermissions();
    } catch (err: any) {
      showError(err.message || 'Failed to delete permission');
      setConfirmDelete(null);
    }
  };

  const columns = [
    {
      key: 'name',
      label: 'Name',
      render: (p: Permission) => (
        <code className="text-xs bg-gray-100 px-2 py-0.5 rounded font-mono text-gray-800">
          {p.name}
        </code>
      ),
    },
    {
      key: 'resource',
      label: 'Resource',
      render: (p: Permission) => (
        <span className="text-sm font-medium text-gray-700 capitalize">
          {p.resource.replace(/_/g, ' ')}
        </span>
      ),
    },
    {
      key: 'action',
      label: 'Action',
      render: (p: Permission) => (
        <span className="inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200">
          {p.action}
        </span>
      ),
    },
    {
      key: 'actions',
      label: '',
      render: (p: Permission) => (
        <div className="flex gap-1 justify-end">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setDeletingName(p.name);
              setConfirmDelete(p.id);
            }}
            className="p-1.5 hover:bg-red-50 rounded"
            title="Delete permission"
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
          <h2 className="text-xl font-bold text-gray-800">Permissions</h2>
          <p className="text-sm text-gray-500">Manage granular permission definitions</p>
        </div>
        <button
          onClick={() => {
            setForm({ name: '', resource: '', action: '' });
            setShowModal(true);
          }}
          className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm hover:bg-emerald-700"
        >
          <Plus className="w-4 h-4" /> Add Permission
        </button>
      </div>

      <DataTable
        columns={columns}
        data={permissions}
        loading={loading}
        searchable
        searchPlaceholder="Search permissions..."
        emptyMessage="No permissions defined"
        emptyIcon={<Shield className="w-10 h-10" />}
      />

      {/* Create Permission Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4 shadow-xl">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Add Permission</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-sm text-gray-600 mb-1 block">Resource *</label>
                <input
                  type="text"
                  required
                  value={form.resource}
                  onChange={(e) => {
                    const resource = e.target.value.toLowerCase().replace(/[^a-z_]/g, '');
                    setForm({
                      ...form,
                      resource,
                      name: generateName(resource, form.action),
                    });
                  }}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500"
                  placeholder="e.g. vendors, products, orders"
                />
              </div>
              <div>
                <label className="text-sm text-gray-600 mb-1 block">Action *</label>
                <input
                  type="text"
                  required
                  value={form.action}
                  onChange={(e) => {
                    const action = e.target.value.toLowerCase().replace(/[^a-z_]/g, '');
                    setForm({
                      ...form,
                      action,
                      name: generateName(form.resource, action),
                    });
                  }}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500"
                  placeholder="e.g. read, write, approve"
                />
              </div>
              <div>
                <label className="text-sm text-gray-600 mb-1 block">Permission Name</label>
                <code className="block w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm font-mono text-gray-700">
                  {form.name || <span className="text-gray-400 italic">auto-generated</span>}
                </code>
              </div>
              <div className="flex gap-3 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!form.resource || !form.action}
                  className="px-4 py-2 text-sm bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Create
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
            <h3 className="text-lg font-semibold text-gray-800 mb-2">Delete Permission</h3>
            <p className="text-sm text-gray-600 mb-1">
              Are you sure you want to delete <code className="text-xs bg-gray-100 px-1 py-0.5 rounded">{deletingName}</code>?
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
