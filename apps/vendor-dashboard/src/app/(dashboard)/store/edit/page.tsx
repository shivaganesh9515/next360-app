'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Save, CreditCard } from 'lucide-react';
import Link from 'next/link';
import { vendorApi } from '@/lib/api';

export default function EditStorePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ storeName: '', description: '', razorpayAccountId: '' });
  const [error, setError] = useState('');
  const [razorpayError, setRazorpayError] = useState('');

  useEffect(() => {
    setLoading(true);
    vendorApi.getMyProfile().then((res: any) => setForm({
      storeName: res.storeName || '',
      description: res.description || '',
      razorpayAccountId: res.razorpayAccountId || '',
    }))
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load store profile'))
      .finally(() => setLoading(false));
  }, []);

  const validateRazorpayId = (id: string): string => {
    if (!id) return '';
    if (!/^acc_[a-zA-Z0-9]{14,30}$/.test(id.trim())) return 'Invalid Razorpay account ID. Must start with "acc_" followed by alphanumeric characters.';
    return '';
  };

  const handleRazorpayChange = (value: string) => {
    setForm({...form, razorpayAccountId: value});
    setRazorpayError(validateRazorpayId(value));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault(); setError('');
    const err = validateRazorpayId(form.razorpayAccountId);
    if (err) { setRazorpayError(err); return; }
    setSaving(true);
    try { await vendorApi.updateMyProfile(form); router.push('/store'); }
    catch (err: any) { setError(err.message); }
    finally { setSaving(false); }
  };

  if (loading) return (
    <div className="space-y-4" role="status" aria-label="Loading store">
      <div className="h-8 w-48 bg-slate-200 rounded animate-pulse" />
      <div className="h-64 bg-slate-100 rounded-xl animate-pulse" />
      <span className="sr-only">Loading store...</span>
    </div>
  );

  return (
    <div className="max-w-2xl">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/store" className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors"><ArrowLeft className="w-5 h-5 text-slate-600" /></Link>
        <div><h2 className="text-xl font-bold text-slate-900">Edit Store</h2><p className="text-sm text-slate-500">Update your store information</p></div>
      </div>
      <form onSubmit={handleSave} className="bg-white rounded-xl border border-slate-200 p-6 space-y-4 shadow-sm">
        {error && <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg border border-red-200">{error}</div>}

        {/* Store Name */}
        <div><label className="block text-sm font-medium text-slate-700 mb-1">Store Name *</label>
          <input value={form.storeName} onChange={(e) => setForm({...form, storeName: e.target.value})} required className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent" /></div>

        {/* Description */}
        <div><label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
          <textarea value={form.description} onChange={(e) => setForm({...form, description: e.target.value})} rows={4} className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent" /></div>

        {/* Razorpay Account Linking */}
        <div className="border-t border-slate-100 pt-4">
          <div className="flex items-center gap-2 mb-1">
            <CreditCard className="w-4 h-4 text-slate-500" />
            <label className="text-sm font-medium text-slate-700">Razorpay Account ID</label>
          </div>
          <p className="text-xs text-slate-400 mb-2">Link your Razorpay account to receive instant payouts via Route.</p>
          <input
            value={form.razorpayAccountId}
            onChange={(e) => handleRazorpayChange(e.target.value)}
            placeholder="acc_..."
            className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent ${razorpayError ? 'border-red-300 bg-red-50' : 'border-slate-300'}`}
          />
          {razorpayError && <p className="text-xs text-red-500 mt-1">{razorpayError}</p>}
          {!razorpayError && form.razorpayAccountId && /^acc_[a-zA-Z0-9]{14,30}$/.test(form.razorpayAccountId.trim()) && (
            <p className="text-xs text-emerald-600 mt-1">✓ Valid Razorpay account ID</p>
          )}
        </div>

        <div className="flex gap-3">
          <button type="submit" disabled={saving} className="flex items-center gap-2 px-6 py-2.5 bg-emerald-600 text-white rounded-lg font-medium hover:bg-emerald-700 disabled:opacity-50 transition-colors"><Save className="w-4 h-4" /> {saving ? 'Saving...' : 'Save Changes'}</button>
          <Link href="/store" className="px-6 py-2.5 border border-slate-300 text-slate-700 rounded-lg font-medium hover:bg-slate-50 transition-colors">Cancel</Link>
        </div>
      </form>
    </div>
  );
}
