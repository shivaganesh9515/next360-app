'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Plus, Save, X, RotateCcw } from 'lucide-react';
import Link from 'next/link';
import { vendorApi } from '@/lib/api';

export default function ProductVariantsPage() {
  const params = useParams();
  const router = useRouter();
  const [productName, setProductName] = useState('');
  const [variants, setVariants] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let cancelled = false;
    vendorApi.getProduct(String(params.id)).then((p: any) => {
      if (!cancelled) {
        setProductName(p.name);
        setVariants(p.variants || []);
      }
    }).catch((err) => {
      if (!cancelled) setError(err instanceof Error ? err : new Error(String(err)));
    }).finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [params.id]);

  if (loading) return (
    <div className="space-y-4" role="status" aria-label="Loading variants">
      <div className="h-8 w-48 bg-slate-200 rounded animate-pulse" />
      <div className="h-48 bg-slate-100 rounded-xl animate-pulse" />
      <span className="sr-only">Loading variants...</span>
    </div>
  );

  if (error) {
    return (
      <div>
        <div className="flex items-center gap-3 mb-6">
          <Link href={`/products/${String(params.id)}`} className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors"><ArrowLeft className="w-5 h-5 text-slate-600" /></Link>
          <div><h2 className="text-xl font-bold text-slate-900">Variants</h2></div>
        </div>
        <div className="flex flex-col items-center justify-center py-16 text-center" role="alert">
          <div className="w-11 h-11 rounded-full bg-rose-50 flex items-center justify-center mb-3">
            <X className="w-5 h-5 text-rose-500" aria-hidden="true" />
          </div>
          <p className="text-sm font-medium text-slate-700">Couldn&apos;t load variants</p>
          <p className="text-xs text-slate-400 mt-1 max-w-xs">{error.message}</p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="mt-4 inline-flex items-center gap-1.5 px-3.5 py-2 text-sm font-medium text-emerald-700 bg-emerald-50 rounded-lg hover:bg-emerald-100 transition-colors duration-150"
          >
            <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <Link href={`/products/${String(params.id)}`} className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors"><ArrowLeft className="w-5 h-5 text-slate-600" /></Link>
        <div><h2 className="text-xl font-bold text-slate-900">Variants</h2><p className="text-sm text-slate-500">{productName}</p></div>
      </div>
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead><tr className="border-b border-slate-100 bg-slate-50">
              <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase">Name</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase">Price</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase">Stock</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase">SKU</th>
            </tr></thead>
            <tbody>
              {variants.length === 0 ? (
                <tr><td colSpan={4} className="px-4 py-12 text-center text-slate-500">No variants</td></tr>
              ) : variants.map((v: any) => (
                <tr key={v.id} className="border-b border-slate-50">
                  <td className="px-4 py-3 text-sm text-slate-700">{v.name}</td>
                  <td className="px-4 py-3 text-sm text-slate-700">₹{Number(v.price).toLocaleString()}</td>
                  <td className="px-4 py-3 text-sm text-slate-700">{v.stock}</td>
                  <td className="px-4 py-3 text-sm text-slate-500">{v.sku || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
