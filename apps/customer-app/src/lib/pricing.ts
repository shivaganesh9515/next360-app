// Single source of truth for delivery-fee logic. Previously duplicated as a
// bare `DELIVERY_FEE = 40` constant in three separate places (CartScreen,
// the mini-cart bottom sheet, CheckoutScreen) — none of which ever honored
// the "FREE DELIVERY OVER ₹499" promise shown on Home's hero banner, so a
// ₹600 order was still charged ₹40 delivery at checkout.
export const BASE_DELIVERY_FEE = 40;
export const FREE_DELIVERY_THRESHOLD = 499;

export function getDeliveryFee(subtotal: number): number {
  return subtotal >= FREE_DELIVERY_THRESHOLD ? 0 : BASE_DELIVERY_FEE;
}
