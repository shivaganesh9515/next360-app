import { ReactNode } from 'react';

interface StatsCardProps {
  icon: ReactNode;
  title?: string;
  label?: string;
  value: string | number;
  trend?: { value: number; isUp: boolean };
  color?: string;
  accent?: string;
  loading?: boolean;
}

export default function StatsCard({ icon, title, label, value, trend, color, accent, loading }: StatsCardProps) {
  const accentLabel = color || accent || 'emerald';
  const accentClasses: Record<string, string> = {
    emerald: 'from-emerald-500 to-emerald-600',
    blue: 'from-blue-500 to-blue-600',
    amber: 'from-amber-500 to-amber-600',
    rose: 'from-rose-500 to-rose-600',
    red: 'from-red-500 to-red-600',
    purple: 'from-purple-500 to-purple-600',
  };

  const displayLabel = label || title;

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-gray-500 mb-1">{displayLabel}</p>
          <p className="text-2xl font-bold text-gray-800">{loading ? '...' : value}</p>
          {trend && (
            <p className={`text-xs mt-1 ${trend.isUp ? 'text-emerald-600' : 'text-red-500'}`}>
              {trend.isUp ? '↑' : '↓'} {Math.abs(trend.value)}% vs last month
            </p>
          )}
        </div>
        <div className={`p-3 rounded-lg bg-gradient-to-br ${accentClasses[accentLabel] || accentClasses.emerald} text-white`}>
          {icon}
        </div>
      </div>
    </div>
  );
}
