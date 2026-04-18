import type {DraftLineItem} from '../domain/models';

/** Per-unit price including toppings (each topping price applies per item unit). */
export function effectiveUnitPrice(line: DraftLineItem): number {
  const tops = line.toppings ?? [];
  const toppingSum = tops.reduce((s, t) => s + t.price, 0);
  return line.unitPrice + toppingSum;
}

/** Line subtotal before tax */
export function lineSubtotal(line: DraftLineItem): number {
  return line.quantity * effectiveUnitPrice(line);
}

export function calcTotals(lines: DraftLineItem[], taxPercentage: number) {
  const subtotal = lines.reduce((s, l) => s + lineSubtotal(l), 0);
  const taxAmount = subtotal * (taxPercentage / 100);
  const total = subtotal + taxAmount;
  return {subtotal, taxAmount, total};
}
