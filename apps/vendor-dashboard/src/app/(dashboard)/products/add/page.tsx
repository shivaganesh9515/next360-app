'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Save, X, Plus } from 'lucide-react';
import Link from 'next/link';
import { vendorApi } from '@/lib/api';

export default function AddProductPage() {
  const router = useRouter();
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [variants, setVariants] = useState([{ name: '', price: '', stock: '', sku: '' }]);
  const [form, setForm] = useState({ name: '', description: '', categoryId: '', price: '', compareAtPrice: '', unit: 'kg', stock: '0', sku: '', isActive: true });
  const [error, setError] = useState('');

  useEffect(() => {
    vendorApi.getCategories().then(res => setCategories(Array.isArray(res) ? res : res.data || [])).catch(() => {});
  }, []);

  const updateForm = (key: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => setForm({ ...form, [key]: e.target.value });

  const addVariant = () => setVariants([...variants, { name: '', price: '', stock: '', sku: '' }]);
  const updateVariant = (idx: number, key: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVars = [...variants]; (newVars[idx] as any)[key] = e.target.value; setVariants(newVars);
  };
  const removeVariant = (idx: number) => setVariants(variants.filter((_, i) => i !== idx));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const payload = {
        name: form.name,
        description: form.description || undefined,
        categoryId: form.categoryId || undefined,
        price: parseFloat(form.price),
        compareAtPrice: form.compareAtPrice ? parseFloat(form.compareAtPrice) : undefined,
        unit: form.unit,
        stock: parseInt(form.stock),
        sku: form.sku || undefined,
        isActive: form.isActive,
        variants: variants.filter(v => v.name).map(v => ({ name: v.name, price: parseFloat(v.price) || 0, stock: parseInt(v.stock) || 0, sku: v.sku || undefined })),
      };
      await vendorApi.createProduct(payload);
      router.push('/products');
    } catch (err: any) { setError(err.message); }
    finally { setLoading(false); }
  };

  return (
    <div className="max-w-3xl">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/products" className="p-1.5 hover:bg-gray-100 rounded"><ArrowLeft className="w-5 h-5 text-gray-600" /></Link>
        <div><h2 className="text-xl font-bold text-gray-800">Add Product</h2><p className="text-sm text-gray-500">Create a new product listing</p></div>
      </div>
      <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-gray-200 p-6 space-y-6">
        {error && <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg">{error}</div>}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Product Name *</label>
            <input value={form.name} onChange={updateForm('name')} required className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500" placeholder="Organic Bananas" />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea value={form.description} onChange={updateForm('description')} rows={3} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500" placeholder="Describe your product..." />
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
            <input type="number" step="0.01" min="0" value={form.price} onChange={updateForm('price')} required className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500" placeholder="60" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Compare-at Price</label>
            <input type="number" step="0.01" min="0" value={form.compareAtPrice} onChange={updateForm('compareAtPrice')} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500" placeholder="80" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Stock *</label>
            <input type="number" min="0" value={form.stock} onChange={updateForm('stock')} required className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500" placeholder="100" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">SKU</label>
            <input value={form.sku} onChange={updateForm('sku')} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500" placeholder="ORG-BAN-001" />
          </div>
        </div>
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm font-medium text-gray-700">Variants</label>
            <button type="button" onClick={addVariant} className="text-sm text-emerald-600 hover:text-emerald-700 flex items-center gap-1"><Plus className="w-3 h-3" /> Add Variant</button>
          </div>
          {variants.map((v, idx) => (
            <div key={idx} className="flex gap-2 items-start mb-2">
              <input value={v.name} onChange={updateVariant(idx, 'name')} placeholder="Name" className="flex-1 px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
              <input type="number" step="0.01" value={v.price} onChange={updateVariant(idx, 'price')} placeholder="Price" className="w-24 px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
              <input type="number" value={v.stock} onChange={updateVariant(idx, 'stock')} placeholder="Stock" className="w-20 px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
              <input value={v.sku} onChange={updateVariant(idx, 'sku')} placeholder="SKU" className="w-28 px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
              {variants.length > 1 && <button type="button" onClick={() => removeVariant(idx)} className="p-1.5 hover:bg-red-50 rounded text-red-400"><X className="w-4 h-4" /></button>}
            </div>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <input type="checkbox" id="isActive" checked={form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} className="rounded border-gray-300" />
          <label htmlFor="isActive" className="text-sm text-gray-700">Active</label>
        </div>
        <div className="flex gap-3">
          <button type="submit" disabled={loading} className="flex items-center gap-2 px-6 py-2.5 bg-emerald-600 text-white rounded-lg font-medium hover:bg-emerald-700 disabled:opacity-50"><Save className="w-4 h-4" /> {loading ? 'Saving...' : 'Save Product'}</button>
          <Link href="/products" className="px-6 py-2.5 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50">Cancel</Link>
        </div>
      </form>
    </div>
  );
}
