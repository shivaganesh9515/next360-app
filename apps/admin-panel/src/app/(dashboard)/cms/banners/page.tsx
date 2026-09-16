'use client';

import { useState, useEffect, useRef } from 'react';
import { Image as ImageIcon, Plus, Pencil, Trash2, Upload, X } from 'lucide-react';
import DataTable from '@/components/DataTable';
import StatusBadge from '@/components/StatusBadge';
import { adminApi, api } from '@/lib/api';

export default function BannersPage() {
  const [banners, setBanners] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editBanner, setEditBanner] = useState<any>(null);
  const [form, setForm] = useState({
    title: '',
    subtitle: '',
    offerLabel: '',
    description: '',
    position: 0,
    isActive: true,
    imageUrl: '',
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { loadBanners(); }, []);

  const loadBanners = async () => {
    setLoading(true);
    try { const res = await adminApi.getBanners(); setBanners(res?.data || res || []); }
    catch { setBanners([]); } finally { setLoading(false); }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setSelectedFile(file);
    // Generate local preview
    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);
  };

  const clearFile = () => {
    setSelectedFile(null);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setUploading(true);
    try {
      let imageUrl = form.imageUrl;

      // Upload file if selected
      if (selectedFile) {
        const formData = new FormData();
        formData.append('file', selectedFile);
        const uploadRes = await api.upload<{ url?: string; data?: { url: string } }>(
          '/upload/image',
          formData,
        );
        imageUrl = uploadRes?.url || uploadRes?.data?.url || '';
        if (!imageUrl) throw new Error('Upload succeeded but no URL returned');
      }

      const payload = { ...form, imageUrl };

      if (editBanner) {
        await adminApi.updateBanner(editBanner.id, payload);
      } else {
        await adminApi.createBanner(payload);
      }

      setShowModal(false);
      setEditBanner(null);
      resetForm();
      loadBanners();
    } catch (err: any) {
      alert(err.message || 'Failed to save banner');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this banner?')) return;
    try { await adminApi.deleteBanner(id); loadBanners(); }
    catch (err: any) { alert(err.message); }
  };

  const resetForm = () => {
    setForm({ title: '', subtitle: '', offerLabel: '', description: '', position: 0, isActive: true, imageUrl: '' });
    clearFile();
  };

  const openEditModal = (banner: any) => {
    setEditBanner(banner);
    setForm({
      title: banner.title || '',
      subtitle: banner.subtitle || '',
      offerLabel: banner.offerLabel || '',
      description: banner.description || '',
      position: banner.position || 0,
      isActive: banner.isActive,
      imageUrl: banner.imageUrl || '',
    });
    // Show existing image as preview
    if (banner.imageUrl) {
      setPreviewUrl(banner.imageUrl);
    } else {
      setPreviewUrl(null);
    }
    setSelectedFile(null);
    setShowModal(true);
  };

  const columns = [
    {
      key: 'title',
      label: 'Title',
      render: (b: any) => (
        <div>
          <span className="font-medium text-gray-800">{b.title}</span>
          {b.subtitle && <span className="block text-xs text-gray-500">{b.subtitle}</span>}
        </div>
      ),
    },
    {
      key: 'image',
      label: 'Image',
      render: (b: any) =>
        b.imageUrl ? (
          <img src={b.imageUrl} alt={b.title ? `Banner: ${b.title}` : 'Promotional banner'} className="w-20 h-10 object-cover rounded border border-gray-200" />
        ) : (
          <div className="w-20 h-10 bg-gray-100 rounded flex items-center justify-center border border-gray-200">
            <ImageIcon className="w-4 h-4 text-gray-400" />
          </div>
        ),
    },
    {
      key: 'position',
      label: 'Position',
      render: (b: any) => <span className="text-sm text-gray-600">{b.position}</span>,
    },
    {
      key: 'isActive',
      label: 'Active',
      render: (b: any) => <StatusBadge status={b.isActive ? 'ACTIVE' : 'INACTIVE'} />,
    },
    {
      key: 'actions',
      label: '',
      render: (b: any) => (
        <div className="flex gap-1 justify-end">
          <button
            onClick={(e) => { e.stopPropagation(); openEditModal(b); }}
            className="p-1.5 hover:bg-gray-100 rounded"
            title="Edit banner"
          >
            <Pencil className="w-3.5 h-3.5 text-gray-600" />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); handleDelete(b.id); }}
            className="p-1.5 hover:bg-red-50 rounded"
            title="Delete banner"
          >
            <Trash2 className="w-3.5 h-3.5 text-red-500" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-800">Banners</h2>
          <p className="text-sm text-gray-500">Manage homepage banners</p>
        </div>
        <button
          onClick={() => {
            setEditBanner(null);
            resetForm();
            setShowModal(true);
          }}
          className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm hover:bg-emerald-700"
        >
          <Plus className="w-4 h-4" /> Add Banner
        </button>
      </div>

      <DataTable
        columns={columns}
        data={banners}
        loading={loading}
        emptyMessage="No banners"
        emptyIcon={<ImageIcon className="w-10 h-10" />}
      />

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4 shadow-xl">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">
              {editBanner ? 'Edit Banner' : 'Add Banner'}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Title */}
              <div>
                <label className="text-sm text-gray-600 mb-1 block">Title *</label>
                <input
                  type="text"
                  required
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500"
                  placeholder="e.g. 27%"
                />
              </div>

              {/* Subtitle */}
              <div>
                <label className="text-sm text-gray-600 mb-1 block">Subtitle</label>
                <input
                  type="text"
                  value={form.subtitle}
                  onChange={(e) => setForm({ ...form, subtitle: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500"
                  placeholder="e.g. EXTRA\nDISCOUNT"
                />
              </div>

              {/* Offer Label */}
              <div>
                <label className="text-sm text-gray-600 mb-1 block">Offer Label</label>
                <input
                  type="text"
                  value={form.offerLabel}
                  onChange={(e) => setForm({ ...form, offerLabel: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500"
                  placeholder="e.g. FRESH ARRIVALS"
                />
              </div>

              {/* Description */}
              <div>
                <label className="text-sm text-gray-600 mb-1 block">Description</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 resize-none"
                  placeholder="Enjoy your first order with a special discount!"
                />
              </div>

              {/* Upload Image — replaces old Image URL + Link fields */}
              <div>
                <label className="text-sm text-gray-600 mb-1 block">Banner Image *</label>
                <div className="border-2 border-dashed border-gray-200 rounded-lg p-4 text-center hover:border-emerald-300 transition-colors">
                  {previewUrl ? (
                    <div className="relative inline-block">
                      <img
                        src={previewUrl}
                        alt={form.title ? `Preview: ${form.title}` : 'Banner image preview'}
                        className="max-h-32 rounded object-contain mx-auto"
                      />
                      <button
                        type="button"
                        onClick={clearFile}
                        className="absolute -top-2 -right-2 p-0.5 bg-red-500 text-white rounded-full hover:bg-red-600"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ) : (
                    <div
                      className="cursor-pointer"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <Upload className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                      <p className="text-sm text-gray-500">
                        Click to upload banner image
                      </p>
                      <p className="text-xs text-gray-400 mt-1">PNG, JPG or WebP</p>
                    </div>
                  )}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                </div>
              </div>

              {/* Position */}
              <div>
                <label className="text-sm text-gray-600 mb-1 block">Position</label>
                <input
                  type="number"
                  value={form.position}
                  onChange={(e) => setForm({ ...form, position: Number(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500"
                  min={0}
                />
              </div>

              {/* Active toggle */}
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.isActive}
                  onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
                  className="rounded"
                />
                <span className="text-sm text-gray-600">Active</span>
              </label>

              <div className="flex gap-3 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    setEditBanner(null);
                    resetForm();
                  }}
                  className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={uploading || (!previewUrl && !form.imageUrl && editBanner)}
                  className="px-4 py-2 text-sm bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50"
                >
                  {uploading ? 'Uploading...' : editBanner ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
