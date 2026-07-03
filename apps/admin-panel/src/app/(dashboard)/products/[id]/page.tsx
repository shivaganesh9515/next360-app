'use client';

import { useState, useEffect } from 'react';
import { ArrowLeft, Package } from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';
import StatusBadge from '@/components/StatusBadge';
import { adminApi } from '@/lib/api';

export default function ProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [product, setProduct] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadProduct(); }, [params.id]);

  const loadProduct = async () => {
    try { const res = await adminApi.getProduct(params.id as string); setProduct(res); }
    catch { setProduct(null); } finally { setLoading(false); }
  };

  if (loading) return <div className="space-y-4">{[...Array(3)].map((_, i) => <div key={i} className="h-32 bg-gray-100 rounded-xl animate-pulse" />)}</div>;
  if (!product) return <div className="text-center py-12"><Package className="w-12 h-12 text-gray-300 mx-auto mb-4" /><p className="text-gray-500">Product not found</p><button onClick={() => router.back()} className="mt-4 text-emerald-600 text-sm hover:underline">Go back</button></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <button onClick={() => router.back()} className="p-2 hover:bg-gray-100 rounded-lg"><ArrowLeft className="w-5 h-5" /></button>
        <div><h2 className="text-xl font-bold text-gray-800">{product.name}</h2><p className="text-sm text-gray-500">Product Details</p></div>
        <div className="ml-auto"><StatusBadge status={product.isApproved ? 'ACTIVE' : 'PENDING'} /></div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="font-semibold text-gray-800 mb-4">Images</h3>
          <div className="grid grid-cols-3 gap-2">
            {(product.images || []).map((img: string, i: number) => (
              <img key={i} src={img} alt="" className="w-full h-32 object-cover rounded-lg bg-gray-100" />
            ))}
            {(!product.images || product.images.length === 0) && <p className="text-sm text-gray-400 col-span-3">No images</p>}
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="font-semibold text-gray-800 mb-4">Details</h3>
          <div className="space-y-3">
            <div><span className="text-sm text-gray-500">Vendor</span><p className="text-sm">{product.vendor?.storeName || '-'}</p></div>
            <div><span className="text-sm text-gray-500">Category</span><p className="text-sm">{product.category?.name || '-'}</p></div>
            <div><span className="text-sm text-gray-500">Brand</span><p className="text-sm">{product.brand?.name || '-'}</p></div>
            <div><span className="text-sm text-gray-500">Store Type</span><StatusBadge status={product.storeType} /></div>
            <div><span className="text-sm text-gray-500">Price</span><p className="text-sm font-bold font-mono">₹{(product.price || 0).toLocaleString()}</p></div>
            <div><span className="text-sm text-gray-500">Stock</span><p className="text-sm font-mono">{product.stock || 0}</p></div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6 lg:col-span-2">
          <h3 className="font-semibold text-gray-800 mb-4">Description</h3>
          <p className="text-sm text-gray-600 whitespace-pre-wrap">{product.description || 'No description'}</p>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="font-semibold text-gray-800 mb-4">Approval</h3>
          <div className="space-y-3">
            <div className="flex justify-between"><span className="text-sm text-gray-500">Status</span><StatusBadge status={product.isApproved ? 'ACTIVE' : 'PENDING'} /></div>
            <div className="flex justify-between"><span className="text-sm text-gray-500">Created</span><span className="text-sm">{new Date(product.createdAt).toLocaleDateString()}</span></div>
          </div>
        </div>

        {(product.variants || []).length > 0 && (
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h3 className="font-semibold text-gray-800 mb-4">Variants</h3>
            <div className="space-y-2">
              {product.variants.map((v: any) => (
                <div key={v.id} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg text-sm">
                  <span>{v.name || v.sku}</span>
                  <span className="font-mono">₹{(v.price || 0).toLocaleString()} | Stock: {v.stock || 0}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
