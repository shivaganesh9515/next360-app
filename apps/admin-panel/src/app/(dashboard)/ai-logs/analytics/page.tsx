'use client';

import { useState, useEffect } from 'react';
import AdminHeader from '@/components/AdminHeader';
import AdminSidebar from '@/components/AdminSidebar';

interface Analytics {
  totalInteractions: number;
  interactionsByType: { type: string; count: number }[];
  popularQueries: { query: string; count: number }[];
}

export default function AiAnalyticsPage() {
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState({ start: '', end: '' });

  useEffect(() => {
    fetchAnalytics();
  }, [dateRange]);

  const fetchAnalytics = async () => {
    try {
      const params = new URLSearchParams();
      if (dateRange.start) params.append('start', dateRange.start);
      if (dateRange.end) params.append('end', dateRange.end);

      const response = await fetch(`/api/ai/admin/analytics?${params}`);
      const data = await response.json();
      setAnalytics(data);
    } catch (error) {
      console.error('Failed to fetch analytics:', error);
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

  return (
    <div className="flex h-screen bg-gray-50">
      <AdminSidebar />
      <div className="flex-1 overflow-auto">
        <AdminHeader title="AI Analytics" />
        
        <div className="p-6">
          {/* Date Range Filter */}
          <div className="bg-white rounded-lg shadow p-4 mb-6">
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                <input
                  type="date"
                  value={dateRange.start}
                  onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
                  className="w-full border rounded-lg px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                <input
                  type="date"
                  value={dateRange.end}
                  onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
                  className="w-full border rounded-lg px-3 py-2"
                />
              </div>
              <div className="flex items-end">
                <button
                  onClick={fetchAnalytics}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                >
                  Apply Filter
                </button>
              </div>
            </div>
          </div>

          {loading ? (
            <div className="text-center py-12 text-gray-500">Loading analytics...</div>
          ) : analytics ? (
            <>
              {/* Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
                <div className="bg-white rounded-lg shadow p-6">
                  <div className="text-sm font-medium text-gray-500">Total Interactions</div>
                  <div className="mt-2 text-3xl font-bold text-gray-900">{analytics.totalInteractions}</div>
                </div>
                {analytics.interactionsByType.slice(0, 3).map((item) => (
                  <div key={item.type} className="bg-white rounded-lg shadow p-6">
                    <div className="text-sm font-medium text-gray-500">{getTypeLabel(item.type)}</div>
                    <div className="mt-2 text-3xl font-bold text-gray-900">{item.count}</div>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Feature Breakdown */}
                <div className="bg-white rounded-lg shadow p-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Feature Usage Breakdown</h3>
                  <div className="space-y-4">
                    {analytics.interactionsByType.map((item) => {
                      const percentage = (item.count / analytics.totalInteractions) * 100;
                      return (
                        <div key={item.type}>
                          <div className="flex justify-between mb-1">
                            <span className="text-sm text-gray-700">{getTypeLabel(item.type)}</span>
                            <span className="text-sm text-gray-500">{item.count} ({percentage.toFixed(1)}%)</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                              className={`${getTypeColor(item.type)} h-2 rounded-full`}
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Popular Queries */}
                <div className="bg-white rounded-lg shadow p-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Popular Queries</h3>
                  <div className="space-y-3">
                    {analytics.popularQueries.slice(0, 10).map((item, index) => (
                      <div key={index} className="flex items-center justify-between">
                        <div className="flex items-center">
                          <span className="text-sm font-medium text-gray-500 w-6">{index + 1}.</span>
                          <span className="text-sm text-gray-900 truncate max-w-xs">{item.query}</span>
                        </div>
                        <span className="text-sm text-gray-500">{item.count}</span>
                      </div>
                    ))}
                    {analytics.popularQueries.length === 0 && (
                      <div className="text-center text-gray-500 py-4">No queries recorded yet</div>
                    )}
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="text-center py-12 text-gray-500">No analytics data available</div>
          )}
        </div>
      </div>
    </div>
  );
}
