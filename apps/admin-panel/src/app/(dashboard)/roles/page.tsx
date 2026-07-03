'use client';

import { useState, useEffect } from 'react';
import { Shield, Plus, Pencil, Trash2 } from 'lucide-react';
import DataTable from '@/components/DataTable';
import StatusBadge from '@/components/StatusBadge';
import { adminApi } from '@/lib/api';

export default function RolesPage() {
  const [roles, setRoles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editRole, setEditRole] = useState<any>(null);
  const [form, setForm] = useState({ name: '', description: '', permissions: [] as string[] });

  const availablePermissions = [
    'vendors:read', 'vendors:write', 'vendors:approve',
    'products:read', 'products:write', 'products:approve',
    'orders:read', 'orders:write', 'orders:cancel',
    'users:read', 'users:write',
    'delivery_partners:read', 'delivery_partners:write', 'delivery_partners:approve',
    'zones:read', 'zones:write',
    'payouts:read', 'payouts:write',
    'commissions:read', 'commissions:write',
    'cms:read', 'cms:write',
    'roles:read', 'roles:write',
    'analytics:read',
    'settings:read', 'settings:write',
  ];

  useEffect(() => { loadRoles(); }, []);

  const loadRoles = async () => {
    setLoading(true);
    try { const res = await adminApi.getRoles(); setRoles(res?.data || res || []); }
    catch { setRoles([]); } finally { setLoading(false); }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editRole) { await adminApi.updateRole(editRole.id, form); }
      else { await adminApi.createRole(form); }
      setShowModal(false); setEditRole(null); setForm({ name: '', description: '', permissions: [] }); loadRoles();
    } catch (err: any) { alert(err.message); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this role?')) return;
    try { await adminApi.deleteRole(id); loadRoles(); }
    catch (err: any) { alert(err.message); }
  };

  const columns = [
    { key: 'name', label: 'Role', render: (r: any) => <span className="font-medium text-gray-800">{r.name}</span> },
    { key: 'description', label: 'Description', render: (r: any) => <span className="text-sm text-gray-600">{r.description || '-'}</span> },
    { key: 'permissions', label: 'Permissions', render: (r: any) => <span className="text-sm">{r.permissions?.length || 0} permissions</span> },
    { key: 'userCount', label: 'Users', render: (r: any) => r._count?.users || r.userCount || 0 },
    { key: 'actions', label: 'Actions', render: (r: any) => (
      <div className="flex gap-1">
        <button onClick={(e) => { e.stopPropagation(); setEditRole(r); setForm({ name: r.name, description: r.description || '', permissions: r.permissions || [] }); setShowModal(true); }} className="p-1.5 hover:bg-gray-100 rounded"><Pencil className="w-3.5 h-3.5 text-gray-600" /></button>
        <button onClick={(e) => { e.stopPropagation(); handleDelete(r.id); }} className="p-1.5 hover:bg-red-50 rounded"><Trash2 className="w-3.5 h-3.5 text-red-500" /></button>
      </div>
    )},
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h2 className="text-xl font-bold text-gray-800">Roles & Permissions</h2><p className="text-sm text-gray-500">Manage admin roles and access control</p></div>
        <button onClick={() => { setEditRole(null); setForm({ name: '', description: '', permissions: [] }); setShowModal(true); }} className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm hover:bg-emerald-700"><Plus className="w-4 h-4" /> Add Role</button>
      </div>

      <DataTable columns={columns} data={roles} loading={loading} emptyMessage="No roles configured" emptyIcon={<Shield className="w-10 h-10" />} />

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-xl p-6 max-w-lg w-full mx-4 shadow-xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">{editRole ? 'Edit Role' : 'Add Role'}</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div><label className="text-sm text-gray-600 mb-1 block">Role Name *</label><input type="text" required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" /></div>
              <div><label className="text-sm text-gray-600 mb-1 block">Description</label><input type="text" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" /></div>
              <div>
                <label className="text-sm text-gray-600 mb-2 block">Permissions</label>
                <div className="grid grid-cols-2 gap-2">
                  {availablePermissions.map(p => (
                    <label key={p} className="flex items-center gap-2 text-xs">
                      <input type="checkbox" checked={form.permissions.includes(p)} onChange={e => {
                        if (e.target.checked) setForm({ ...form, permissions: [...form.permissions, p] });
                        else setForm({ ...form, permissions: form.permissions.filter(x => x !== p) });
                      }} className="rounded" />
                      <span className="font-mono">{p}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div className="flex gap-3 justify-end">
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg">Cancel</button>
                <button type="submit" className="px-4 py-2 text-sm bg-emerald-600 text-white rounded-lg hover:bg-emerald-700">{editRole ? 'Update' : 'Create'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
