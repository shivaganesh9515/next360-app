'use client';

import { useState, useEffect } from 'react';
import { Star, Filter } from 'lucide-react';
import DataTable from '@/components/DataTable';
import StatsCard from '@/components/StatsCard';
import { adminApi } from '@/lib/api';

export default function RatingsPage() {
  const [ratings, setRatings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [stats, setStats] = useState({ avgRating: 0, totalRatings: 0, fiveStarCount: 0, oneStarCount: 0 });
  const [ratingFilter, setRatingFilter] = useState<number | ''>('');
  const [productSearch, setProductSearch] = useState('');

  useEffect(() => { loadRatings(); }, [page, ratingFilter]);

  const loadRatings = async () => {
    setLoading(true);
    try {
      const params: any = { page, limit: 20 };
      if (ratingFilter !== '') params.rating = ratingFilter;
      const res = await adminApi.getRatings(params);
      setRatings(res?.data || []);
      setTotalPages(res?.meta?.totalPages || 1);
      if (res?.summary) setStats(res.summary);
    } catch { setRatings([]); } finally { setLoading(false); }
  };

  // Client-side product search filter (since API may not support it)
  const filteredRatings = productSearch
    ? ratings.filter(r => (r.product?.name || '').toLowerCase().includes(productSearch.toLowerCase()))
    : ratings;

  const columns = [
    { key: 'user', label: 'User', render: (r: any) => <span className="font-medium text-gray-800">{r.user?.name || '-'}</span> },
    { key: 'product', label: 'Product', render: (r: any) => r.product?.name || '-' },
    { key: 'rating', label: 'Rating', render: (r: any) => (
      <div className="flex items-center gap-1">{[1, 2, 3, 4, 5].map(s => <Star key={s} className={`w-3.5 h-3.5 ${s <= r.rating ? 'text-amber-500 fill-amber-500' : 'text-gray-300'}`} />)}</div>
    )},
    { key: 'createdAt', label: 'Date', render: (r: any) => new Date(r.createdAt).toLocaleDateString() },
  ];

  return (
    <div className="space-y-6">
      <div><h2 className="text-xl font-bold text-gray-800">Ratings</h2><p className="text-sm text-gray-500">Product rating overview</p></div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatsCard title="Avg Rating" value={stats.avgRating ? stats.avgRating.toFixed(1) : '0'} icon={<Star className="w-5 h-5" />} color="amber" />
        <StatsCard title="Total Ratings" value={stats.totalRatings.toString()} icon={<Star className="w-5 h-5" />} color="blue" />
        <StatsCard title="5-Star" value={stats.fiveStarCount.toString()} icon={<Star className="w-5 h-5" />} color="emerald" />
        <StatsCard title="1-Star" value={stats.oneStarCount.toString()} icon={<Star className="w-5 h-5" />} color="red" />
      </div>

      <div className="flex gap-3 flex-wrap items-center">
        <Filter className="w-4 h-4 text-gray-400" />
        <span className="text-sm text-gray-500">Rating:</span>
        {[ '', '5', '4', '3', '2', '1' ].map(r => (
          <button key={r} onClick={() => { setRatingFilter(r === '' ? '' : Number(r)); setPage(1); }}
            className={`px-3 py-1.5 text-xs rounded-lg border transition-colors ${ratingFilter === (r === '' ? '' : Number(r)) ? 'bg-amber-500 text-white border-amber-500' : 'border-gray-200 text-gray-600 hover:bg-gray-100'}`}>
            {r ? `${r} ★` : 'All'}
          </button>
        ))}
        <input
          type="text"
          placeholder="Search product name..."
          value={productSearch}
          onChange={(e) => setProductSearch(e.target.value)}
          className="px-3 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 ml-2"
        />
      </div>

      <DataTable columns={columns} data={filteredRatings} loading={loading} page={page} totalPages={totalPages} onPageChange={setPage} emptyMessage="No ratings yet" emptyIcon={<Star className="w-10 h-10" />} />
    </div>
  );
}
