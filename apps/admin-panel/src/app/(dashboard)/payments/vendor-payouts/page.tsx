'use client';

import { useState, useEffect } from 'react';
import { ArrowLeft, CreditCard, Download } from 'lucide-react';
import { useRouter } from 'next/navigation';
import DataTable from '@/components/DataTable';
import StatusBadge from '@/components/StatusBadge';
import { adminApi } from '@/lib/api';

export default function VendorPayoutsPage() {
  const router = useRouter();
  const [payouts, setPayouts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => { loadPayouts(); }, [page]);

  const loadPayouts = async () => {
    setLoading(true);
    try {
      const res = await adminApi.getPayouts({ page, limit: 20, type: 'vendor' });
      setPayouts((Array.isArray(res) ? res : (res as any)?.data) || []);
      setTotalPages(res?.meta?.totalPages || 1);
      setError(null);
    } catch (err: any) {
      setPayouts([]);
      setTotalPages(1);
      setError(err?.message || 'Failed to load vendor payouts');
    } finally { setLoading(false); }
  };

  /**
   * Exports every vendor payout from the server, not just the rows currently on
   * screen — the table is paginated at 20, so a client-side export of `payouts`
   * would silently truncate the file. The button stays enabled when the table
   * is empty so the result is never ambiguous: the export either downloads a
   * header-only CSV or reports that there was nothing to export.
   */
  const handleExport = async () => {
    setExporting(true);
    setError(null);
    setNotice(null);
    try {
      const rows = await adminApi.exportVendorPayoutsCsv();
      setNotice(
        rows === 0
          ? 'No vendor payout data to export — downloaded a CSV with headers only.'
          : `Exported ${rows} vendor payout${rows === 1 ? '' : 's'}.`,
      );
    } catch (err: any) {
      setError(err?.message || 'Failed to export vendor payouts');
    } finally {
      setExporting(false);
    }
  };

  const columns = [
    { key: 'vendor', label: 'Vendor', render: (p: any) => <span className="font-medium text-gray-800">{p.vendor?.storeName || '-'}</span> },
    { key: 'amount', label: 'Amount', render: (p: any) => <span className="font-mono font-bold">₹{(p.amount || 0).toLocaleString()}</span> },
    { key: 'period', label: 'Period', render: (p: any) => p.period || '-' },
    { key: 'status', label: 'Status', render: (p: any) => <StatusBadge status={p.status || 'PENDING'} /> },
    { key: 'razorpayTransferId', label: 'Transfer ID', render: (p: any) => <span className="font-mono text-xs">{p.razorpayTransferId || '-'}</span> },
    { key: 'createdAt', label: 'Date', render: (p: any) => new Date(p.createdAt).toLocaleDateString() },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <button onClick={() => router.back()} className="p-2 hover:bg-gray-100 rounded-lg"><ArrowLeft className="w-5 h-5" /></button>
        <div className="flex-1"><h2 className="text-xl font-bold text-gray-800">Vendor Payouts</h2><p className="text-sm text-gray-500">Razorpay Route payouts to vendors</p></div>
        <button
          onClick={handleExport}
          disabled={exporting}
          className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Download className="w-4 h-4" /> {exporting ? 'Exporting...' : 'Export CSV'}
        </button>
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600" role="alert">
          {error}
        </div>
      )}
      {notice && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-sm text-emerald-700" role="status">
          {notice}
        </div>
      )}

      <DataTable columns={columns} data={payouts} loading={loading} page={page} totalPages={totalPages} onPageChange={setPage} emptyMessage={error || "No vendor payout records"} emptyIcon={<CreditCard className="w-10 h-10" />} />
    </div>
  );
}
