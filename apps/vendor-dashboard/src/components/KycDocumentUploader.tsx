'use client';

import { useRef, useState } from 'react';
import { FileText, Upload, ExternalLink, Loader2, AlertTriangle } from 'lucide-react';
import StatusBadge from './StatusBadge';
import { vendorApi } from '@/lib/api';

export interface KycDocument {
  id: string;
  documentType: string;
  label: string;
  fileName: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'EXPIRED';
  rejectionReason: string | null;
}

interface Props {
  documentType: string;
  label: string;
  doc?: KycDocument;
  onUploaded: () => void;
}

export default function KycDocumentUploader({ documentType, label, doc, onUploaded }: Props) {
  const [uploading, setUploading] = useState(false);
  const [viewing, setViewing] = useState(false);
  const [error, setError] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const locked = doc?.status === 'APPROVED';

  const handleFile = async (file: File | undefined) => {
    if (!file) return;
    setError('');
    setUploading(true);
    try {
      await vendorApi.uploadKycDocument(documentType, file);
      onUploaded();
    } catch (err: any) {
      setError(err.message || 'Upload failed');
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  const handleView = async () => {
    if (!doc) return;
    setViewing(true);
    try {
      const res = await vendorApi.getKycDocumentUrl(doc.id);
      window.open(res.url, '_blank', 'noopener,noreferrer');
    } catch (err: any) {
      setError(err.message || 'Could not open document');
    } finally {
      setViewing(false);
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
            <p className="text-[11px] font-medium text-slate-500">Required</p>
            {doc ? (
              <p className="text-xs text-slate-500 truncate max-w-[220px]">{doc.fileName}</p>
            ) : (
              <p className="text-xs text-slate-400">Not uploaded yet</p>
            )}
          </div>
        </div>
        {doc ? <StatusBadge status={doc.status} /> : <StatusBadge status="INCOMPLETE" />}
      </div>

      {doc?.status === 'REJECTED' && doc.rejectionReason && (
        <div className="mt-3 flex items-start gap-2 bg-red-50 border border-red-200 rounded-lg p-2.5">
          <AlertTriangle className="w-3.5 h-3.5 text-red-500 shrink-0 mt-0.5" />
          <p className="text-xs text-red-600">{doc.rejectionReason}</p>
        </div>
      )}

      {error && <p className="text-xs text-red-500 mt-2">{error}</p>}

      <div className="mt-3 flex items-center gap-2">
        {doc && (
          <button
            type="button"
            onClick={handleView}
            disabled={viewing}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-50"
          >
            {viewing ? <Loader2 className="w-3 h-3 animate-spin" /> : <ExternalLink className="w-3 h-3" />}
            View
          </button>
        )}
        {!locked && (
          <>
            <input
              ref={inputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,application/pdf"
              className="hidden"
              id={`kyc-upload-${documentType}`}
              onChange={(e) => handleFile(e.target.files?.[0])}
            />
            <label
              htmlFor={`kyc-upload-${documentType}`}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 cursor-pointer disabled:opacity-50"
            >
              {uploading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Upload className="w-3 h-3" />}
              {uploading ? 'Uploading...' : doc ? 'Replace' : 'Upload'}
            </label>
          </>
        )}
      </div>
    </div>
  );
}
