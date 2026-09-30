'use client';

import { useState, useEffect, useCallback } from 'react';
import { adminApi, type AiRecommendation } from '@/lib/api';

/**
 * The row model is exactly what GET /ai/recommendations returns — see
 * `AiRecommendation` in lib/api.ts and `Recommendation` in
 * `apps/api/src/ai/ai.service.ts`.
 *
 * This page used to model a per-user bundle (`{ id, user, products: [...] }`)
 * and then called `rec.products.slice(0, 3)`. The endpoint has never returned
 * that shape, so `.products` was always undefined and the render threw
 * "Cannot read properties of undefined (reading 'slice')", which React's error
 * boundary turned into the "Something went wrong" screen.
 */
export default function AiRecommendationsPage() {
  const [recommendations, setRecommendations] = useState<AiRecommendation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState({ startDate: '', endDate: '' });

  const fetchRecommendations = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params: Record<string, any> = {};
      if (filters.startDate) params.startDate = filters.startDate;
      if (filters.endDate) params.endDate = filters.endDate;

      // Already normalised to AiRecommendation[] by the API helper; never throws
      // on an unexpected shape, it degrades to [].
      setRecommendations(await adminApi.getAIRecommendations(params));
    } catch (err: any) {
      // Surface a real message instead of a silently empty table.
      setRecommendations([]);
      setError(err?.message || 'Could not load recommendations. Please try again.');
      console.error('[ai-recommendations] load failed', err);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => { fetchRecommendations(); }, [fetchRecommendations]);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-slate-900">AI Recommendations</h2>
        <p className="text-sm text-slate-500">View AI-generated product recommendations</p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-slate-200 p-4">
        <div className="grid grid-cols-3 gap-3">
          <input type="date" value={filters.startDate} onChange={(e) => setFilters({ ...filters, startDate: e.target.value })} className="px-3 py-2 border border-slate-200 rounded-lg text-sm" />
          <input type="date" value={filters.endDate} onChange={(e) => setFilters({ ...filters, endDate: e.target.value })} className="px-3 py-2 border border-slate-200 rounded-lg text-sm" />
          <button onClick={fetchRecommendations} className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm hover:bg-emerald-700 transition-colors">Apply Filter</button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100">
                <th className="text-left py-3 px-4 font-medium text-slate-500 text-xs uppercase">Product</th>
                <th className="text-left py-3 px-4 font-medium text-slate-500 text-xs uppercase">Reason</th>
                <th className="text-left py-3 px-4 font-medium text-slate-500 text-xs uppercase">Score</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <>
                  {[...Array(5)].map((_, i) => (
                    <tr key={i}>
                      <td colSpan={3} className="px-4 py-3">
                        <div className="h-8 bg-slate-100 rounded animate-pulse" />
                      </td>
                    </tr>
                  ))}
                </>
              ) : error ? (
                <tr><td colSpan={3} className="py-12 text-center">
                  <div className="text-sm text-red-600">{error}</div>
                  <button onClick={fetchRecommendations} className="mt-3 px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm hover:bg-emerald-700 transition-colors">Retry</button>
                </td></tr>
              ) : recommendations.length === 0 ? (
                <tr><td colSpan={3} className="py-12 text-center text-slate-400">
                  <div className="text-sm">No recommendations available</div>
                  <div className="text-xs text-slate-400 mt-1">AI-generated recommendations will appear here after user activity.</div>
                </td></tr>
              ) : (
                recommendations.map((rec) => (
                  <tr key={rec.productId} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                    <td className="py-3 px-4">
                      <div className="font-medium text-slate-800">{rec.productName}</div>
                      <div className="text-xs text-slate-400 font-mono">{rec.productId.slice(0, 8)}</div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex flex-wrap gap-1.5">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200">
                          {rec.reason || 'No reason provided'}
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap text-slate-400 tabular-nums">
                      {Math.round(rec.score * 100)}%
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
