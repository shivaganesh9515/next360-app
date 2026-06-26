'use client';

import { useState, useEffect } from 'react';
import DataTable from '@/components/DataTable';
import StatusBadge from '@/components/StatusBadge';
import { vendorApi } from '@/lib/api';

export default function ReturnsPage() {
  const [returns, setReturns] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    vendorApi.getReturns().then((res: any) => setReturns(Array.isArray(res) ? res : res.data || [])).catch(console.error).finally(() => setLoading(false));
  }, []);

  const handleAction = async (id: string, status: string) => {
    try {
      await vendorApi.updateReturnStatus(id, status);
      setReturns(prev => prev.map(r => r.id === id ? { ...r, status } : r));
    } catch (e) { console.error(e); }
  };

  const columns = [
    { key: 'orderNo', label: 'Order', render: (item: any) => <span className="font-mono text-sm">{item.orderNo || item.orderId?.slice(0, 8)}</span> },
    { key: 'customerName', label: 'Customer', render: (item: any) => <span>{item.customerName || item.user?.name || 'N/A'}</span> },
    { key: 'itemName', label: 'Item', render: (item: any) => <span>{item.itemName || item.product?.name || 'N/A'}</span> },
    { key: 'reason', label: 'Reason', render: (item: any) => <span className="text-sm text-gray-500 truncate max-w-[200px] inline-block">{item.reason}</span> },
    { key: 'status', label: 'Status', render: (item: any) => <StatusBadge status={item.status} /> },
    { key: 'actions', label: '', render: (item: any) => item.status === 'PENDING' ? (
      <div className="flex gap-2">
        <button onClick={() => handleAction(item.id, 'APPROVED')} className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded text-xs font-medium hover:bg-emerald-200">Approve</button>
        <button onClick={() => handleAction(item.id, 'REJECTED')} className="px-3 py-1 bg-red-100 text-red-700 rounded text-xs font-medium hover:bg-red-200">Reject</button>
      </div>
    ) : null },
  ];

  return (
    <div className="space-y-6">
      <div><h2 className="text-xl font-bold text-gray-800">Returns</h2><p className="text-sm text-gray-500">Manage return requests</p></div>
      <DataTable columns={columns} data={returns} loading={loading} emptyMessage="No return requests" />
    </div>
  );
}
