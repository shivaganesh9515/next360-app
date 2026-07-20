'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Package, Upload, X } from 'lucide-react';
import { adminApi } from '@/lib/api';

export default function AddProductPage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [categories, setCategories] = useState<any[]>([]);
  const [vendors, setVendors] = useState<any[]>([]);
  const [form, setForm] = useState({
    name: '',
    description: '',
    price: '',
    stock: '',
    storeType: 'ORGANIC',
    categoryId: '',
    vendorId: '',
    brandId: '',
    sku: '',
  });

  useEffect(() => {
    Promise.allSettled([
      adminApi.getCategories({}),
      adminApi.getVendors({}),
    ]).then(([catRes, vendorRes]) => {
      if (catRes.status === 'fulfilled') {
        const cats = Array.isArray(catRes.value) ? catRes.value : catRes.value?.data || [];
        setCategories(cats);
      }
      if (vendorRes.status === 'fulfilled') {
        const vends = Array.isArray(vendorRes.value) ? vendorRes.value : vendorRes.value?.data || [];
        setVendors(vends.filter((v: any) => v.status === 'APPROVED' || v.status === 'ACTIVE'));
      }
    });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await adminApi.createProduct({
        name: form.name,
        description: form.description,
        price: Number(form.price),
        stock: Number(form.stock),
        storeType: form.storeType,
        categoryId: form.categoryId || undefined,
        vendorId: form.vendorId || undefined,
        brandId: form.brandId || undefined,
      });
      router.push('/products');
    } catch (err: any) {
      alert(err.message || 'Failed to create product');
    } finally {
      setSaving(false);
    }
  };

  const updateField = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/products" className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
          <ArrowLeft className="w-5 h-5 text-gray-600" />
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
            <Link href="/products" className="hover:text-emerald-600 transition-colors">Products</Link>
            <span>/</span>
            <span className="text-gray-800 font-medium">Add Product</span>
          </div>
          <h2 className="text-xl font-bold text-gray-800">Add Product</h2>
          <p className="text-sm text-gray-500">Create a new product listing</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Information */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
          <h3 className="font-semibold text-gray-800 flex items-center gap-2">
            <Package className="w-4 h-4 text-gray-500" />
            Product Information
          </h3>
          <div>
            <label className="text-sm text-gray-600 mb-1 block">Product Name *</label>
            <input
              type="text"
              required
              value={form.name}
              onChange={(e) => updateField('name', e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              placeholder="e.g. Organic Turmeric Powder"
            />
          </div>
          <div>
            <label className="text-sm text-gray-600 mb-1 block">Description</label>
            <textarea
              value={form.description}
              onChange={(e) => updateField('description', e.target.value)}
              rows={4}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent resize-none"
              placeholder="Product description..."
            />
          </div>
          <div>
            <label className="text-sm text-gray-600 mb-1 block">SKU</label>
            <input
              type="text"
              value={form.sku}
              onChange={(e) => updateField('sku', e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              placeholder="e.g. ORG-TUR-001"
            />
          </div>
        </div>

        {/* Pricing & Inventory */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
          <h3 className="font-semibold text-gray-800">Pricing & Inventory</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-sm text-gray-600 mb-1 block">Price (₹) *</label>
              <input
                type="number"
                required
                min="1"
                value={form.price}
                onChange={(e) => updateField('price', e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                placeholder="0"
              />
            </div>
            <div>
              <label className="text-sm text-gray-600 mb-1 block">Stock Quantity *</label>
              <input
                type="number"
                required
                min="0"
                value={form.stock}
                onChange={(e) => updateField('stock', e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                placeholder="0"
              />
            </div>
          </div>
        </div>

        {/* Category & Vendor */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
          <h3 className="font-semibold text-gray-800">Category & Vendor</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-sm text-gray-600 mb-1 block">Store Type *</label>
              <select
                value={form.storeType}
                onChange={(e) => updateField('storeType', e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              >
                <option value="ORGANIC">Organic</option>
                <option value="NATURAL">Natural</option>
                <option value="ECO_FRIENDLY">Eco-Friendly</option>
              </select>
            </div>
            <div>
              <label className="text-sm text-gray-600 mb-1 block">Category</label>
              <select
                value={form.categoryId}
                onChange={(e) => updateField('categoryId', e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              >
                <option value="">Select category</option>
                {categories.map((c: any) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-sm text-gray-600 mb-1 block">Vendor *</label>
              <select
                required
                value={form.vendorId}
                onChange={(e) => updateField('vendorId', e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              >
                <option value="">Select vendor</option>
                {vendors.map((v: any) => (
                  <option key={v.id} value={v.id}>{v.storeName || v.name}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Image Upload Placeholder */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
          <h3 className="font-semibold text-gray-800">Product Images</h3>
          <div className="border-2 border-dashed border-gray-200 rounded-xl p-8 text-center hover:border-emerald-300 transition-colors cursor-pointer">
            <Upload className="w-10 h-10 text-gray-300 mx-auto mb-3" />
            <p className="text-sm text-gray-500 font-medium">Click to upload or drag and drop</p>
            <p className="text-xs text-gray-400 mt-1">PNG, JPG up to 5MB</p>
          </div>
          <p className="text-xs text-gray-400 italic">Image upload will be available after backend storage integration.</p>
        </div>

        {/* Actions */}
        <div className="flex gap-3 justify-end">
          <Link
            href="/products"
            className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm hover:bg-emerald-700 disabled:opacity-50 transition-colors"
          >
            {saving ? 'Creating...' : 'Create Product'}
          </button>
        </div>
      </form>
    </div>
  );
}
