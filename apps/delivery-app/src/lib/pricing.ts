// deliveryFee/totalEarnings from the backend are already in RUPEES (the API
// computes items + flat DELIVERY_FEE = ₹40 per delivery). These helpers format
// rupees directly — never a paise/100 conversion.
//
// A missing deliveryFee still means the backend couldn't supply a real value.
// In __DEV__ we show a clearly-labeled placeholder so the UI is exercisable;
// in production we never invent a number.
export function formatDeliveryFee(feeInRupees: number | null | undefined): string {
  if (typeof feeInRupees === 'number') {
    return `₹${feeInRupees.toLocaleString('en-IN')}`;
  }
  return __DEV__ ? '₹40 (demo)' : '—';
}

export function sumDeliveryFees(fees: Array<number | null | undefined>): string {
  if (fees.every((fee) => typeof fee !== 'number')) {
    return __DEV__ ? '₹40 (demo)' : '—';
  }
  const total = fees.reduce((sum: number, fee) => sum + (typeof fee === 'number' ? fee : 0), 0);
  return `₹${total.toLocaleString('en-IN')}`;
}