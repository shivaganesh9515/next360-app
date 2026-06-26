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
    vendorApi.getStore('me').then((res: any) => setVendor(res)).catch(console.error).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="text-center py-12 text-gray-500">Loading...</div>;
  if (!vendor) return <div className="text-center py-12 text-gray-500">Vendor profile not found</div>;

  return (
    <div className="max-w-2xl">
      <div className="flex items-center justify-between mb-6">
        <div><h2 className="text-xl font-bold text-gray-800">Store Profile</h2><p className="text-sm text-gray-500">Your public store information</p></div>
        <Link href="/store/edit" className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50"><Edit3 className="w-4 h-4" /> Edit</Link>
      </div>
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
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
            <div><h3 className="text-lg font-bold text-gray-800">{vendor.storeName}</h3>
              <p className="text-sm text-gray-500">@{vendor.storeSlug}</p></div>
            <div className="flex gap-2"><StatusBadge status={vendor.status} /><span className="text-xs bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full">{vendor.storeType}</span></div>
            {vendor.description && <p className="text-sm text-gray-600">{vendor.description}</p>}
            <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-100">
              <div><p className="text-xs text-gray-500">Commission Rate</p><p className="text-sm font-medium">{vendor.commissionRate || 0}%</p></div>
              <div><p className="text-xs text-gray-500">Rating</p><p className="text-sm font-medium">{'★'.repeat(Math.round(vendor.rating || 0))} ({vendor.rating || 0})</p></div>
              <div><p className="text-xs text-gray-500">Total Products</p><p className="text-sm font-medium">{vendor.totalProducts || 0}</p></div>
              <div><p className="text-xs text-gray-500">Total Orders</p><p className="text-sm font-medium">{vendor.totalOrders || 0}</p></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
