'use client';

import { useState, useEffect } from 'react';
import { ArrowLeft, CreditCard, Download } from 'lucide-react';
import { useRouter } from 'next/navigation';
import DataTable from '@/components/DataTable';
import StatusBadge from '@/components/StatusBadge';
import { adminApi } from '@/lib/api';

export default function DeliveryPayoutsPage() {
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
      const res = await adminApi.getPayouts({ page, limit: 20, type: 'delivery' });
      setPayouts((Array.isArray(res) ? res : (res as any)?.data) || []);
      setTotalPages(res?.meta?.totalPages || 1);
      setError(null);
    } catch (err: any) {
      setPayouts([]);
      setTotalPages(1);
      setError(err?.message || 'Failed to load delivery payouts');
    } finally { setLoading(false); }
  };

  /**
   * Exports every delivery payout from the server rather than the 20 rows
   * currently rendered. The button is intentionally not disabled when the table
   * is empty: an empty export still produces a valid header-only CSV, and the
   * result is reported to the user instead of failing silently.
   */
  const handleExport = async () => {
    setExporting(true);
    setError(null);
    setNotice(null);
    try {
      const rows = await adminApi.exportDeliveryPayoutsCsv();
      setNotice(
        rows === 0
          ? 'No delivery payout data to export — downloaded a CSV with headers only.'
          : `Exported ${rows} delivery payout${rows === 1 ? '' : 's'}.`,
      );
    } catch (err: any) {
      setError(err?.message || 'Failed to export delivery payouts');
    } finally {
      setExporting(false);
    }
  };

  const columns = [
    { key: 'partner', label: 'Partner', render: (p: any) => <span className="font-medium text-gray-800">{p.deliveryPartner?.name || p.deliveryPartner?.user?.name || '-'}</span> },
    { key: 'amount', label: 'Amount', render: (p: any) => <span className="font-mono font-bold">₹{(p.amount || 0).toLocaleString()}</span> },
    { key: 'period', label: 'Period', render: (p: any) => p.period || '-' },
    { key: 'deliveries', label: 'Deliveries', render: (p: any) => p.deliveryCount || 0 },
    { key: 'status', label: 'Status', render: (p: any) => <StatusBadge status={p.status || 'PENDING'} /> },
    { key: 'createdAt', label: 'Date', render: (p: any) => new Date(p.createdAt).toLocaleDateString() },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <button onClick={() => router.back()} className="p-2 hover:bg-gray-100 rounded-lg"><ArrowLeft className="w-5 h-5" /></button>
        <div className="flex-1"><h2 className="text-xl font-bold text-gray-800">Delivery Payouts</h2><p className="text-sm text-gray-500">Payouts to delivery partners</p></div>
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

      <DataTable columns={columns} data={payouts} loading={loading} page={page} totalPages={totalPages} onPageChange={setPage} emptyMessage={error || "No delivery payout records"} emptyIcon={<CreditCard className="w-10 h-10" />} />
    </div>
  );
}
