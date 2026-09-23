'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Save, CreditCard, User, MapPin, Landmark } from 'lucide-react';
import Link from 'next/link';
import { vendorApi } from '@/lib/api';

const INITIAL_FORM = {
  storeName: '',
  description: '',
  razorpayAccountId: '',
  sellerType: 'INDIVIDUAL' as 'INDIVIDUAL' | 'BUSINESS',
  ownerName: '',
  address: '',
  city: '',
  state: '',
  pincode: '',
  bankAccountName: '',
  bankAccountNumber: '',
  bankIfsc: '',
  bankName: '',
};

export default function EditStorePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(INITIAL_FORM);
  const [error, setError] = useState('');
  const [razorpayError, setRazorpayError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    setLoading(true);
    vendorApi.getMyProfile().then((res: any) => setForm({
      storeName: res.storeName || '',
      description: res.description || '',
      razorpayAccountId: res.razorpayAccountId || '',
      sellerType: res.sellerType || 'INDIVIDUAL',
      ownerName: res.ownerName || '',
      address: res.address || '',
      city: res.city || '',
      state: res.state || '',
      pincode: res.pincode || '',
      bankAccountName: res.bankAccountName || '',
      bankAccountNumber: res.bankAccountNumber || '',
      bankIfsc: res.bankIfsc || '',
      bankName: res.bankName || '',
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
    setForm({ ...form, razorpayAccountId: value });
    setRazorpayError(validateRazorpayId(value));
  };

  const validate = (): Record<string, string> => {
    const errs: Record<string, string> = {};
    if (form.pincode && !/^\d{6}$/.test(form.pincode)) errs.pincode = 'Pincode must be 6 digits';
    if (form.bankAccountNumber && !/^\d{9,18}$/.test(form.bankAccountNumber)) errs.bankAccountNumber = 'Account number must be 9-18 digits';
    if (form.bankIfsc && !/^[A-Z]{4}0[A-Z0-9]{6}$/.test(form.bankIfsc.trim().toUpperCase())) errs.bankIfsc = 'Invalid IFSC code format';
    return errs;
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const rzpErr = validateRazorpayId(form.razorpayAccountId);
    if (rzpErr) { setRazorpayError(rzpErr); return; }
    const errs = validate();
    setFieldErrors(errs);
    if (Object.keys(errs).length > 0) return;

    setSaving(true);
    try {
      await vendorApi.updateMyProfile({ ...form, bankIfsc: form.bankIfsc ? form.bankIfsc.trim().toUpperCase() : undefined });
      router.push('/store');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
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
      <form onSubmit={handleSave} className="space-y-4">
        {error && <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg border border-red-200">{error}</div>}

        {/* Store basics */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-4 shadow-sm">
          <div><label className="block text-sm font-medium text-slate-700 mb-1">Store Name *</label>
            <input value={form.storeName} onChange={(e) => setForm({ ...form, storeName: e.target.value })} required className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent" /></div>

          <div><label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
            <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={4} className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent" /></div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Seller Type</label>
            <div className="flex gap-3">
              {(['INDIVIDUAL', 'BUSINESS'] as const).map((t) => (
                <button
                  type="button"
                  key={t}
                  onClick={() => setForm({ ...form, sellerType: t })}
                  className={`flex-1 px-4 py-2.5 rounded-lg text-sm font-medium border transition-colors ${
                    form.sellerType === t ? 'bg-emerald-600 text-white border-emerald-600' : 'border-slate-300 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  {t === 'INDIVIDUAL' ? 'Individual' : 'Business'}
                </button>
              ))}
            </div>
            <p className="text-xs text-slate-400 mt-1.5">
              {form.sellerType === 'INDIVIDUAL' ? 'Requires PAN + Aadhaar.' : 'Requires PAN + GST Certificate.'}
            </p>
          </div>
        </div>

        {/* Owner & address */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-4 shadow-sm">
          <div className="flex items-center gap-2 mb-1"><User className="w-4 h-4 text-slate-500" /><h3 className="text-sm font-semibold text-slate-700">Owner Details</h3></div>
          <div><label className="block text-sm font-medium text-slate-700 mb-1">Owner / Contact Name</label>
            <input value={form.ownerName} onChange={(e) => setForm({ ...form, ownerName: e.target.value })} className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent" /></div>

          <div className="flex items-center gap-2 mb-1 pt-2"><MapPin className="w-4 h-4 text-slate-500" /><h3 className="text-sm font-semibold text-slate-700">Business Address</h3></div>
          <div><label className="block text-sm font-medium text-slate-700 mb-1">Address</label>
            <input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent" /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="block text-sm font-medium text-slate-700 mb-1">City</label>
              <input value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent" /></div>
            <div><label className="block text-sm font-medium text-slate-700 mb-1">State</label>
              <input value={form.state} onChange={(e) => setForm({ ...form, state: e.target.value })} className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent" /></div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Pincode</label>
            <input value={form.pincode} onChange={(e) => setForm({ ...form, pincode: e.target.value })} maxLength={6} className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent ${fieldErrors.pincode ? 'border-red-300 bg-red-50' : 'border-slate-300'}`} />
            {fieldErrors.pincode && <p className="text-xs text-red-500 mt-1">{fieldErrors.pincode}</p>}
          </div>
        </div>

        {/* Bank / payout */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-4 shadow-sm">
          <div className="flex items-center gap-2 mb-1"><Landmark className="w-4 h-4 text-slate-500" /><h3 className="text-sm font-semibold text-slate-700">Bank Account Details</h3></div>
          <div><label className="block text-sm font-medium text-slate-700 mb-1">Account Holder Name</label>
            <input value={form.bankAccountName} onChange={(e) => setForm({ ...form, bankAccountName: e.target.value })} className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent" /></div>
          <div><label className="block text-sm font-medium text-slate-700 mb-1">Bank Name</label>
            <input value={form.bankName} onChange={(e) => setForm({ ...form, bankName: e.target.value })} className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent" /></div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Account Number</label>
            <input value={form.bankAccountNumber} onChange={(e) => setForm({ ...form, bankAccountNumber: e.target.value.replace(/\D/g, '') })} className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent ${fieldErrors.bankAccountNumber ? 'border-red-300 bg-red-50' : 'border-slate-300'}`} />
            {fieldErrors.bankAccountNumber && <p className="text-xs text-red-500 mt-1">{fieldErrors.bankAccountNumber}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">IFSC Code</label>
            <input value={form.bankIfsc} onChange={(e) => setForm({ ...form, bankIfsc: e.target.value.toUpperCase() })} className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent uppercase ${fieldErrors.bankIfsc ? 'border-red-300 bg-red-50' : 'border-slate-300'}`} />
            {fieldErrors.bankIfsc && <p className="text-xs text-red-500 mt-1">{fieldErrors.bankIfsc}</p>}
          </div>
        </div>

        {/* Razorpay */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
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
