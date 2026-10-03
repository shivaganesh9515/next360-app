'use client';

import { useState, useEffect } from 'react';
import { Star } from 'lucide-react';
import DataTable from '@/components/DataTable';
import StatsCard from '@/components/StatsCard';
import { adminApi, type AdminReview } from '@/lib/api';

const LIMIT = 20;

/**
 * GET /reviews/ratings is the aggregate view and returns:
 *
 *   data.items        AdminReview[]
 *   data.summary      { averageRating, totalReviews, minRating, maxRating }
 *   data.distribution [ { rating: 1..5, count, percentage } ]
 *   meta              { page, limit, total, totalPages }
 *
 * Note the real property names: `averageRating` / `totalReviews`, and a
 * `distribution` array — there is no `avgRating`, `totalRatings`,
 * `fiveStarCount` or `oneStarCount`. This endpoint also accepts no `rating`
 * filter, so `summary` and `distribution` are always global across all reviews.
 */
const EMPTY_SUMMARY = { averageRating: 0, totalReviews: 0, minRating: 0, maxRating: 0 };

export default function RatingsPage() {
  const [rows, setRows] = useState<AdminReview[]>([]);
  const [distribution, setDistribution] = useState<Record<number, { count: number; percentage: number }>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [summary, setSummary] = useState(EMPTY_SUMMARY);

  const loadRatings = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await adminApi.getRatings({ page, limit: LIMIT });

      setRows(res.items);
      setTotalPages(res.totalPages);

      // Merged with defaults, never replaced wholesale — keeps
      // `summary.averageRating` a number so `.toFixed()` below cannot throw.
      setSummary((prev) => ({ ...EMPTY_SUMMARY, ...(res.summary || {}) }));

      const byRating: Record<number, { count: number; percentage: number }> = {};
      for (const d of res.distribution || []) {
        byRating[d.rating] = { count: d.count, percentage: d.percentage };
      }
      setDistribution(byRating);
    } catch (err: any) {
      setRows([]);
      setTotalPages(1);
      setDistribution({});
      setSummary((prev) => ({ ...EMPTY_SUMMARY }));
      setError(err?.message || 'Could not load ratings.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadRatings(); }, [page]);

  const countFor = (n: number) => distribution[n]?.count ?? 0;
  const pctFor = (n: number) => distribution[n]?.percentage ?? 0;

  const columns = [
    { key: 'user', label: 'User', render: (r: AdminReview) => <span className="font-medium text-gray-800">{r.user?.name || '-'}</span> },
    { key: 'product', label: 'Product', render: (r: AdminReview) => r.product?.name || '-' },
    { key: 'rating', label: 'Rating', render: (r: AdminReview) => (
      <div className="flex items-center gap-1">{[1, 2, 3, 4, 5].map(s => <Star key={s} className={`w-3.5 h-3.5 ${s <= r.rating ? 'text-amber-500 fill-amber-500' : 'text-gray-300'}`} />)}</div>
    )},
    { key: 'createdAt', label: 'Date', render: (r: AdminReview) => (r.createdAt ? new Date(r.createdAt).toLocaleDateString() : '-') },
  ];

  return (
    <div className="space-y-6">
      <div><h2 className="text-xl font-bold text-gray-800">Ratings</h2><p className="text-sm text-gray-500">Product rating overview</p></div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatsCard title="Avg Rating" value={summary.averageRating.toFixed(1)} icon={<Star className="w-5 h-5" />} color="amber" />
        <StatsCard title="Total Ratings" value={summary.totalReviews.toString()} icon={<Star className="w-5 h-5" />} color="blue" />
        <StatsCard title="Highest" value={summary.maxRating ? `${summary.maxRating} ★` : '-'} icon={<Star className="w-5 h-5" />} color="emerald" />
        <StatsCard title="Lowest" value={summary.minRating ? `${summary.minRating} ★` : '-'} icon={<Star className="w-5 h-5" />} color="red" />
      </div>

      <div className="bg-white border border-gray-200 rounded-xl p-4">
        <h3 className="text-sm font-semibold text-gray-800 mb-3">Rating distribution</h3>
        <div className="space-y-2">
          {[5, 4, 3, 2, 1].map(n => {
            const count = countFor(n);
            const pct = pctFor(n);
            return (
              <div key={n} className="flex items-center gap-3">
                <span className="w-10 shrink-0 text-xs font-medium text-gray-600 flex items-center gap-1">
                  {n} <Star className="w-3 h-3 text-amber-500 fill-amber-500" />
                </span>
                <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full bg-amber-500 rounded-full" style={{ width: `${Math.min(100, Math.max(0, pct))}%` }} />
                </div>
                <span className="w-24 shrink-0 text-xs text-gray-500 text-right">{count} ({pct}%)</span>
              </div>
            );
          })}
        </div>
      </div>

      <DataTable
        columns={columns}
        data={rows}
        loading={loading}
        page={page}
        totalPages={totalPages}
        onPageChange={setPage}
        emptyMessage={error ? `Could not load ratings — ${error}` : 'No ratings yet'}
        emptyIcon={<Star className="w-10 h-10" />}
      />
    </div>
  );
}