'use client';

import { useState } from 'react';
import { FileText, ExternalLink, Loader2, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';
import StatusBadge from './StatusBadge';
import { adminApi } from '@/lib/api';

export interface VendorKycDocument {
  id: string;
  documentType: string;
  label: string;
  fileName: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'EXPIRED';
  rejectionReason: string | null;
}

interface Props {
  vendorId: string;
  label: string;
  doc?: VendorKycDocument;
  onReviewed: () => void;
}

export default function VendorKycDocumentCard({ vendorId, label, doc, onReviewed }: Props) {
  const [viewing, setViewing] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [showReject, setShowReject] = useState(false);
  const [reason, setReason] = useState('');
  const [reasonError, setReasonError] = useState('');

  const handleView = async () => {
    if (!doc) return;
    setViewing(true);
    try {
      const res = await adminApi.getVendorKycDocumentUrl(vendorId, doc.id);
      window.open(res.url, '_blank', 'noopener,noreferrer');
    } finally {
      setViewing(false);
    }
  };

  const handleApprove = async () => {
    if (!doc) return;
    setProcessing(true);
    try {
      await adminApi.reviewVendorKycDocument(vendorId, doc.id, 'APPROVED');
      onReviewed();
    } catch (err: any) {
      alert(err.message || 'Failed to approve document');
    } finally {
      setProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!reason.trim()) { setReasonError('Please provide a reason for rejection.'); return; }
    if (!doc) return;
    setProcessing(true);
    try {
      await adminApi.reviewVendorKycDocument(vendorId, doc.id, 'REJECTED', reason.trim());
      setShowReject(false);
      setReason('');
      onReviewed();
    } catch (err: any) {
      alert(err.message || 'Failed to reject document');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="border border-slate-200 rounded-lg p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 min-w-0">
          <div className="w-9 h-9 rounded-lg bg-slate-50 flex items-center justify-center shrink-0">
            <FileText className="w-4 h-4 text-slate-400" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium text-slate-800">{label}</p>
            {doc ? <p className="text-xs text-slate-500 truncate max-w-[200px]">{doc.fileName}</p> : <p className="text-xs text-slate-400">Not uploaded</p>}
          </div>
        </div>
        <StatusBadge status={doc?.status || 'INCOMPLETE'} />
      </div>

      {doc?.status === 'REJECTED' && doc.rejectionReason && (
        <div className="mt-3 flex items-start gap-2 bg-red-50 border border-red-200 rounded-lg p-2.5">
          <AlertTriangle className="w-3.5 h-3.5 text-red-500 shrink-0 mt-0.5" />
          <p className="text-xs text-red-600">{doc.rejectionReason}</p>
        </div>
      )}

      {doc && (
        <div className="mt-3 flex items-center gap-2 flex-wrap">
          <button onClick={handleView} disabled={viewing} className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-50">
            {viewing ? <Loader2 className="w-3 h-3 animate-spin" /> : <ExternalLink className="w-3 h-3" />}
            View
          </button>
          {doc.status !== 'APPROVED' && (
            <button onClick={handleApprove} disabled={processing} className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 disabled:opacity-50">
              {processing ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCircle className="w-3 h-3" />}
              Approve
            </button>
          )}
          {doc.status !== 'REJECTED' && (
            <button onClick={() => setShowReject(true)} disabled={processing} className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-50">
              <XCircle className="w-3 h-3" />
              Reject
            </button>
          )}
        </div>
      )}

      {showReject && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => setShowReject(false)}>
          <div className="bg-white rounded-xl p-5 max-w-sm w-full mx-4 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <h4 className="text-sm font-semibold text-slate-800 mb-2">Reject {label}</h4>
            <textarea
              value={reason}
              onChange={(e) => { setReason(e.target.value); if (e.target.value.trim()) setReasonError(''); }}
              placeholder="Explain what's wrong with this document..."
              className={`w-full px-3 py-2 border rounded-lg text-sm min-h-[80px] focus:ring-2 focus:ring-emerald-500 ${reasonError ? 'border-red-400' : 'border-slate-200'}`}
            />
            {reasonError && <p className="text-xs text-red-500 mt-1">{reasonError}</p>}
            <div className="flex gap-2 justify-end mt-3">
              <button onClick={() => setShowReject(false)} className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg">Cancel</button>
              <button onClick={handleReject} disabled={processing} className="px-3 py-1.5 text-xs text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-60 flex items-center gap-1.5">
                {processing && <Loader2 className="w-3 h-3 animate-spin" />}
                Reject
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
