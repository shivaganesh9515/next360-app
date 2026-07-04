'use client';

import { useState, useEffect } from 'react';
import { Star, MessageSquare, Flag, Trash2 } from 'lucide-react';
import DataTable from '@/components/DataTable';
import StatsCard from '@/components/StatsCard';
import { adminApi } from '@/lib/api';

export default function ReviewsPage() {
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [stats, setStats] = useState({ totalReviews: 0, avgRating: 0, flaggedCount: 0 });
  const [ratingFilter, setRatingFilter] = useState<number | ''>('');
  const [confirmDelete, setConfirmDelete] = useState<{ id: string; productName: string } | null>(null);

  useEffect(() => { loadReviews(); }, [page, ratingFilter]);

  const loadReviews = async () => {
    setLoading(true);
    try {
      const params: any = { page, limit: 20 };
      if (ratingFilter !== '') params.rating = ratingFilter;
      const res = await adminApi.getReviews(params);
      setReviews(res?.data || []);
      setTotalPages(res?.meta?.totalPages || 1);
      if (res?.summary) setStats(res.summary);
    } catch { setReviews([]); } finally { setLoading(false); }
  };

  const handleDelete = async (id: string) => {
    try {
      await fetch(`/api/reviews/${id}`, { method: 'DELETE' });
      setConfirmDelete(null);
      loadReviews();
    } catch (err: any) {
      alert(err.message || 'Failed to delete review');
    }
  };

  const handleFlag = async (id: string) => {
    try {
      await fetch(`/api/reviews/${id}/flag`, { method: 'PATCH' });
      loadReviews();
    } catch {
      // gracefully handle if endpoint doesn't exist
    }
  };

  const columns = [
    { key: 'user', label: 'User', render: (r: any) => <span className="font-medium text-gray-800">{r.user?.name || '-'}</span> },
    { key: 'product', label: 'Product', render: (r: any) => r.product?.name || '-' },
    { key: 'rating', label: 'Rating', render: (r: any) => (
      <div className="flex items-center gap-1">{[1, 2, 3, 4, 5].map(s => <Star key={s} className={`w-3.5 h-3.5 ${s <= r.rating ? 'text-amber-500 fill-amber-500' : 'text-gray-300'}`} />)}</div>
    )},
    { key: 'comment', label: 'Review', render: (r: any) => <p className="text-sm text-gray-600 line-clamp-2">{r.comment || 'No comment'}</p> },
    { key: 'createdAt', label: 'Date', render: (r: any) => new Date(r.createdAt).toLocaleDateString() },
    { key: 'actions', label: 'Actions', render: (r: any) => (
      <div className="flex gap-1">
        <button onClick={(e) => { e.stopPropagation(); handleFlag(r.id); }} title="Flag for review" className="p-1.5 hover:bg-amber-100 rounded"><Flag className="w-3.5 h-3.5 text-amber-600" /></button>
        <button onClick={(e) => { e.stopPropagation(); setConfirmDelete({ id: r.id, productName: r.product?.name || 'Unknown' }); }} title="Delete review" className="p-1.5 hover:bg-red-100 rounded"><Trash2 className="w-3.5 h-3.5 text-red-600" /></button>
      </div>
    )},
  ];

  return (
    <div className="space-y-6">
      <div><h2 className="text-xl font-bold text-gray-800">Reviews</h2><p className="text-sm text-gray-500">Moderate product reviews</p></div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatsCard title="Total Reviews" value={stats.totalReviews.toString()} icon={<MessageSquare className="w-5 h-5" />} color="blue" />
        <StatsCard title="Avg Rating" value={stats.avgRating ? stats.avgRating.toFixed(1) : '0'} icon={<Star className="w-5 h-5" />} color="amber" />
        <StatsCard title="Flagged" value={stats.flaggedCount.toString()} icon={<MessageSquare className="w-5 h-5" />} color="red" />
      </div>

      <div className="flex gap-3 flex-wrap">
        <span className="text-sm text-gray-500 self-center">Filter by rating:</span>
        {[ '', '5', '4', '3', '2', '1' ].map(r => (
          <button key={r} onClick={() => { setRatingFilter(r === '' ? '' : Number(r)); setPage(1); }}
            className={`px-3 py-1.5 text-xs rounded-lg border transition-colors ${ratingFilter === (r === '' ? '' : Number(r)) ? 'bg-amber-500 text-white border-amber-500' : 'border-gray-200 text-gray-600 hover:bg-gray-100'}`}>
            {r ? `${r} ★` : 'All'}
          </button>
        ))}
      </div>

      <DataTable columns={columns} data={reviews} loading={loading} page={page} totalPages={totalPages} onPageChange={setPage} emptyMessage="No reviews yet" emptyIcon={<Star className="w-10 h-10" />} />

      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-xl p-6 max-w-sm w-full mx-4 shadow-xl">
            <h3 className="text-lg font-semibold text-gray-800 mb-2">Delete Review</h3>
            <p className="text-sm text-gray-600 mb-6">Are you sure you want to delete the review for "{confirmDelete.productName}"? This cannot be undone.</p>
            <div className="flex gap-3 justify-end">
              <button onClick={() => setConfirmDelete(null)} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg">Cancel</button>
              <button onClick={() => handleDelete(confirmDelete.id)} className="px-4 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700">Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
