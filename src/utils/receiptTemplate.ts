import {Order, unitPriceForLine} from '../context/AppContext';

/** Subtotal / tax / total derived from line items (source of truth for printed receipts). */
export function computeReceiptTotals(order: Order): {
  subtotal: number;
  taxAmount: number;
  total: number;
} {
  const subtotal = order.items.reduce((sum, ci) => {
    const unit = unitPriceForLine(ci.menuItem, ci.selectedToppings ?? []);
    return sum + unit * ci.quantity;
  }, 0);
  const taxAmount = subtotal * (order.taxRate / 100);
  const total = subtotal + taxAmount;
  return {subtotal, taxAmount, total};
}

/**
 * Generates an HTML string for a receipt.
 * Used for both PDF export and WebView preview.
 */
export function buildReceiptHTML(order: Order): string {
  const date = new Date(order.createdAt);
  const dateStr = date.toLocaleDateString('en-US', {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
  const timeStr = date.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
  });

  const totals = computeReceiptTotals(order);

  const itemRows = order.items
    .map(ci => {
      const selected = ci.selectedToppings ?? [];
      const unit = unitPriceForLine(ci.menuItem, selected);
      const lineTotal = unit * ci.quantity;
      const toppingRows =
        selected.length > 0
          ? selected
              .map(
                t => {
                  const p = Number(t.price) || 0;
                  const priceCell = p <= 0 ? 'FREE' : `$${p.toFixed(2)}`;
                  return `
      <tr class="topping-row">
        <td colspan="2" class="topping-name">+ ${escapeHtml(t.name)}</td>
        <td class="topping-price">${priceCell}</td>
      </tr>`;
                },
              )
              .join('')
          : '';
      return `
      <tr>
        <td class="item-name">${escapeHtml(ci.menuItem.name)}</td>
        <td class="item-qty">x${ci.quantity}</td>
        <td class="item-price">$${lineTotal.toFixed(2)}</td>
      </tr>
      ${toppingRows}
      <tr class="sub-row">
        <td colspan="2" class="item-unit">$${unit.toFixed(2)} each</td>
        <td></td>
      </tr>
    `;
    })
    .join('');

  const noteSection = order.note
    ? `<div class="note-box"><strong>Note:</strong> ${escapeHtml(order.note)}</div>`
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
      background: #f5f5f5;
      display: flex;
      justify-content: center;
      padding: 20px 0;
    }
    .receipt {
      background: #fff;
      width: 320px;
      padding: 24px 20px;
      border-radius: 4px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.12);
    }
    .header { text-align: center; margin-bottom: 18px; }
    .restaurant-name {
      font-size: 20px;
      font-weight: bold;
      letter-spacing: 1px;
      text-transform: uppercase;
      color: #1a1a1a;
    }
    .restaurant-info {
      font-size: 11px;
      color: #555;
      margin-top: 4px;
      line-height: 1.5;
    }
    .separator {
      border: none;
      border-top: 1px dashed #999;
      margin: 12px 0;
    }
    .order-meta {
      font-size: 11px;
      color: #555;
      display: flex;
      justify-content: space-between;
      margin-bottom: 4px;
    }
    .order-id { font-weight: bold; color: #333; }
    table {
      width: 100%;
      border-collapse: collapse;
      margin: 8px 0;
    }
    .item-name { font-size: 13px; font-weight: bold; padding: 4px 0 1px; color: #1a1a1a; }
    .item-qty { font-size: 13px; text-align: center; width: 36px; }
    .item-price { font-size: 13px; text-align: right; font-weight: bold; color: #1a1a1a; }
    .sub-row td { padding-bottom: 6px; }
    .item-unit { font-size: 10px; color: #888; }
    .topping-row td { padding: 2px 0 2px 10px; font-size: 11px; }
    .topping-name { color: #444; }
    .topping-price { text-align: right; color: #666; }
    .totals-table td { padding: 3px 0; font-size: 13px; }
    .totals-table .label { color: #444; }
    .totals-table .value { text-align: right; font-weight: bold; }
    .totals-table .tax-row td { color: #666; font-size: 12px; }
    .totals-table .total-row td { font-size: 15px; color: #1a1a1a; border-top: 1px dashed #999; padding-top: 6px; margin-top: 4px; }
    .note-box {
      background: #FFF9C4;
      border-left: 3px solid #F9A825;
      padding: 8px 10px;
      font-size: 11px;
      margin: 10px 0;
      border-radius: 2px;
    }
    .footer {
      text-align: center;
      margin-top: 18px;
      font-size: 12px;
      color: #555;
    }
    .thank-you {
      font-size: 14px;
      font-weight: bold;
      color: #333;
      margin-bottom: 4px;
    }
  </style>
</head>
<body>
  <div class="receipt">
    <!-- Header -->
    <div class="header">
      <div class="restaurant-name">${escapeHtml(order.restaurantName)}</div>
      <div class="restaurant-info">
        Order Receipt<br/>
        ${dateStr} &bull; ${timeStr}
      </div>
    </div>

    <hr class="separator" />

    <!-- Order ID -->
    <div class="order-meta">
      <span>Order #</span>
      <span class="order-id">${order.id.slice(-8).toUpperCase()}</span>
    </div>

    <hr class="separator" />

    <!-- Items -->
    <table>
      <tbody>${itemRows}</tbody>
    </table>

    <hr class="separator" />

    <!-- Totals -->
    <table class="totals-table">
      <tbody>
        <tr>
          <td class="label">Subtotal</td>
          <td class="value">$${totals.subtotal.toFixed(2)}</td>
        </tr>
        <tr class="tax-row">
          <td class="label">Tax (${order.taxRate}%)</td>
          <td class="value">$${totals.taxAmount.toFixed(2)}</td>
        </tr>
        <tr class="total-row">
          <td class="label"><strong>TOTAL</strong></td>
          <td class="value"><strong>$${totals.total.toFixed(2)}</strong></td>
        </tr>
      </tbody>
    </table>

    ${noteSection}

    <hr class="separator" />

    <!-- Footer -->
    <div class="footer">
      <div class="thank-you">Thank You!</div>
      <div>Please come again</div>
    </div>
  </div>
</body>
</html>`;
}

export interface EscPosItemLine {
  name: string;
  qty: number;
  price: string;
  unitPrice: string;
  toppingLines?: Array<{name: string; priceLabel: string}>;
}

/**
 * Generates ESC/POS-compatible text commands for thermal printer.
 */
export function buildESCPOSData(order: Order): {
  header: string;
  items: EscPosItemLine[];
  subtotal: string;
  tax: string;
  total: string;
  footer: string;
  orderId: string;
  dateStr: string;
  note?: string;
} {
  const date = new Date(order.createdAt);
  const dateStr = `${date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })} ${date.toLocaleTimeString('en-US', {hour: '2-digit', minute: '2-digit'})}`;

  const totals = computeReceiptTotals(order);

  const items: EscPosItemLine[] = order.items.map(ci => {
    const selected = ci.selectedToppings ?? [];
    const unit = unitPriceForLine(ci.menuItem, selected);
    return {
      name: ci.menuItem.name,
      qty: ci.quantity,
      price: `$${(unit * ci.quantity).toFixed(2)}`,
      unitPrice: `$${unit.toFixed(2)}`,
      toppingLines:
        selected.length > 0
          ? selected.map(t => {
              const p = Number(t.price) || 0;
              return {
                name: t.name,
                priceLabel: p <= 0 ? 'FREE' : `$${p.toFixed(2)}`,
              };
            })
          : undefined,
    };
  });

  return {
    header: order.restaurantName,
    items,
    subtotal: `$${totals.subtotal.toFixed(2)}`,
    tax: `$${totals.taxAmount.toFixed(2)} (${order.taxRate}%)`,
    total: `$${totals.total.toFixed(2)}`,
    footer: 'Thank you! Please come again.',
    orderId: order.id.slice(-8).toUpperCase(),
    dateStr,
    note: order.note,
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
