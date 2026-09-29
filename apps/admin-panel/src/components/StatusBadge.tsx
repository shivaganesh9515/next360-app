interface StatusBadgeProps {
  status: string;
  color?: string;
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
  REFUNDED: 'bg-gray-100 text-gray-700',
  PAID: 'bg-emerald-100 text-emerald-700',
  FAILED: 'bg-red-100 text-red-700',
  ACTIVE: 'bg-emerald-100 text-emerald-700',
  INACTIVE: 'bg-gray-100 text-gray-500',
  AVAILABLE: 'bg-emerald-100 text-emerald-700',
  OFFLINE: 'bg-gray-100 text-gray-500',
  ON_DELIVERY: 'bg-orange-100 text-orange-700',
  ORGANIC: 'bg-emerald-100 text-emerald-700',
  NATURAL: 'bg-amber-100 text-amber-700',
  ECO_FRIENDLY: 'bg-teal-100 text-teal-700',
  CUSTOMER: 'bg-blue-100 text-blue-700',
  VENDOR: 'bg-purple-100 text-purple-700',
  DELIVERY_PARTNER: 'bg-orange-100 text-orange-700',
  ADMIN: 'bg-red-100 text-red-700',
  true: 'bg-emerald-100 text-emerald-700',
  false: 'bg-gray-100 text-gray-500',
  VERIFIED: 'bg-emerald-100 text-emerald-700',
  PENDING_REVIEW: 'bg-yellow-100 text-yellow-700',
  INCOMPLETE: 'bg-gray-100 text-gray-600',
  EXPIRED: 'bg-orange-100 text-orange-700',
};

export default function StatusBadge({ status, color }: StatusBadgeProps) {
  // `status` comes straight off API records, and several endpoints omit it
  // entirely (the products list, for example, returns no `storeType` field).
  // Calling .replace() on undefined threw a TypeError that tripped the route
  // error boundary and replaced the whole page with "Something went wrong",
  // so normalise here — one shared component, every page protected.
  const key = status === null || status === undefined ? '' : String(status);
  const style = color || statusStyles[key] || 'bg-gray-100 text-gray-600';
  const label = key ? key.replace(/_/g, ' ') : '—';
  return (
    <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium ${style}`}>
      {label}
    </span>
  );
}
