import type {DraftLineItem} from '../domain/models';

export function calcTotals(lines: DraftLineItem[], taxPercentage: number) {
  const subtotal = lines.reduce((s, l) => s + l.quantity * l.unitPrice, 0);
  const taxAmount = subtotal * (taxPercentage / 100);
  const total = subtotal + taxAmount;
  return {subtotal, taxAmount, total};
}
