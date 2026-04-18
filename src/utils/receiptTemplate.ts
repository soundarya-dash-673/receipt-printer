import type {OrderWithItems} from '../data/repositories/orderRepository';
import type {Settings} from '../domain/models';

export interface ReceiptPayload {
  shopName: string;
  logoPath: string | null;
  footer: string;
  orderNumber: number;
  orderId: string;
  createdAt: string;
  taxPercentage: number;
  items: Array<{name: string; qty: number; unitPrice: number; lineTotal: number}>;
  subtotal: number;
  taxAmount: number;
  totalAmount: number;
  paymentMethod: string;
  note?: string;
}

export function buildReceiptPayload(order: OrderWithItems, settings: Settings): ReceiptPayload {
  const items = order.items.map(i => ({
    name: i.itemName,
    qty: i.quantity,
    unitPrice: i.price,
    lineTotal: i.quantity * i.price,
  }));
  const subtotal = items.reduce((s, i) => s + i.lineTotal, 0);
  return {
    shopName: settings.shopName,
    logoPath: settings.logoPath,
    footer: settings.receiptFooter,
    orderNumber: order.order.orderNumber,
    orderId: order.order.id,
    createdAt: order.order.createdAt,
    taxPercentage: settings.taxPercentage,
    items,
    subtotal,
    taxAmount: order.order.taxAmount,
    totalAmount: order.order.totalAmount,
    paymentMethod: order.order.paymentMethod,
    note: order.order.note ?? undefined,
  };
}

export function buildReceiptHTML(payload: ReceiptPayload): string {
  const date = new Date(payload.createdAt);
  const dateStr = date.toLocaleDateString('en-US', {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
  const timeStr = date.toLocaleTimeString('en-US', {hour: '2-digit', minute: '2-digit'});

  const itemRows = payload.items
    .map(
      row => `
      <tr>
        <td class="item-name">${escapeHtml(row.name)}</td>
        <td class="item-qty">x${row.qty}</td>
        <td class="item-price">$${row.lineTotal.toFixed(2)}</td>
      </tr>
      <tr class="sub-row">
        <td colspan="2" class="item-unit">$${row.unitPrice.toFixed(2)} each</td>
        <td></td>
      </tr>`,
    )
    .join('');

  const noteSection = payload.note
    ? `<div class="note-box"><strong>Note:</strong> ${escapeHtml(payload.note)}</div>`
    : '';

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: 'Courier New', Courier, monospace;
      background: #E8ECF1;
      display: flex;
      justify-content: center;
      padding: 20px 0;
      color: #0A1A2F;
    }
    .receipt {
      background: #FFFFFF;
      width: 320px;
      max-width: 100%;
      padding: 24px 20px;
      border-radius: 16px;
      box-shadow: 0 4px 16px rgba(10, 26, 47, 0.12);
    }
    .brand { text-align: center; margin-bottom: 12px; font-size: 11px; color: #2D8CFF; font-weight: bold; letter-spacing: 2px; }
    .header { text-align: center; margin-bottom: 14px; }
    .shop-name {
      font-size: 20px;
      font-weight: bold;
      letter-spacing: 0.5px;
      color: #0A1A2F;
    }
    .restaurant-info { font-size: 11px; color: #555; margin-top: 6px; line-height: 1.5; }
    .separator { border: none; border-top: 1px dashed #B8C4D4; margin: 12px 0; }
    .order-meta { font-size: 11px; color: #555; display: flex; justify-content: space-between; margin-bottom: 4px; }
    .order-id { font-weight: bold; color: #2D8CFF; }
    table { width: 100%; border-collapse: collapse; margin: 8px 0; }
    .item-name { font-size: 13px; font-weight: bold; padding: 4px 0 1px; }
    .item-qty { font-size: 13px; text-align: center; width: 36px; }
    .item-price { font-size: 13px; text-align: right; font-weight: bold; }
    .sub-row td { padding-bottom: 6px; }
    .item-unit { font-size: 10px; color: #888; }
    .totals-table td { padding: 3px 0; font-size: 13px; }
    .totals-table .label { color: #444; }
    .totals-table .value { text-align: right; font-weight: bold; }
    .tax-row td { color: #666; font-size: 12px; }
    .total-row td { font-size: 15px; border-top: 1px dashed #999; padding-top: 8px; margin-top: 4px; }
    .pay-row { font-size: 12px; color: #0A1A2F; margin-top: 6px; }
    .note-box {
      background: #E8F4FF;
      border-left: 3px solid #2D8CFF;
      padding: 8px 10px;
      font-size: 11px;
      margin: 10px 0;
      border-radius: 4px;
    }
    .footer { text-align: center; margin-top: 18px; font-size: 12px; color: #555; }
    .thank-you { font-size: 13px; font-weight: bold; color: #0A1A2F; margin-bottom: 4px; }
  </style>
</head>
<body>
  <div class="receipt">
    <div class="brand">SLIPGO</div>
    <div class="header">
      <div class="shop-name">${escapeHtml(payload.shopName)}</div>
      <div class="restaurant-info">${dateStr} · ${timeStr}<br/>58mm receipt</div>
    </div>
    <hr class="separator" />
    <div class="order-meta">
      <span>Order #${payload.orderNumber}</span>
      <span class="order-id">${payload.orderId.slice(-8).toUpperCase()}</span>
    </div>
    <div class="pay-row">Payment: ${escapeHtml(payload.paymentMethod)}</div>
    <hr class="separator" />
    <table><tbody>${itemRows}</tbody></table>
    <hr class="separator" />
    <table class="totals-table">
      <tbody>
        <tr><td class="label">Subtotal</td><td class="value">$${payload.subtotal.toFixed(2)}</td></tr>
        <tr class="tax-row"><td class="label">Tax (${payload.taxPercentage}%)</td><td class="value">$${payload.taxAmount.toFixed(2)}</td></tr>
        <tr class="total-row"><td class="label"><strong>TOTAL</strong></td><td class="value"><strong>$${payload.totalAmount.toFixed(2)}</strong></td></tr>
      </tbody>
    </table>
    ${noteSection}
    <hr class="separator" />
    <div class="footer">
      <div class="thank-you">${escapeHtml(payload.footer)}</div>
    </div>
  </div>
</body>
</html>`;
}

export function buildESCPOSData(payload: ReceiptPayload): {
  header: string;
  items: Array<{name: string; qty: number; price: string; unitPrice: string}>;
  subtotal: string;
  tax: string;
  total: string;
  footer: string;
  orderId: string;
  dateStr: string;
  note?: string;
} {
  const date = new Date(payload.createdAt);
  const dateStr = `${date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })} ${date.toLocaleTimeString('en-US', {hour: '2-digit', minute: '2-digit'})}`;

  return {
    header: payload.shopName,
    items: payload.items.map(i => ({
      name: i.name,
      qty: i.qty,
      price: `$${i.lineTotal.toFixed(2)}`,
      unitPrice: `$${i.unitPrice.toFixed(2)}`,
    })),
    subtotal: `$${payload.subtotal.toFixed(2)}`,
    tax: `$${payload.taxAmount.toFixed(2)} (${payload.taxPercentage}%)`,
    total: `$${payload.totalAmount.toFixed(2)}`,
    footer: payload.footer,
    orderId: `#${payload.orderNumber} ${payload.orderId.slice(-8).toUpperCase()}`,
    dateStr,
    note: payload.note,
  };
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
