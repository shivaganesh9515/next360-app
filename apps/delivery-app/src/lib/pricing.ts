// A missing order.deliveryFee means the backend hasn't returned a real value
// (today, always — the delivery-partners API isn't wired up yet). Previously
// every screen fell back to a hardcoded 15000 (₹150) with no gating at all,
// so a live courier could be shown a fabricated payout indistinguishable from
// a real one. In __DEV__ we still show a clearly-labeled placeholder so the
// UI is exercisable; in production we never invent a number.
export function formatDeliveryFee(feeInPaise: number | null | undefined): string {
  if (typeof feeInPaise === 'number') {
    return `₹${(feeInPaise / 100).toLocaleString('en-IN')}`;
  }
  return __DEV__ ? '₹150 (demo)' : '—';
}

export function sumDeliveryFees(fees: Array<number | null | undefined>): string {
  if (fees.every((fee) => typeof fee !== 'number')) {
    return __DEV__ ? '₹150 (demo)' : '—';
  }
  const total = fees.reduce((sum: number, fee) => sum + (typeof fee === 'number' ? fee : 0), 0);
  return `₹${(total / 100).toLocaleString('en-IN')}`;
}
