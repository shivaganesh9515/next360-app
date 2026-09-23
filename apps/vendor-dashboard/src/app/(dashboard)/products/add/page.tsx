'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Save, X, Plus, Upload, Image as ImageIcon } from 'lucide-react';
import Link from 'next/link';
import { vendorApi } from '@/lib/api';
import { useAuth } from '@/lib/auth';

export default function AddProductPage() {
  const router = useRouter();
  const { vendorProfile } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [variants, setVariants] = useState([{ name: '', price: '', stock: '', sku: '' }]);
  const [form, setForm] = useState({ name: '', description: '', categoryId: '', price: '', compareAtPrice: '', unit: 'kg', stock: '0', sku: '', isActive: true });
  const [error, setError] = useState('');
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    // Only offer categories that belong to this vendor's own store type —
    // a NATURAL vendor shouldn't be able to list a product under an
    // ORGANIC or ECO_FRIENDLY category.
    if (!vendorProfile?.storeType) return;
    vendorApi.getCategories({ storeType: vendorProfile.storeType }).then(res => setCategories(Array.isArray(res) ? res : res.data || [])).catch(() => {
      // Non-critical: category dropdown will be empty but form still works
    });
  }, [vendorProfile?.storeType]);

  const updateForm = (key: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => setForm({ ...form, [key]: e.target.value });

  const addVariant = () => setVariants([...variants, { name: '', price: '', stock: '', sku: '' }]);
  const updateVariant = (idx: number, key: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVars = [...variants]; (newVars[idx] as any)[key] = e.target.value; setVariants(newVars);
  };
  const removeVariant = (idx: number) => setVariants(variants.filter((_, i) => i !== idx));

  const handleImageUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setUploading(true);
    try {
      const formData = new FormData();
      for (const file of Array.from(files)) {
        formData.append('files', file);
      }
      const result = await vendorApi.upload<{ urls: string[] }>('/upload/images', formData);
      if (result?.urls) {
        setImageUrls(prev => [...prev, ...result.urls]);
      }
    } catch (err: any) {
      setError(err.message || 'Image upload failed');
    } finally {
      setUploading(false);
    }
  };

  const removeImage = (idx: number) => {
    setImageUrls(prev => prev.filter((_, i) => i !== idx));
  };

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
        isActive: form.isActive,
        images: imageUrls.length > 0 ? imageUrls : undefined,
        variants: variants.filter(v => v.name).map(v => ({ name: v.name, price: parseFloat(v.price) || 0, stock: parseInt(v.stock) || 0, sku: v.sku || undefined })),
      };
      await vendorApi.createProduct(payload);
      router.push('/products');
    } catch (err: any) { setError(err.message); }
    finally { setLoading(false); }
  };

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/products" className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors"><ArrowLeft className="w-5 h-5 text-slate-600" /></Link>
        <div><h2 className="text-xl font-bold text-slate-900">Add Product</h2><p className="text-sm text-slate-500">Create a new product listing</p></div>
      </div>
      <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-slate-200 p-4 sm:p-6 space-y-6 shadow-sm">
        {error && <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg">{error}</div>}

        {/* Image Upload */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">Product Images</label>
          <div className="flex flex-wrap gap-3">
            {imageUrls.map((url, idx) => (
              <div key={idx} className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-lg border border-slate-200 overflow-hidden group">
                <img src={url} alt={`Product ${idx + 1}`} className="w-full h-full object-cover" />
                <button type="button" onClick={() => removeImage(idx)} className="absolute top-1 right-1 p-0.5 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="w-20 h-20 sm:w-24 sm:h-24 rounded-lg border-2 border-dashed border-slate-300 hover:border-emerald-400 flex flex-col items-center justify-center gap-1 text-slate-400 hover:text-emerald-500 transition-colors disabled:opacity-50"
            >
              {uploading ? (
                <div className="w-5 h-5 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <Upload className="w-5 h-5" />
                  <span className="text-[10px]">Upload</span>
                </>
              )}
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              multiple
              onChange={(e) => handleImageUpload(e.target.files)}
              className="hidden"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-slate-700 mb-1">Product Name *</label>
            <input value={form.name} onChange={updateForm('name')} required className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent" placeholder="Organic Bananas" />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
            <textarea value={form.description} onChange={updateForm('description')} rows={3} className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent" placeholder="Describe your product..." />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Category</label>
            <select value={form.categoryId} onChange={updateForm('categoryId')} className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent">
              <option value="">Select category</option>
              {categories.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Unit</label>
            <select value={form.unit} onChange={updateForm('unit')} className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent">
              <option value="kg">Kg</option><option value="g">Gram</option><option value="dozen">Dozen</option><option value="piece">Piece</option><option value="litre">Litre</option><option value="pack">Pack</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Price *</label>
            <input type="number" step="0.01" min="0" value={form.price} onChange={updateForm('price')} required className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent" placeholder="60" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Compare-at Price</label>
            <input type="number" step="0.01" min="0" value={form.compareAtPrice} onChange={updateForm('compareAtPrice')} className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent" placeholder="80" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Stock *</label>
            <input type="number" min="0" value={form.stock} onChange={updateForm('stock')} required className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent" placeholder="100" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">SKU</label>
            <input value={form.sku} onChange={updateForm('sku')} className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent" placeholder="ORG-BAN-001" />
          </div>
        </div>
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm font-medium text-slate-700">Variants</label>
            <button type="button" onClick={addVariant} className="text-sm text-emerald-600 hover:text-emerald-700 flex items-center gap-1"><Plus className="w-3 h-3" /> Add Variant</button>
          </div>
          {variants.map((v, idx) => (
            <div key={idx} className="flex flex-col sm:flex-row gap-2 items-start mb-2">
              <input value={v.name} onChange={updateVariant(idx, 'name')} placeholder="Name" className="w-full sm:flex-1 px-3 py-1.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent" />
              <input type="number" step="0.01" value={v.price} onChange={updateVariant(idx, 'price')} placeholder="Price" className="w-full sm:w-24 px-3 py-1.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent" />
              <input type="number" value={v.stock} onChange={updateVariant(idx, 'stock')} placeholder="Stock" className="w-full sm:w-20 px-3 py-1.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent" />
              <input value={v.sku} onChange={updateVariant(idx, 'sku')} placeholder="SKU" className="w-full sm:w-28 px-3 py-1.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent" />
              {variants.length > 1 && <button type="button" onClick={() => removeVariant(idx)} className="p-1.5 hover:bg-red-50 rounded text-red-400"><X className="w-4 h-4" /></button>}
            </div>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <input type="checkbox" id="isActive" checked={form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500" />
          <label htmlFor="isActive" className="text-sm text-slate-700">Active</label>
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
          <button type="submit" disabled={loading} className="flex items-center justify-center gap-2 px-6 py-2.5 bg-emerald-600 text-white rounded-lg font-medium hover:bg-emerald-700 disabled:opacity-50"><Save className="w-4 h-4" /> {loading ? 'Saving...' : 'Save Product'}</button>
          <Link href="/products" className="px-6 py-2.5 border border-slate-300 text-slate-700 rounded-lg font-medium hover:bg-slate-50 transition-colors text-center">Cancel</Link>
        </div>
      </form>
    </div>
  );
}
