'use client';

import { useState, useEffect } from 'react';
import { MapPin, Plus, Pencil, Trash2 } from 'lucide-react';
import DataTable from '@/components/DataTable';
import StatusBadge from '@/components/StatusBadge';
import { adminApi } from '@/lib/api';

export default function ZonesPage() {
  const [zones, setZones] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editZone, setEditZone] = useState<any>(null);
  const [form, setForm] = useState({ name: '', deliveryRadius: 10, codCap: 2000, isActive: true });

  useEffect(() => { loadZones(); }, []);

  const loadZones = async () => {
    setLoading(true);
    try { const res = await adminApi.getZones(); setZones(res?.data || res || []); }
    catch { setZones([]); } finally { setLoading(false); }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editZone) { await adminApi.updateZone(editZone.id, form); }
      else { await adminApi.createZone(form); }
      setShowModal(false); setEditZone(null); setForm({ name: '', deliveryRadius: 10, codCap: 2000, isActive: true }); loadZones();
    } catch (err: any) { alert(err.message); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this zone?')) return;
    try { await adminApi.deleteZone(id); loadZones(); }
    catch (err: any) { alert(err.message); }
  };

  const columns = [
    { key: 'name', label: 'Zone', render: (z: any) => <span className="font-medium text-gray-800">{z.name}</span> },
    { key: 'deliveryRadius', label: 'Radius', render: (z: any) => <span>{z.deliveryRadius || 10} km</span> },
    { key: 'codCap', label: 'COD Cap', render: (z: any) => <span className="font-mono">₹{(z.codCap || 2000).toLocaleString()}</span> },
    { key: 'vendorCount', label: 'Vendors', render: (z: any) => z._count?.vendors || z.vendorCount || 0 },
    { key: 'isActive', label: 'Active', render: (z: any) => <StatusBadge status={z.isActive ? 'ACTIVE' : 'INACTIVE'} /> },
    { key: 'actions', label: 'Actions', render: (z: any) => (
      <div className="flex gap-1">
        <button onClick={(e) => { e.stopPropagation(); setEditZone(z); setForm({ name: z.name, deliveryRadius: z.deliveryRadius || 10, codCap: z.codCap || 2000, isActive: z.isActive }); setShowModal(true); }} className="p-1.5 hover:bg-gray-100 rounded"><Pencil className="w-3.5 h-3.5 text-gray-600" /></button>
        <button onClick={(e) => { e.stopPropagation(); handleDelete(z.id); }} className="p-1.5 hover:bg-red-50 rounded"><Trash2 className="w-3.5 h-3.5 text-red-500" /></button>
      </div>
    )},
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h2 className="text-xl font-bold text-gray-800">Zones</h2><p className="text-sm text-gray-500">Manage delivery zones and COD limits</p></div>
        <button onClick={() => { setEditZone(null); setForm({ name: '', deliveryRadius: 10, codCap: 2000, isActive: true }); setShowModal(true); }} className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm hover:bg-emerald-700"><Plus className="w-4 h-4" /> Add Zone</button>
      </div>

      <DataTable columns={columns} data={zones} loading={loading} emptyMessage="No zones configured" emptyIcon={<MapPin className="w-10 h-10" />} />

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4 shadow-xl">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">{editZone ? 'Edit Zone' : 'Add Zone'}</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div><label className="text-sm text-gray-600 mb-1 block">Zone Name *</label><input type="text" required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" /></div>
              <div><label className="text-sm text-gray-600 mb-1 block">Delivery Radius (km)</label><input type="number" value={form.deliveryRadius} onChange={e => setForm({ ...form, deliveryRadius: Number(e.target.value) })} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" /></div>
              <div><label className="text-sm text-gray-600 mb-1 block">COD Cap (₹)</label><input type="number" value={form.codCap} onChange={e => setForm({ ...form, codCap: Number(e.target.value) })} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" /></div>
              <div className="flex items-center gap-2"><input type="checkbox" checked={form.isActive} onChange={e => setForm({ ...form, isActive: e.target.checked })} className="rounded" /><label className="text-sm text-gray-600">Active</label></div>
              <div className="flex gap-3 justify-end">
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg">Cancel</button>
                <button type="submit" className="px-4 py-2 text-sm bg-emerald-600 text-white rounded-lg hover:bg-emerald-700">{editZone ? 'Update' : 'Create'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
