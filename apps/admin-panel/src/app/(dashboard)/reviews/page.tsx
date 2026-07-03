'use client';

import { useState, useEffect } from 'react';
import { Star, MessageSquare } from 'lucide-react';
import DataTable from '@/components/DataTable';
import StatsCard from '@/components/StatsCard';
import { adminApi } from '@/lib/api';

export default function ReviewsPage() {
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [stats, setStats] = useState({ totalReviews: 0, avgRating: 0, flaggedCount: 0 });

  useEffect(() => { loadReviews(); }, [page]);

  const loadReviews = async () => {
    setLoading(true);
    try {
      const res = await adminApi.getReviews({ page, limit: 20 });
      setReviews(res?.data || []);
      setTotalPages(res?.meta?.totalPages || 1);
      if (res?.summary) setStats(res.summary);
    } catch { setReviews([]); } finally { setLoading(false); }
  };

  const columns = [
    { key: 'user', label: 'User', render: (r: any) => <span className="font-medium text-gray-800">{r.user?.name || '-'}</span> },
    { key: 'product', label: 'Product', render: (r: any) => r.product?.name || '-' },
    { key: 'rating', label: 'Rating', render: (r: any) => (
      <div className="flex items-center gap-1">{[1, 2, 3, 4, 5].map(s => <Star key={s} className={`w-3.5 h-3.5 ${s <= r.rating ? 'text-amber-500 fill-amber-500' : 'text-gray-300'}`} />)}</div>
    )},
    { key: 'comment', label: 'Review', render: (r: any) => <p className="text-sm text-gray-600 line-clamp-2">{r.comment || 'No comment'}</p> },
    { key: 'createdAt', label: 'Date', render: (r: any) => new Date(r.createdAt).toLocaleDateString() },
  ];

  return (
    <div className="space-y-6">
      <div><h2 className="text-xl font-bold text-gray-800">Reviews</h2><p className="text-sm text-gray-500">Moderate product reviews</p></div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatsCard title="Total Reviews" value={stats.totalReviews.toString()} icon={<MessageSquare className="w-5 h-5" />} color="blue" />
        <StatsCard title="Avg Rating" value={stats.avgRating ? stats.avgRating.toFixed(1) : '0'} icon={<Star className="w-5 h-5" />} color="amber" />
        <StatsCard title="Flagged" value={stats.flaggedCount.toString()} icon={<MessageSquare className="w-5 h-5" />} color="red" />
      </div>

      <DataTable columns={columns} data={reviews} loading={loading} page={page} totalPages={totalPages} onPageChange={setPage} emptyMessage="No reviews yet" emptyIcon={<Star className="w-10 h-10" />} />
    </div>
  );
}
