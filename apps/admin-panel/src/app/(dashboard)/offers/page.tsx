'use client';

import { useState, useEffect } from 'react';
import { Tag, Plus, Pencil, Trash2 } from 'lucide-react';
import DataTable from '@/components/DataTable';
import StatusBadge from '@/components/StatusBadge';
import { adminApi } from '@/lib/api';

/** Mirrors the `Offer` Prisma model as returned by GET /offers. */
interface Offer {
  id: string;
  title: string;
  description?: string | null;
  storeType: 'ORGANIC' | 'NATURAL' | 'ECO_FRIENDLY';
  discountType: 'PERCENTAGE' | 'FIXED';
  discountValue: string | number;
  startDate: string;
  endDate: string;
  isActive: boolean;
}

const DISCOUNT_TYPES = ['PERCENTAGE', 'FIXED'] as const;
const STORE_TYPES = ['ORGANIC', 'NATURAL', 'ECO_FRIENDLY'] as const;

/** `discountValue` is a Prisma Decimal(10,2), which serialises as a JSON string. */
function toNumber(v: unknown): number {
  const n = typeof v === 'number' ? v : parseFloat(String(v ?? ''));
  return Number.isFinite(n) ? n : 0;
}

/** Prisma returns full ISO datetimes; `<input type="date">` only accepts YYYY-MM-DD. */
function toDateInput(v?: string | null): string {
  return v ? String(v).slice(0, 10) : '';
}

const EMPTY_FORM = {
  title: '', description: '', type: 'PERCENTAGE', value: 0,
  storeType: '', startDate: '', endDate: '', isActive: true,
};

type FormState = typeof EMPTY_FORM;

