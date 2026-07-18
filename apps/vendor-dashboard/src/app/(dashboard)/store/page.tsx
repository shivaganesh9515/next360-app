'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Edit3, Store } from 'lucide-react';
import { vendorApi } from '@/lib/api';
import StatusBadge from '@/components/StatusBadge';

export default function StoreProfilePage() {
  const [vendor, setVendor] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    vendorApi.getMyProfile().then((res: any) => setVendor(res)).catch(() => {}).finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="space-y-4" role="status" aria-label="Loading store profile">
      <div className="h-8 w-48 bg-slate-200 rounded animate-pulse" />
      <div className="h-64 bg-slate-100 rounded-xl animate-pulse" />
      <span className="sr-only">Loading store profile...</span>
    </div>
  );
  if (!vendor) return (
    <div className="flex flex-col items-center justify-center py-16 text-slate-400">
      <Store className="w-12 h-12 mb-3 opacity-40" />
      <p className="text-sm">Vendor profile not found</p>
    </div>
  );

  return (
    <div className="max-w-2xl">
      <div className="flex items-center justify-between mb-6">
        <div><h2 className="text-xl font-bold text-slate-900">Store Profile</h2><p className="text-sm text-slate-500">Your public store information</p></div>
        <Link href="/store/edit" className="inline-flex items-center gap-2 px-4 py-2.5 border border-slate-200 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors"><Edit3 className="w-4 h-4" /> Edit</Link>
      </div>
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="h-32 bg-gradient-to-r from-emerald-500 to-emerald-600 relative">
          {vendor.bannerUrl && <img src={vendor.bannerUrl} className="w-full h-full object-cover" />}
        </div>
        <div className="px-6 pb-6">
          <div className="flex items-end -mt-12 mb-4">
            <div className="w-20 h-20 bg-white rounded-xl border-2 border-white shadow overflow-hidden">
              {vendor.logoUrl ? <img src={vendor.logoUrl} className="w-full h-full object-cover" /> : (
                <div className="w-full h-full bg-emerald-100 flex items-center justify-center"><Store className="w-8 h-8 text-emerald-600" /></div>
              )}
            </div>
          </div>
          <div className="space-y-3">
            <div><h3 className="text-lg font-bold text-slate-900">{vendor.storeName}</h3>
              <p className="text-sm text-slate-500">@{vendor.storeSlug}</p></div>
            <div className="flex gap-2"><StatusBadge status={vendor.status} /><span className="text-xs bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full">{vendor.storeType}</span></div>
            {vendor.description && <p className="text-sm text-slate-600">{vendor.description}</p>}
            <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-100">
              <div><p className="text-xs text-slate-500">Commission Rate</p><p className="text-sm font-medium text-slate-900">{vendor.commissionPct || vendor.commissionRate || 0}%</p></div>
              <div><p className="text-xs text-slate-500">Zone</p><p className="text-sm font-medium text-slate-900">{vendor.zone?.name || vendor.zone?.city || '—'}</p></div>
              <div><p className="text-xs text-slate-500">Products</p><p className="text-sm font-medium text-slate-900">{vendor._count?.products || vendor.totalProducts || 0}</p></div>
              <div><p className="text-xs text-slate-500">Store Type</p><p className="text-sm font-medium text-slate-900">{vendor.storeType || '—'}</p></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
