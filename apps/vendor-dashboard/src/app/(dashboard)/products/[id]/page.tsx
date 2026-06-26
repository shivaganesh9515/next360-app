'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ArrowLeft, Save, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { vendorApi } from '@/lib/api';

export default function EditProductPage() {
  const router = useRouter();
  const params = useParams();
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [form, setForm] = useState({ name: '', description: '', categoryId: '', price: '', compareAtPrice: '', unit: 'kg', stock: '0', sku: '', isActive: true });
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([
      vendorApi.getCategories().then(res => setCategories(Array.isArray(res) ? res : res.data || [])),
      vendorApi.getProduct(params.id).then((p: any) => setForm({
        name: p.name, description: p.description || '', categoryId: p.categoryId || '',
        price: String(p.price), compareAtPrice: p.compareAtPrice ? String(p.compareAtPrice) : '',
        unit: p.unit || 'kg', stock: String(p.stock), sku: p.sku || '', isActive: p.isActive,
      })),
    ]).catch(console.error).finally(() => setFetching(false));
  }, [params.id]);

  const updateForm = (key: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => setForm({ ...form, [key]: e.target.value });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setError(''); setLoading(true);
    try {
      await vendorApi.updateProduct(params.id, {
        name: form.name, description: form.description || undefined, categoryId: form.categoryId || undefined,
        price: parseFloat(form.price), compareAtPrice: form.compareAtPrice ? parseFloat(form.compareAtPrice) : undefined,
        unit: form.unit, stock: parseInt(form.stock), sku: form.sku || undefined, isActive: form.isActive,
      });
      router.push('/products');
    } catch (err: any) { setError(err.message); }
    finally { setLoading(false); }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this product?')) return;
    try { await vendorApi.deleteProduct(params.id); router.push('/products'); }
    catch (err: any) { setError(err.message); }
  };

  if (fetching) return <div className="text-center py-12 text-gray-500">Loading...</div>;

  return (
    <div className="max-w-3xl">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Link href="/products" className="p-1.5 hover:bg-gray-100 rounded"><ArrowLeft className="w-5 h-5 text-gray-600" /></Link>
          <div><h2 className="text-xl font-bold text-gray-800">Edit Product</h2><p className="text-sm text-gray-500">{form.name}</p></div>
        </div>
        <button onClick={handleDelete} className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-600 rounded-lg text-sm hover:bg-red-100"><Trash2 className="w-4 h-4" /> Delete</button>
      </div>
      <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-gray-200 p-6 space-y-6">
        {error && <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg">{error}</div>}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Product Name *</label>
            <input value={form.name} onChange={updateForm('name')} required className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500" />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea value={form.description} onChange={updateForm('description')} rows={3} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
            <select value={form.categoryId} onChange={updateForm('categoryId')} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500">
              <option value="">Select category</option>
              {categories.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Unit</label>
            <select value={form.unit} onChange={updateForm('unit')} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500">
              <option value="kg">Kg</option><option value="g">Gram</option><option value="dozen">Dozen</option><option value="piece">Piece</option><option value="litre">Litre</option><option value="pack">Pack</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Price *</label>
            <input type="number" step="0.01" min="0" value={form.price} onChange={updateForm('price')} required className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Compare-at Price</label>
            <input type="number" step="0.01" min="0" value={form.compareAtPrice} onChange={updateForm('compareAtPrice')} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Stock *</label>
            <input type="number" min="0" value={form.stock} onChange={updateForm('stock')} required className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">SKU</label>
            <input value={form.sku} onChange={updateForm('sku')} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500" />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <input type="checkbox" id="isActive" checked={form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} className="rounded border-gray-300" />
          <label htmlFor="isActive" className="text-sm text-gray-700">Active</label>
        </div>
        <div className="flex gap-3">
          <button type="submit" disabled={loading} className="flex items-center gap-2 px-6 py-2.5 bg-emerald-600 text-white rounded-lg font-medium hover:bg-emerald-700 disabled:opacity-50"><Save className="w-4 h-4" /> {loading ? 'Saving...' : 'Update Product'}</button>
          <Link href="/products" className="px-6 py-2.5 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50">Cancel</Link>
        </div>
      </form>
    </div>
  );
}