export default function OffersPage() {
  const [offers, setOffers] = useState<Offer[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editOffer, setEditOffer] = useState<Offer | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [formError, setFormError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredOffers = offers.filter((o) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      o.title?.toLowerCase().includes(q) ||
      o.discountType?.toLowerCase().includes(q) ||
      o.storeType?.toLowerCase().includes(q) ||
      String(toNumber(o.discountValue)).includes(q)
    );
  });

  useEffect(() => { loadOffers(); }, []);

  const loadOffers = async () => {
    setLoading(true);
    try { const res = await adminApi.getOffers(); setOffers(res?.data || res || []); }
    catch { setOffers([]); } finally { setLoading(false); }
  };

  /**
   * Maps the UI form state (type/value) onto the CreateOfferDto / UpdateOfferDto
   * contract (discountType/discountValue) and enforces every rule the backend
   * validates, so invalid data never reaches the API:
   *   - title: required string
   *   - storeType: required StoreType enum (Offer.storeType is non-nullable)
   *   - discountType: CouponType enum, PERCENTAGE | FIXED only
   *   - discountValue: number, @Min(0.01) — must not arrive as a string
   *   - startDate/endDate: required ISO 8601 strings, endDate > startDate
   */
  const buildPayload = (f: FormState) => {
    const discountValue = toNumber(f.value);
    const title = f.title.trim();

    if (!title) return { error: 'Title is required' };
    if (!f.storeType) return { error: 'Select a store type' };
    if (!DISCOUNT_TYPES.includes(f.type as (typeof DISCOUNT_TYPES)[number]))
      return { error: 'Type must be Percentage or Fixed Amount' };
    if (!Number.isFinite(discountValue) || discountValue < 0.01)
      return { error: 'Value must be a number of at least 0.01' };
    if (!f.startDate) return { error: 'Start date is required' };
    if (!f.endDate) return { error: 'End date is required' };
    if (new Date(f.endDate) <= new Date(f.startDate))
      return { error: 'End date must be after start date' };

    return {
      payload: {
        title,
        description: f.description.trim() || undefined,
        storeType: f.storeType,
        discountType: f.type,
        discountValue,
        startDate: f.startDate,
        endDate: f.endDate,
        isActive: f.isActive,
      },
    };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    const { payload, error } = buildPayload(form);
    if (error) { setFormError(error); return; }

    try {
      if (editOffer) { await adminApi.updateOffer(editOffer.id, payload); }
      else { await adminApi.createOffer(payload); }
      setShowModal(false); setEditOffer(null); setForm(EMPTY_FORM); loadOffers();
    } catch (err: any) { alert(err.message); }
  };

  const openCreate = () => {
    setEditOffer(null); setForm(EMPTY_FORM); setFormError(''); setShowModal(true);
  };

  const openEdit = (o: Offer) => {
    setEditOffer(o);
    setForm({
      title: o.title,
      description: o.description || '',
      type: o.discountType,
      value: toNumber(o.discountValue),
      storeType: o.storeType,
      startDate: toDateInput(o.startDate),
      endDate: toDateInput(o.endDate),
      isActive: o.isActive,
    });
    setFormError(''); setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this offer?')) return;
    try { await adminApi.deleteOffer(id); loadOffers(); }
    catch (err: any) { alert(err.message); }
  };

  const columns = [
    { key: 'title', label: 'Title', render: (o: Offer) => <span className="font-medium text-gray-800">{o.title}</span> },
    { key: 'discountType', label: 'Type', render: (o: Offer) => <StatusBadge status={o.discountType} /> },
    { key: 'discountValue', label: 'Value', render: (o: Offer) => o.discountType === 'PERCENTAGE' ? <span>{toNumber(o.discountValue)}%</span> : <span className="font-mono">₹{toNumber(o.discountValue)}</span> },
    { key: 'storeType', label: 'Store', render: (o: Offer) => o.storeType ? <StatusBadge status={o.storeType} /> : <span className="text-gray-400">All</span> },
    { key: 'startDate', label: 'Start', render: (o: Offer) => o.startDate ? new Date(o.startDate).toLocaleDateString() : '-' },
    { key: 'endDate', label: 'End', render: (o: Offer) => o.endDate ? new Date(o.endDate).toLocaleDateString() : '-' },
    { key: 'isActive', label: 'Active', render: (o: Offer) => <StatusBadge status={o.isActive ? 'ACTIVE' : 'INACTIVE'} /> },
    { key: 'actions', label: 'Actions', render: (o: Offer) => (
      <div className="flex gap-1">
        <button onClick={(e) => { e.stopPropagation(); openEdit(o); }} className="p-1.5 hover:bg-gray-100 rounded"><Pencil className="w-3.5 h-3.5 text-gray-600" /></button>
        <button onClick={(e) => { e.stopPropagation(); handleDelete(o.id); }} className="p-1.5 hover:bg-red-50 rounded"><Trash2 className="w-3.5 h-3.5 text-red-500" /></button>
      </div>
    )},
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h2 className="text-xl font-bold text-gray-800">Offers</h2><p className="text-sm text-gray-500">Manage promotional offers</p></div>
        <button onClick={openCreate} className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm hover:bg-emerald-700"><Plus className="w-4 h-4" /> Add Offer</button>
      </div>

      <DataTable columns={columns} data={filteredOffers} loading={loading} searchable searchPlaceholder="Search offers..." onSearch={setSearchQuery} emptyMessage="No offers" emptyIcon={<Tag className="w-10 h-10" />} />

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4 shadow-xl">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">{editOffer ? 'Edit Offer' : 'Add Offer'}</h3>
            <form onSubmit={handleSubmit} noValidate className="space-y-4">
              <div><label className="text-sm text-gray-600 mb-1 block">Title *</label><input type="text" required value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" /></div>
              <div><label className="text-sm text-gray-600 mb-1 block">Description</label><textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" rows={2} /></div>
              <div><label className="text-sm text-gray-600 mb-1 block">Type *</label>
                <select value={form.type} onChange={e => setForm({ ...form, type: e.target.value })} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm">
                  <option value="PERCENTAGE">Percentage</option><option value="FIXED">Fixed Amount</option>
                </select>
              </div>
              <div><label className="text-sm text-gray-600 mb-1 block">Value *</label><input type="number" required min="0.01" step="0.01" value={form.value} onChange={e => setForm({ ...form, value: e.target.value === '' ? 0 : Number(e.target.value) })} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" /></div>
              <div><label className="text-sm text-gray-600 mb-1 block">Store Type *</label>
                <select value={form.storeType} required onChange={e => setForm({ ...form, storeType: e.target.value })} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm">
                  <option value="">Select store type</option><option value="ORGANIC">Organic</option><option value="NATURAL">Natural</option><option value="ECO_FRIENDLY">Eco-Friendly</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="text-sm text-gray-600 mb-1 block">Start Date *</label><input type="date" required value={form.startDate} onChange={e => setForm({ ...form, startDate: e.target.value })} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" /></div>
                <div><label className="text-sm text-gray-600 mb-1 block">End Date *</label><input type="date" required min={form.startDate || undefined} value={form.endDate} onChange={e => setForm({ ...form, endDate: e.target.value })} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" /></div>
              </div>
              <label className="flex items-center gap-2"><input type="checkbox" checked={form.isActive} onChange={e => setForm({ ...form, isActive: e.target.checked })} className="rounded" /><span className="text-sm text-gray-600">Active</span></label>
              {formError && <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{formError}</div>}
              <div className="flex gap-3 justify-end">
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg">Cancel</button>
                <button type="submit" className="px-4 py-2 text-sm bg-emerald-600 text-white rounded-lg hover:bg-emerald-700">{editOffer ? 'Update' : 'Create'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
