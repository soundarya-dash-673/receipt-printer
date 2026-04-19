/** Display label for a topping price (0 = free). */
export function formatToppingPriceLabel(price: number | string): string {
  const n = Number(price);
  if (!Number.isFinite(n) || n <= 0) {
    return 'FREE';
  }
  return `+$${n.toFixed(2)}`;
}
