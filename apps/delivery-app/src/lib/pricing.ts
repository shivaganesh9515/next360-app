// Delivery fees come from the backend already in rupees (e.g. deliveryFee: 40
// = ₹40). In __DEV__ a missing value still falls back to a clearly-labeled
// placeholder so the UI is exercisable; in production we never invent a number.
export function formatDeliveryFee(fee: number | null | undefined): string {
  if (typeof fee === 'number') {
    return `₹${fee.toLocaleString('en-IN')}`;
  }
  return __DEV__ ? '₹150 (demo)' : '—';
}

export function sumDeliveryFees(fees: Array<number | null | undefined>): string {
  if (fees.every((fee) => typeof fee !== 'number')) {
    return __DEV__ ? '₹150 (demo)' : '—';
  }
  const total = fees.reduce((sum: number, fee) => sum + (typeof fee === 'number' ? fee : 0), 0);
  return `₹${total.toLocaleString('en-IN')}`;
}
