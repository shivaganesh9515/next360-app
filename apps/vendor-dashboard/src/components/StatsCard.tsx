import { LucideIcon } from 'lucide-react';

interface StatsCardProps {
  icon: LucideIcon;
  label: string;
  value: string | number;
  trend?: { value: number; isUp: boolean };
  accent?: string;
}

export default function StatsCard({ icon: Icon, label, value, trend, accent = 'emerald' }: StatsCardProps) {
  const accentClasses: Record<string, string> = {
    emerald: 'from-emerald-500 to-emerald-600',
    blue: 'from-blue-500 to-blue-600',
    amber: 'from-amber-500 to-amber-600',
    rose: 'from-rose-500 to-rose-600',
    purple: 'from-purple-500 to-purple-600',
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-gray-500 mb-1">{label}</p>
          <p className="text-2xl font-bold text-gray-800">{value}</p>
          {trend && (
            <p className={`text-xs mt-1 ${trend.isUp ? 'text-emerald-600' : 'text-red-500'}`}>
              {trend.isUp ? '↑' : '↓'} {Math.abs(trend.value)}% vs last month
            </p>
          )}
        </div>
        <div className={`p-3 rounded-lg bg-gradient-to-br ${accentClasses[accent]} text-white`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
    </div>
  );
}
