'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Edit3, Store, ShieldCheck, Loader2, CheckCircle2, User, MapPin, Landmark, Send } from 'lucide-react';
import { vendorApi } from '@/lib/api';
import StatusBadge from '@/components/StatusBadge';
import ErrorState from '@/components/ErrorState';
import KycDocumentUploader from '@/components/KycDocumentUploader';
import BankProofUploader from '@/components/BankProofUploader';

const KYC_STATUS_COPY: Record<string, { title: string; body: string }> = {
  INCOMPLETE: { title: 'Complete your KYC', body: 'Upload all required documents to submit your store for verification.' },
  PENDING_REVIEW: { title: 'Verification in progress', body: 'Our team is reviewing your documents. This usually takes 1-2 business days.' },
  REJECTED: { title: 'Action needed', body: 'One or more documents were rejected. Please review and re-upload them below.' },
  VERIFIED: { title: 'KYC verified', body: 'All your documents have been verified.' },
};

export default function StoreProfilePage() {
  const [vendor, setVendor] = useState<any>(null);
  const [kyc, setKyc] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [submitSuccess, setSubmitSuccess] = useState(false);

  const loadAll = useCallback(() => {
    setLoading(true);
    setError(null);
    Promise.all([vendorApi.getMyProfile(), vendorApi.getMyKyc()])
      .then(([v, k]: any[]) => { setVendor(v); setKyc(k); })
      .catch((err) => setError(err instanceof Error ? err : new Error(String(err))))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { loadAll(); }, [loadAll]);

  const refreshKyc = () => {
    vendorApi.getMyKyc().then((k: any) => setKyc(k)).catch(() => {});
  };

  const handleSubmitForVerification = async () => {
    setSubmitting(true);
    setSubmitError('');
    setSubmitSuccess(false);
    try {
      await vendorApi.submitKycForVerification();
      setSubmitSuccess(true);
      refreshKyc();
    } catch (err: any) {
      setSubmitError(err.message || 'Failed to submit for verification');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return (
    <div className="space-y-4" role="status" aria-label="Loading store profile">
      <div className="h-8 w-48 bg-slate-200 rounded animate-pulse" />
      <div className="h-64 bg-slate-100 rounded-xl animate-pulse" />
      <span className="sr-only">Loading store profile...</span>
    </div>
  );
  if (error) return (
    <div className="max-w-3xl">
      <div className="flex items-center justify-between mb-6">
        <div><h2 className="text-xl font-bold text-slate-900">Store Profile</h2></div>
      </div>
      <ErrorState message={error.message} onRetry={loadAll} />
    </div>
  );
  if (!vendor) return (
    <div className="flex flex-col items-center justify-center py-16 text-slate-400">
      <Store className="w-12 h-12 mb-3 opacity-40" />
      <p className="text-sm">Vendor profile not found</p>
    </div>
  );

  const completion = kyc?.profileCompletion;
  const kycStatus = kyc?.kycStatus || 'INCOMPLETE';
  const statusCopy = KYC_STATUS_COPY[kycStatus];
  const docsByType: Record<string, any> = {};
  (kyc?.documents || []).forEach((d: any) => { docsByType[d.documentType] = d; });
  // Uploading the final document changes the derived status to PENDING_REVIEW
  // immediately; submission is still required to notify the review team.
  const canSubmit = completion?.percent === 100 && !vendor.kycSubmittedAt;

  return (
    <div className="max-w-3xl space-y-6">
      <div className="flex items-center justify-between">
        <div><h2 className="text-xl font-bold text-slate-900">Store Profile</h2><p className="text-sm text-slate-500">Your public store information &amp; verification status</p></div>
        <Link href="/store/edit" className="inline-flex items-center gap-2 px-4 py-2.5 border border-slate-200 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors shrink-0"><Edit3 className="w-4 h-4" /> Edit</Link>
      </div>

      {/* ── Profile completion ─────────────────────────────────── */}
      {completion && (
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-semibold text-slate-800">Profile completion</p>
            <p className="text-sm font-bold text-emerald-600 tabular-nums">{completion.percent}%</p>
          </div>
          <div className="h-2 bg-slate-100 rounded-full overflow-hidden mb-3">
            <div className="h-full bg-emerald-500 rounded-full transition-all duration-500" style={{ width: `${completion.percent}%` }} />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1.5">
            {completion.items.map((item: any) => (
              <div key={item.key} className="flex items-center gap-2 text-xs">
                <CheckCircle2 className={`w-3.5 h-3.5 shrink-0 ${item.done ? 'text-emerald-500' : 'text-slate-300'}`} />
                <span className={item.done ? 'text-slate-600' : 'text-slate-400'}>{item.label}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── KYC status banner ─────────────────────────────────── */}
      <div className={`rounded-xl border p-5 flex items-start gap-3 ${
        kycStatus === 'VERIFIED' ? 'bg-emerald-50 border-emerald-200' :
        kycStatus === 'REJECTED' ? 'bg-red-50 border-red-200' :
        kycStatus === 'PENDING_REVIEW' ? 'bg-amber-50 border-amber-200' : 'bg-slate-50 border-slate-200'
      }`}>
        <ShieldCheck className={`w-5 h-5 shrink-0 mt-0.5 ${
          kycStatus === 'VERIFIED' ? 'text-emerald-600' :
          kycStatus === 'REJECTED' ? 'text-red-600' :
          kycStatus === 'PENDING_REVIEW' ? 'text-amber-600' : 'text-slate-500'
        }`} />
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <p className="text-sm font-semibold text-slate-800">{statusCopy.title}</p>
            <StatusBadge status={kycStatus} />
          </div>
          <p className="text-xs text-slate-600 mt-0.5">{statusCopy.body}</p>
          {submitSuccess && <p className="text-xs text-emerald-700 mt-2 font-medium">Submitted for verification.</p>}
          {submitError && <p className="text-xs text-red-600 mt-2">{submitError}</p>}
        </div>
        {canSubmit && (
          <button
            onClick={handleSubmitForVerification}
            disabled={submitting}
            className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700 disabled:opacity-60 shrink-0"
          >
            {submitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
            {submitting ? 'Submitting...' : 'Submit for Verification'}
          </button>
        )}
      </div>

      {/* ── Store hero card ────────────────────────────────────── */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
        {vendor.bannerUrl && (
          <div className="h-32 bg-gradient-to-r from-emerald-500 to-emerald-600 relative">
            <img src={vendor.bannerUrl} className="w-full h-full object-cover" alt="" />
          </div>
        )}
        <div className={`px-6 pb-6 ${vendor.bannerUrl ? '' : 'pt-6'}`}>
          <div className={`flex items-end mb-4 ${vendor.bannerUrl ? '-mt-10' : ''}`}>
            <div className="w-20 h-20 bg-white rounded-xl border-2 border-white shadow overflow-hidden">
              {vendor.logoUrl ? <img src={vendor.logoUrl} className="w-full h-full object-cover" alt="" /> : (
                <div className="w-full h-full bg-emerald-100 flex items-center justify-center"><Store className="w-8 h-8 text-emerald-600" /></div>
              )}
            </div>
          </div>
          <div className="space-y-3">
            <div><h3 className="text-lg font-bold text-slate-900">{vendor.storeName}</h3>
              <p className="text-sm text-slate-500">@{vendor.storeSlug}</p></div>
            <div className="flex flex-wrap gap-2">
              <StatusBadge status={vendor.status} />
              <span className="text-xs bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full">{vendor.storeType}</span>
              <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">{vendor.sellerType === 'BUSINESS' ? 'Business Seller' : 'Individual Seller'}</span>
            </div>
            {vendor.description && <p className="text-sm text-slate-600">{vendor.description}</p>}
            <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-100">
              <div><p className="text-xs text-slate-500">Commission Rate</p><p className="text-sm font-medium text-slate-900">{vendor.commissionPct || 0}%</p></div>
              <div><p className="text-xs text-slate-500">Zone</p><p className="text-sm font-medium text-slate-900">{vendor.zone?.name || vendor.zone?.city || '—'}</p></div>
              <div><p className="text-xs text-slate-500">Products</p><p className="text-sm font-medium text-slate-900">{vendor._count?.products || 0}</p></div>
              <div><p className="text-xs text-slate-500">Store Type</p><p className="text-sm font-medium text-slate-900">{vendor.storeType || '—'}</p></div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Owner / business details ───────────────────────────── */}
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <h3 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
          <User className="w-4 h-4 text-blue-600" /> Owner &amp; Business Details
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
          <div><p className="text-xs text-slate-500">Owner / Contact Name</p><p className="font-medium text-slate-800">{vendor.ownerName || '—'}</p></div>
          <div><p className="text-xs text-slate-500">Seller Type</p><p className="font-medium text-slate-800">{vendor.sellerType === 'BUSINESS' ? 'Business' : 'Individual'}</p></div>
          <div className="sm:col-span-2 flex items-start gap-2">
            <MapPin className="w-3.5 h-3.5 text-slate-400 mt-0.5 shrink-0" />
            <div>
              <p className="text-xs text-slate-500">Business Address</p>
              <p className="font-medium text-slate-800">
                {vendor.address ? `${vendor.address}, ${vendor.city}, ${vendor.state} ${vendor.pincode}` : '—'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Bank / payout details ──────────────────────────────── */}
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <h3 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
          <Landmark className="w-4 h-4 text-amber-600" /> Bank &amp; Payout Details
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
          <div><p className="text-xs text-slate-500">Account Holder</p><p className="font-medium text-slate-800">{vendor.bankAccountName || '—'}</p></div>
          <div><p className="text-xs text-slate-500">Bank Name</p><p className="font-medium text-slate-800">{vendor.bankName || '—'}</p></div>
          <div><p className="text-xs text-slate-500">Account Number</p><p className="font-medium text-slate-800 font-mono">{vendor.bankAccountNumber ? `••••${vendor.bankAccountNumber.slice(-4)}` : '—'}</p></div>
          <div><p className="text-xs text-slate-500">IFSC Code</p><p className="font-medium text-slate-800 font-mono">{vendor.bankIfsc || '—'}</p></div>
        </div>
      </div>

      {/* ── KYC documents ──────────────────────────────────────── */}
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <h3 className="font-semibold text-slate-900 mb-1 flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-purple-600" /> KYC Documents
        </h3>
        <p className="text-xs text-slate-500 mb-4">
          Required for {vendor.sellerType === 'BUSINESS' ? 'business' : 'individual'} sellers selling {vendor.storeType?.toLowerCase()} products.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {(kyc?.requiredDocumentTypes || []).map((type: string) => (
            <KycDocumentUploader
              key={type}
              documentType={type}
              label={kyc.documentLabels?.[type] || type}
              doc={docsByType[type]}
              onUploaded={refreshKyc}
            />
          ))}
          {(kyc?.bankProofDocumentTypes || []).length > 0 && (
            <BankProofUploader
              documentTypes={kyc.bankProofDocumentTypes}
              documentLabels={kyc.documentLabels || {}}
              documentsByType={docsByType}
              onUploaded={refreshKyc}
            />
          )}
        </div>
      </div>
    </div>
  );
}
