interface StatusBadgeProps {
  status: string;
}

const statusStyles: Record<string, string> = {
  PENDING: 'bg-yellow-100 text-yellow-700',
  APPROVED: 'bg-emerald-100 text-emerald-700',
  REJECTED: 'bg-red-100 text-red-700',
  SUSPENDED: 'bg-orange-100 text-orange-700',
  PLACED: 'bg-blue-100 text-blue-700',
  CONFIRMED: 'bg-indigo-100 text-indigo-700',
  PACKED: 'bg-purple-100 text-purple-700',
  ASSIGNED_TO_DELIVERY: 'bg-cyan-100 text-cyan-700',
  PICKED_UP: 'bg-sky-100 text-sky-700',
  OUT_FOR_DELIVERY: 'bg-orange-100 text-orange-700',
  DELIVERED: 'bg-emerald-100 text-emerald-700',
  CANCELLED: 'bg-red-100 text-red-700',
  REFUNDED: 'bg-slate-100 text-slate-700',
  PAID: 'bg-emerald-100 text-emerald-700',
  FAILED: 'bg-red-100 text-red-700',
  ACTIVE: 'bg-emerald-100 text-emerald-700',
  INACTIVE: 'bg-slate-100 text-slate-500',
  'IN STOCK': 'bg-emerald-100 text-emerald-700',
  'OUT OF STOCK': 'bg-red-100 text-red-700',
  true: 'bg-emerald-100 text-emerald-700',
  false: 'bg-slate-100 text-slate-500',
  VERIFIED: 'bg-emerald-100 text-emerald-700',
  PENDING_REVIEW: 'bg-yellow-100 text-yellow-700',
  INCOMPLETE: 'bg-slate-100 text-slate-600',
  EXPIRED: 'bg-orange-100 text-orange-700',
};

export default function StatusBadge({ status }: StatusBadgeProps) {
  const style = statusStyles[status] || 'bg-slate-100 text-slate-600';
  return (
    <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium ${style}`}>
      {status.replace(/_/g, ' ')}
    </span>
  );
}
