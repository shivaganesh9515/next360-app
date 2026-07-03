'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Store, Save } from 'lucide-react';
import StatusBadge from '@/components/StatusBadge';
import { adminApi } from '@/lib/api';

export default function VendorDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [vendor, setVendor] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [commissionRate, setCommissionRate] = useState(15);
  const [saving, setSaving] = useState(false);
  const [confirmAction, setConfirmAction] = useState<string | null>(null);

  useEffect(() => {
    loadVendor();
  }, [params.id]);

  const loadVendor = async () => {
    try {
      const res = await adminApi.getVendor(params.id as string);
      setVendor(res);
      setCommissionRate(res?.commissionPct || 15);
    } catch {
      setVendor(null);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (status: string) => {
    try {
      await adminApi.updateVendorStatus(params.id as string, status);
      await loadVendor();
      setConfirmAction(null);
    } catch (err: any) {
      alert(err.message || 'Failed to update vendor');
    }
  };

  const handleCommissionSave = async () => {
    setSaving(true);
    try {
      await adminApi.updateVendorCommission(params.id as string, commissionRate);
      await loadVendor();
    } catch (err: any) {
      alert(err.message || 'Failed to update commission');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-32 bg-gray-100 rounded-xl animate-pulse" />
        ))}
      </div>
    );
  }

  if (!vendor) {
    return (
      <div className="text-center py-12">
        <Store className="w-12 h-12 text-gray-300 mx-auto mb-4" />
        <p className="text-gray-500">Vendor not found</p>
        <button onClick={() => router.back()} className="mt-4 text-emerald-600 text-sm hover:underline">Go back</button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <button onClick={() => router.back()} className="p-2 hover:bg-gray-100 rounded-lg">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h2 className="text-xl font-bold text-gray-800">{vendor.storeName}</h2>
          <p className="text-sm text-gray-500">Vendor Details</p>
        </div>
        <div className="ml-auto">
          <StatusBadge status={vendor.status} />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="font-semibold text-gray-800 mb-4">Store Information</h3>
          <div className="space-y-3">
            <div><span className="text-sm text-gray-500">Store Name</span><p className="text-sm font-medium">{vendor.storeName}</p></div>
            <div><span className="text-sm text-gray-500">Description</span><p className="text-sm">{vendor.description || 'No description'}</p></div>
            <div><span className="text-sm text-gray-500">Store Type</span><p className="text-sm"><StatusBadge status={vendor.storeType} /></p></div>
            <div><span className="text-sm text-gray-500">Zone</span><p className="text-sm">{vendor.zone?.name || vendor.zoneId || 'Unassigned'}</p></div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="font-semibold text-gray-800 mb-4">Owner Information</h3>
          <div className="space-y-3">
            <div><span className="text-sm text-gray-500">Name</span><p className="text-sm font-medium">{vendor.user?.name || vendor.ownerName || '-'}</p></div>
            <div><span className="text-sm text-gray-500">Email</span><p className="text-sm">{vendor.user?.email || vendor.email || '-'}</p></div>
            <div><span className="text-sm text-gray-500">Phone</span><p className="text-sm">{vendor.user?.phone || vendor.phone || '-'}</p></div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="font-semibold text-gray-800 mb-4">Commission Rate</h3>
          <div className="flex items-end gap-3">
            <div className="flex-1">
              <label className="text-sm text-gray-500">Rate (%)</label>
              <input
                type="number"
                value={commissionRate}
                onChange={(e) => setCommissionRate(Number(e.target.value))}
                min={0}
                max={50}
                className="w-full mt-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <button
              onClick={handleCommissionSave}
              disabled={saving}
              className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm hover:bg-emerald-700 disabled:opacity-50 flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              {saving ? 'Saving...' : 'Save'}
            </button>
          </div>
          <p className="text-xs text-gray-400 mt-2">Platform commission on each order from this vendor</p>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="font-semibold text-gray-800 mb-4">Actions</h3>
          <div className="space-y-3">
            {vendor.status === 'PENDING' && (
              <div className="flex gap-3">
                <button onClick={() => handleStatusChange('APPROVED')} className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm hover:bg-emerald-700">Approve</button>
                <button onClick={() => handleStatusChange('REJECTED')} className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700">Reject</button>
              </div>
            )}
            {vendor.status === 'APPROVED' && (
              <button onClick={() => setConfirmAction('SUSPENDED')} className="px-4 py-2 bg-orange-600 text-white rounded-lg text-sm hover:bg-orange-700">Suspend</button>
            )}
            {vendor.status === 'SUSPENDED' && (
              <button onClick={() => handleStatusChange('APPROVED')} className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm hover:bg-emerald-700">Reactivate</button>
            )}
            {vendor.status === 'REJECTED' && (
              <button onClick={() => handleStatusChange('APPROVED')} className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm hover:bg-emerald-700">Approve (Override)</button>
            )}
          </div>
        </div>
      </div>

      {confirmAction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-xl p-6 max-w-sm w-full mx-4 shadow-xl">
            <h3 className="text-lg font-semibold text-gray-800 mb-2">Confirm {confirmAction}</h3>
            <p className="text-sm text-gray-600 mb-6">Are you sure you want to {confirmAction.toLowerCase()} this vendor?</p>
            <div className="flex gap-3 justify-end">
              <button onClick={() => setConfirmAction(null)} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg">Cancel</button>
              <button onClick={() => handleStatusChange(confirmAction)} className="px-4 py-2 text-sm text-white bg-orange-600 rounded-lg hover:bg-orange-700">{confirmAction}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
