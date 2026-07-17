'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Save } from 'lucide-react';
import Link from 'next/link';
import { vendorApi } from '@/lib/api';

export default function EditStorePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ storeName: '', description: '' });
  const [error, setError] = useState('');

  useEffect(() => {
    setLoading(true);
    vendorApi.getStore('me').then((res: any) => setForm({ storeName: res.storeName || '', description: res.description || '' }))
      .catch(() => {}).finally(() => setLoading(false));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setError(''); setSaving(true);
    try { await vendorApi.updateStore('me', form); router.push('/store'); }
    catch (err: any) { setError(err.message); }
    finally { setSaving(false); }
  };

  if (loading) return <div className="text-center py-12 text-slate-500">Loading...</div>;

  return (
    <div className="max-w-2xl">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/store" className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors"><ArrowLeft className="w-5 h-5 text-slate-600" /></Link>
        <div><h2 className="text-xl font-bold text-slate-900">Edit Store</h2><p className="text-sm text-slate-500">Update your store information</p></div>
      </div>
      <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-slate-200 p-6 space-y-4 shadow-sm">
        {error && <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg border border-red-200">{error}</div>}
        <div><label className="block text-sm font-medium text-slate-700 mb-1">Store Name *</label>
          <input value={form.storeName} onChange={(e) => setForm({...form, storeName: e.target.value})} required className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent" /></div>
        <div><label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
          <textarea value={form.description} onChange={(e) => setForm({...form, description: e.target.value})} rows={4} className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent" /></div>
        <div className="flex gap-3">
          <button type="submit" disabled={saving} className="flex items-center gap-2 px-6 py-2.5 bg-emerald-600 text-white rounded-lg font-medium hover:bg-emerald-700 disabled:opacity-50 transition-colors"><Save className="w-4 h-4" /> {saving ? 'Saving...' : 'Save Changes'}</button>
          <Link href="/store" className="px-6 py-2.5 border border-slate-300 text-slate-700 rounded-lg font-medium hover:bg-slate-50 transition-colors">Cancel</Link>
        </div>
      </form>
    </div>
  );
}
