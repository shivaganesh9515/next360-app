'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Clock, CheckCircle, XCircle, Loader2, AlertTriangle } from 'lucide-react';
import DataTable from '@/components/DataTable';
import StatusBadge from '@/components/StatusBadge';
import { adminApi } from '@/lib/api';

export default function VendorApprovalsPage() {
  const router = useRouter();
  const [vendors, setVendors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [confirmAction, setConfirmAction] = useState<{ id: string; action: string; name: string } | null>(null);
  const [processing, setProcessing] = useState(false);

  // Delivery time defaults for approval
  const [approvalDeliveryMin, setApprovalDeliveryMin] = useState('10');
  const [approvalDeliveryMax, setApprovalDeliveryMax] = useState('20');
  const [approvalDeliveryLabel, setApprovalDeliveryLabel] = useState('');

  // Rejection reason states
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [rejectTarget, setRejectTarget] = useState<{ id: string; name: string } | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [rejectReasonError, setRejectReasonError] = useState('');

  useEffect(() => { loadPendingVendors(); }, []);

  const loadPendingVendors = async () => {
    setLoading(true);
    try {
      const res = await adminApi.getVendors({ status: 'PENDING', limit: 50 });
      setVendors((Array.isArray(res) ? res : (res as any)?.data) || []);
    } catch { setVendors([]); } finally { setLoading(false); }
  };

  const handleStatusChange = async (id: string, status: string) => {
    setProcessing(true);
    try {
      await adminApi.updateVendorStatus(id, status);
      // Also set delivery times if approving
      if (status === 'APPROVED') {
        const min = parseInt(approvalDeliveryMin, 10);
        const max = parseInt(approvalDeliveryMax, 10);
        if (min && max && min < max && min >= 1 && max <= 180) {
          await adminApi.updateVendor(id, {
            deliveryTimeMin: min,
            deliveryTimeMax: max,
            deliveryLabel: approvalDeliveryLabel || null,
          });
        }
      }
      await loadPendingVendors();
      setConfirmAction(null);
      // Reset delivery defaults
      setApprovalDeliveryMin('10');
      setApprovalDeliveryMax('20');
      setApprovalDeliveryLabel('');
    } catch (err: any) {
      alert(err.message || 'Failed to update vendor');
    } finally {
      setProcessing(false);
    }
  };

  const handleReject = () => {
    // Validate reason is not empty
    if (!rejectReason.trim()) {
      setRejectReasonError('Please provide a reason for rejection.');
      return;
    }
    setRejectReasonError('');
    setProcessing(true);

    // TODO: When the backend supports a rejection reason field, send it here.
    // Currently updateVendorStatus only sends { status } — the reason is
    // collected on the frontend but not persisted until the backend
    // endpoint/Prisma schema supports rejectionReason on the Vendor model.
    // Expected payload once supported:
    //   adminApi.updateVendorStatus(rejectTarget!.id, 'REJECTED', { rejectionReason: rejectReason.trim() })

    adminApi.updateVendorStatus(rejectTarget!.id, 'REJECTED')
      .then(() => loadPendingVendors())
      .then(() => {
        setShowRejectDialog(false);
        setRejectTarget(null);
        setRejectReason('');
      })
      .catch((err: any) => {
        alert(err.message || 'Failed to reject vendor');
      })
      .finally(() => {
        setProcessing(false);
      });
  };

  const openRejectDialog = (vendor: any) => {
    setRejectTarget({ id: vendor.id, name: vendor.storeName });
    setRejectReason('');
    setRejectReasonError('');
    setShowRejectDialog(true);
  };

  const columns = [
    { key: 'storeName', label: 'Store', render: (v: any) => <span className="font-medium text-gray-800">{v.storeName}</span> },
    { key: 'ownerName', label: 'Owner', render: (v: any) => v.ownerName || v.user?.name || '-' },
    { key: 'storeType', label: 'Type', render: (v: any) => <StatusBadge status={v.storeType} /> },
    { key: 'kycStatus', label: 'KYC', render: (v: any) => <StatusBadge status={v.kycStatus || 'INCOMPLETE'} /> },
    { key: 'createdAt', label: 'Applied', render: (v: any) => new Date(v.createdAt).toLocaleDateString() },
    { key: 'actions', label: 'Actions', render: (v: any) => (
      <div className="flex gap-2">
        <button onClick={(e) => { e.stopPropagation(); setConfirmAction({ id: v.id, action: 'APPROVED', name: v.storeName }); }} className="px-3 py-1.5 text-xs bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 flex items-center gap-1">
          <CheckCircle className="w-3 h-3" /> Approve
        </button>
        <button onClick={(e) => { e.stopPropagation(); openRejectDialog(v); }} className="px-3 py-1.5 text-xs bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center gap-1">
          <XCircle className="w-3 h-3" /> Reject
        </button>
      </div>
    )},
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-gray-800">Vendor Approvals</h2>
        <p className="text-sm text-gray-500">Review and approve vendor applications</p>
      </div>

      <DataTable columns={columns} data={vendors} loading={loading} onRowClick={(v) => router.push(`/vendors/${v.id}`)} emptyMessage="No pending vendor approvals" emptyIcon={<Clock className="w-10 h-10" />} />

      {/* Approve Confirmation Dialog */}
      {confirmAction && confirmAction.action === 'APPROVED' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4 shadow-xl">
            <h3 className="text-lg font-semibold text-gray-800 mb-1">Approve Vendor</h3>
            <p className="text-sm text-gray-600 mb-5">Approve &quot;{confirmAction.name}&quot;? They will be able to list products.</p>

            <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 mb-5">
              <p className="text-xs font-medium text-slate-700 mb-3 flex items-center gap-1.5">
                🕐 Delivery Time Estimates
              </p>
              <div className="grid grid-cols-2 gap-3 mb-3">
                <div>
                  <label className="block text-xs text-slate-500 mb-1">Min (mins)</label>
                  <input
                    type="number"
                    min={1}
                    max={120}
                    value={approvalDeliveryMin}
                    onChange={(e) => setApprovalDeliveryMin(e.target.value)}
                    className="w-full px-2.5 py-1.5 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-500 mb-1">Max (mins)</label>
                  <input
                    type="number"
                    min={1}
                    max={180}
                    value={approvalDeliveryMax}
                    onChange={(e) => setApprovalDeliveryMax(e.target.value)}
                    className="w-full px-2.5 py-1.5 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  />
                </div>
              </div>
              <div className="mb-3">
                <label className="block text-xs text-slate-500 mb-1">Label (optional)</label>
                <input
                  type="text"
                  value={approvalDeliveryLabel}
                  onChange={(e) => setApprovalDeliveryLabel(e.target.value)}
                  placeholder="e.g. Farm Direct, Handcrafted"
                  className="w-full px-2.5 py-1.5 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                />
              </div>
              <p className="text-xs text-slate-600 font-medium">
                Preview: {approvalDeliveryMin || '?'}-{approvalDeliveryMax || '?'} min{approvalDeliveryLabel ? ` • ${approvalDeliveryLabel}` : ''}
              </p>
            </div>

            <div className="flex gap-3 justify-end">
              <button onClick={() => setConfirmAction(null)} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg">Cancel</button>
              <button
                onClick={() => handleStatusChange(confirmAction.id, confirmAction.action)}
                disabled={processing}
                className="px-4 py-2 text-sm text-white rounded-lg flex items-center gap-2 disabled:opacity-60 bg-emerald-600 hover:bg-emerald-700"
              >
                {processing && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                {processing ? 'Approving...' : 'Approve'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Rejection Reason Dialog */}
      {showRejectDialog && rejectTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4 shadow-xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-red-50 rounded-lg">
                <AlertTriangle className="w-5 h-5 text-red-500" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-800">Reject Vendor</h3>
                <p className="text-sm text-gray-500">{rejectTarget.name}</p>
              </div>
            </div>

            <p className="text-sm text-gray-600 mb-4">
              Please provide a reason for rejecting this vendor application.
            </p>

            <div className="mb-4">
              <label className="text-sm text-gray-600 mb-1.5 block font-medium">
                Reason for rejection <span className="text-red-500">*</span>
              </label>
              <textarea
                value={rejectReason}
                onChange={(e) => {
                  setRejectReason(e.target.value);
                  if (e.target.value.trim()) setRejectReasonError('');
                }}
                placeholder="Explain why this vendor application is being rejected..."
                className={`w-full px-3 py-2 border rounded-lg text-sm min-h-[100px] focus:ring-2 focus:ring-emerald-500 transition-colors ${
                  rejectReasonError ? 'border-red-400 focus:ring-red-500' : 'border-gray-200'
                }`}
              />
              {rejectReasonError && (
                <p className="text-xs text-red-500 mt-1.5 flex items-center gap-1">
                  <XCircle className="w-3 h-3" />
                  {rejectReasonError}
                </p>
              )}
            </div>

            <div className="flex gap-3 justify-end">
              <button
                onClick={() => {
                  setShowRejectDialog(false);
                  setRejectTarget(null);
                  setRejectReason('');
                  setRejectReasonError('');
                }}
                className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={handleReject}
                disabled={processing}
                className="px-4 py-2 text-sm text-white bg-red-600 rounded-lg hover:bg-red-700 flex items-center gap-2 disabled:opacity-60"
              >
                {processing && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                {processing ? 'Rejecting...' : 'Reject Vendor'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
