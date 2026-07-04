'use client';

import { useState, useEffect } from 'react';
import { adminApi } from '@/lib/api';

interface Recommendation {
  id: string;
  userId: string;
  user?: { id: string; name: string; email: string };
  products: { id: string; name: string; reason: string; score: number }[];
  createdAt: string;
}

export default function AiRecommendationsPage() {
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ startDate: '', endDate: '' });

  useEffect(() => { fetchRecommendations(); }, [filters]);

  const fetchRecommendations = async () => {
    try {
      const params: Record<string, any> = {};
      if (filters.startDate) params.startDate = filters.startDate;
      if (filters.endDate) params.endDate = filters.endDate;

      const res = await adminApi.getAIRecommendations(params);
      const data = res as any;
      setRecommendations(data.recommendations || data.data || (Array.isArray(data) ? data : []));
    } catch {
      // Recommendations unavailable
    } finally {
      setLoading(false);
    }
  };

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
                <th className="text-left py-3 px-4 font-medium text-slate-500 text-xs uppercase">User</th>
                <th className="text-left py-3 px-4 font-medium text-slate-500 text-xs uppercase">Recommended Products</th>
                <th className="text-left py-3 px-4 font-medium text-slate-500 text-xs uppercase">Date</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={3} className="py-12 text-center text-slate-400">Loading...</td></tr>
              ) : recommendations.length === 0 ? (
                <tr><td colSpan={3} className="py-12 text-center text-slate-400">No recommendations found</td></tr>
              ) : (
                recommendations.map((rec) => (
                  <tr key={rec.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                    <td className="py-3 px-4">
                      <div className="font-medium text-slate-800">{rec.user?.name || 'Unknown'}</div>
                      <div className="text-xs text-slate-400">{rec.user?.email}</div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex flex-wrap gap-1.5">
                        {rec.products.slice(0, 3).map((product) => (
                          <span key={product.id} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200">
                            {product.name}
                          </span>
                        ))}
                        {rec.products.length > 3 && (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-600">
                            +{rec.products.length - 3} more
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap text-slate-400 tabular-nums">
                      {new Date(rec.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
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
