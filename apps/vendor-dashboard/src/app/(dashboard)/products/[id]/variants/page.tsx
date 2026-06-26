'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Plus, Save, X } from 'lucide-react';
import Link from 'next/link';
import { vendorApi } from '@/lib/api';

export default function ProductVariantsPage() {
  const params = useParams();
  const router = useRouter();
  const [productName, setProductName] = useState('');
  const [variants, setVariants] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    vendorApi.getProduct(params.id).then((p: any) => {
      setProductName(p.name);
      setVariants(p.variants || []);
    }).catch(console.error).finally(() => setLoading(false));
  }, [params.id]);

  if (loading) return <div className="text-center py-12 text-gray-500">Loading...</div>;

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <Link href={`/products/${params.id}`} className="p-1.5 hover:bg-gray-100 rounded"><ArrowLeft className="w-5 h-5 text-gray-600" /></Link>
        <div><h2 className="text-xl font-bold text-gray-800">Variants</h2><p className="text-sm text-gray-500">{productName}</p></div>
      </div>
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full">
          <thead><tr className="border-b border-gray-100 bg-gray-50">
            <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Name</th>
            <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Price</th>
            <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Stock</th>
            <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">SKU</th>
          </tr></thead>
          <tbody>
            {variants.length === 0 ? (
              <tr><td colSpan={4} className="px-4 py-12 text-center text-gray-500">No variants</td></tr>
            ) : variants.map((v: any) => (
              <tr key={v.id} className="border-b border-gray-50">
                <td className="px-4 py-3 text-sm text-gray-700">{v.name}</td>
                <td className="px-4 py-3 text-sm text-gray-700">₹{Number(v.price).toLocaleString()}</td>
                <td className="px-4 py-3 text-sm text-gray-700">{v.stock}</td>
                <td className="px-4 py-3 text-sm text-gray-500">{v.sku || '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
