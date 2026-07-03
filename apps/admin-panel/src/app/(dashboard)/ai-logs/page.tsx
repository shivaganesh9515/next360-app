'use client';

import { useState, useEffect } from 'react';
import { Bot, MessageSquare, Image, Sparkles } from 'lucide-react';
import DataTable from '@/components/DataTable';
import StatsCard from '@/components/StatsCard';
import { adminApi } from '@/lib/api';

export default function AILogsPage() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [stats, setStats] = useState({ totalQueries: 0, chatCount: 0, scanCount: 0, avgTokens: 0 });

  useEffect(() => { loadLogs(); }, [page]);

  const loadLogs = async () => {
    setLoading(true);
    try {
      const res = await adminApi.getAILogs({ page, limit: 20 });
      setLogs(res?.data || []);
      setTotalPages(res?.meta?.totalPages || 1);
      if (res?.summary) setStats(res.summary);
    } catch { setLogs([]); } finally { setLoading(false); }
  };

  const typeIcons: Record<string, any> = { CHAT: MessageSquare, SCAN: Image, RECOMMENDATION: Sparkles };
  const typeColors: Record<string, string> = { CHAT: 'text-blue-600 bg-blue-50', SCAN: 'text-purple-600 bg-purple-50', RECOMMENDATION: 'text-amber-600 bg-amber-50' };

  const columns = [
    { key: 'type', label: 'Type', render: (l: any) => {
      const Icon = typeIcons[l.type] || Bot;
      return <div className={`p-1.5 rounded-lg inline-flex ${typeColors[l.type] || ''}`}><Icon className="w-4 h-4" /></div>;
    }},
    { key: 'user', label: 'User', render: (l: any) => <span className="text-sm">{l.user?.name || '-'}</span> },
    { key: 'query', label: 'Query', render: (l: any) => <p className="text-sm text-gray-600 line-clamp-1">{l.query || l.prompt || '-'}</p> },
    { key: 'tokensUsed', label: 'Tokens', render: (l: any) => <span className="font-mono text-xs">{l.tokensUsed || '-'}</span> },
    { key: 'duration', label: 'Duration', render: (l: any) => <span className="font-mono text-xs">{l.duration ? `${l.duration}ms` : '-'}</span> },
    { key: 'createdAt', label: 'Time', render: (l: any) => new Date(l.createdAt).toLocaleString() },
  ];

  return (
    <div className="space-y-6">
      <div><h2 className="text-xl font-bold text-gray-800">AI Logs</h2><p className="text-sm text-gray-500">Monitor AI feature usage and performance</p></div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatsCard title="Total Queries" value={stats.totalQueries.toString()} icon={<Bot className="w-5 h-5" />} color="blue" />
        <StatsCard title="Chat Queries" value={stats.chatCount.toString()} icon={<MessageSquare className="w-5 h-5" />} color="emerald" />
        <StatsCard title="Image Scans" value={stats.scanCount.toString()} icon={<Image className="w-5 h-5" />} color="purple" />
        <StatsCard title="Avg Tokens" value={stats.avgTokens.toString()} icon={<Sparkles className="w-5 h-5" />} color="amber" />
      </div>

      <DataTable columns={columns} data={logs} loading={loading} page={page} totalPages={totalPages} onPageChange={setPage} emptyMessage="No AI logs yet" emptyIcon={<Bot className="w-10 h-10" />} />
    </div>
  );
}
