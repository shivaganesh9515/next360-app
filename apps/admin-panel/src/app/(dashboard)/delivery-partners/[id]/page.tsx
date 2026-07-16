'use client';

import { useState, useEffect } from 'react';
import { ArrowLeft, Truck, Save } from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';
import StatusBadge from '@/components/StatusBadge';
import { adminApi } from '@/lib/api';

export default function DeliveryPartnerDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [partner, setPartner] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadPartner(); }, [params.id]);

  const loadPartner = async () => {
    try { const res = await adminApi.getDeliveryPartner(params.id as string); setPartner(res?.data || res); }
    catch { setPartner(null); } finally { setLoading(false); }
  };

  const handleStatusChange = async (status: string) => {
    try { await adminApi.updateDeliveryPartnerStatus(params.id as string, status); await loadPartner(); }
    catch (err: any) { alert(err.message || 'Failed to update'); }
  };

  if (loading) return <div className="space-y-4">{[...Array(3)].map((_, i) => <div key={i} className="h-32 bg-gray-100 rounded-xl animate-pulse" />)}</div>;
  if (!partner) return <div className="text-center py-12"><Truck className="w-12 h-12 text-gray-300 mx-auto mb-4" /><p className="text-gray-500">Partner not found</p><button onClick={() => router.back()} className="mt-4 text-emerald-600 text-sm hover:underline">Go back</button></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <button onClick={() => router.back()} className="p-2 hover:bg-gray-100 rounded-lg"><ArrowLeft className="w-5 h-5" /></button>
        <div>
          <h2 className="text-xl font-bold text-gray-800">{partner.name || partner.user?.name || 'Delivery Partner'}</h2>
          <p className="text-sm text-gray-500">Partner Details</p>
        </div>
        <div className="ml-auto"><StatusBadge status={partner.status || 'OFFLINE'} /></div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="font-semibold text-gray-800 mb-4">Personal Information</h3>
          <div className="space-y-3">
            <div><span className="text-sm text-gray-500">Name</span><p className="text-sm font-medium">{partner.name || partner.user?.name || '-'}</p></div>
            <div><span className="text-sm text-gray-500">Email</span><p className="text-sm">{partner.email || partner.user?.email || '-'}</p></div>
            <div><span className="text-sm text-gray-500">Phone</span><p className="text-sm">{partner.phone || partner.user?.phone || '-'}</p></div>
            <div><span className="text-sm text-gray-500">Zone</span><p className="text-sm">{partner.zone?.name || 'Unassigned'}</p></div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="font-semibold text-gray-800 mb-4">Delivery Stats</h3>
          <div className="space-y-3">
            <div className="flex justify-between p-3 bg-gray-50 rounded-lg"><span className="text-sm text-gray-500">Completed Deliveries</span><span className="text-sm font-bold">{partner.completedDeliveries || 0}</span></div>
            <div className="flex justify-between p-3 bg-gray-50 rounded-lg"><span className="text-sm text-gray-500">Rating</span><span className="text-sm font-bold">{partner.rating ? `${partner.rating.toFixed(1)} ★` : 'N/A'}</span></div>
            <div className="flex justify-between p-3 bg-gray-50 rounded-lg"><span className="text-sm text-gray-500">Current Status</span><StatusBadge status={partner.status || 'OFFLINE'} /></div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="font-semibold text-gray-800 mb-4">Vehicle Information</h3>
          <div className="space-y-3">
            <div><span className="text-sm text-gray-500">Vehicle Type</span><p className="text-sm">{partner.vehicleType || 'Not specified'}</p></div>
            <div><span className="text-sm text-gray-500">Vehicle Number</span><p className="text-sm">{partner.vehicleNumber || 'Not specified'}</p></div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="font-semibold text-gray-800 mb-4">Actions</h3>
          <div className="space-y-3">
            {partner.status !== 'SUSPENDED' ? (
              <button onClick={() => handleStatusChange('SUSPENDED')} className="px-4 py-2 bg-orange-600 text-white rounded-lg text-sm hover:bg-orange-700">Suspend Partner</button>
            ) : (
              <button onClick={() => handleStatusChange('AVAILABLE')} className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm hover:bg-emerald-700">Activate Partner</button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
