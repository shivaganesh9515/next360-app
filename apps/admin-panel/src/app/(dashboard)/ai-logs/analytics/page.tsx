'use client';

import { useState, useEffect } from 'react';
import { adminApi } from '@/lib/api';

interface Analytics {
  totalInteractions: number;
  interactionsByType: { type: string; count: number }[];
  popularQueries: { query: string; count: number }[];
}

export default function AiAnalyticsPage() {
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState({ start: '', end: '' });

  useEffect(() => { fetchAnalytics(); }, [dateRange]);

  const fetchAnalytics = async () => {
    try {
      const params: Record<string, any> = {};
      if (dateRange.start) params.start = dateRange.start;
      if (dateRange.end) params.end = dateRange.end;

      const res = await adminApi.getAIAnalytics(params);
      setAnalytics(res as any);
    } catch {
      // Analytics unavailable
    } finally {
      setLoading(false);
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'CHAT': return 'Chat';
      case 'SCANNER': return 'Scanner';
      case 'RECOMMENDATION': return 'Recommendation';
      case 'HEALTH_INSIGHT': return 'Health Insight';
      default: return type;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'CHAT': return 'bg-blue-500';
      case 'SCANNER': return 'bg-green-500';
      case 'RECOMMENDATION': return 'bg-purple-500';
      case 'HEALTH_INSIGHT': return 'bg-orange-500';
      default: return 'bg-gray-500';
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div><h2 className="text-xl font-bold text-slate-900">AI Analytics</h2><p className="text-sm text-slate-500">Usage analytics for AI features</p></div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => <div key={i} className="h-24 bg-slate-100 rounded-xl animate-pulse" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-slate-900">AI Analytics</h2>
        <p className="text-sm text-slate-500">Usage analytics for AI features</p>
      </div>

      {/* Date Range Filter */}
      <div className="bg-white rounded-xl border border-slate-200 p-4">
        <div className="grid grid-cols-3 gap-3">
          <input type="date" value={dateRange.start} onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })} className="px-3 py-2 border border-slate-200 rounded-lg text-sm" />
          <input type="date" value={dateRange.end} onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })} className="px-3 py-2 border border-slate-200 rounded-lg text-sm" />
          <button onClick={fetchAnalytics} className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm hover:bg-emerald-700 transition-colors">Apply Filter</button>
        </div>
      </div>

      {analytics ? (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white rounded-xl border border-slate-200 p-5">
              <p className="text-xs text-slate-500 font-medium">Total Interactions</p>
              <p className="text-2xl font-bold text-slate-900 tabular-nums mt-1">{analytics.totalInteractions}</p>
            </div>
            {analytics.interactionsByType.slice(0, 3).map((item) => (
              <div key={item.type} className="bg-white rounded-xl border border-slate-200 p-5">
                <p className="text-xs text-slate-500 font-medium">{getTypeLabel(item.type)}</p>
                <p className="text-2xl font-bold text-slate-900 tabular-nums mt-1">{item.count}</p>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Feature Breakdown */}
            <div className="bg-white rounded-xl border border-slate-200 p-6">
              <h3 className="font-semibold text-slate-800 mb-4">Feature Usage Breakdown</h3>
              <div className="space-y-4">
                {analytics.interactionsByType.map((item) => {
                  const percentage = analytics.totalInteractions > 0 ? (item.count / analytics.totalInteractions) * 100 : 0;
                  return (
                    <div key={item.type}>
                      <div className="flex justify-between mb-1">
                        <span className="text-sm text-slate-700">{getTypeLabel(item.type)}</span>
                        <span className="text-sm text-slate-500 tabular-nums">{item.count} ({percentage.toFixed(1)}%)</span>
                      </div>
                      <div className="w-full bg-slate-100 rounded-full h-2">
                        <div className={`${getTypeColor(item.type)} h-2 rounded-full transition-all duration-500`} style={{ width: `${percentage}%` }} />
                      </div>
                    </div>
                  );
                })}
                {analytics.interactionsByType.length === 0 && (
                  <p className="text-sm text-slate-400 text-center py-4">No interactions recorded yet</p>
                )}
              </div>
            </div>

            {/* Popular Queries */}
            <div className="bg-white rounded-xl border border-slate-200 p-6">
              <h3 className="font-semibold text-slate-800 mb-4">Popular Queries</h3>
              <div className="space-y-3">
                {analytics.popularQueries.slice(0, 10).map((item, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-400 w-5 tabular-nums">{index + 1}</span>
                      <span className="text-sm text-slate-700 truncate max-w-[250px]">{item.query}</span>
                    </div>
                    <span className="text-sm text-slate-500 tabular-nums">{item.count}</span>
                  </div>
                ))}
                {analytics.popularQueries.length === 0 && (
                  <p className="text-sm text-slate-400 text-center py-4">No queries recorded yet</p>
                )}
              </div>
            </div>
          </div>
        </>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center text-slate-400">No analytics data available</div>
      )}
    </div>
  );
}
