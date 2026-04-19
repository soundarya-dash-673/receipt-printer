import {Platform} from 'react-native';
import RNHTMLtoPDF from 'react-native-html-to-pdf';
import Share from 'react-native-share';
import type {OrderEntity} from '../domain/models';
import {appPalette} from '../theme/slipgoTheme';
import {openHtmlPrintWindow} from './webHtmlPrint';

export async function exportOrdersReportPdf(
  orders: OrderEntity[],
  title: string,
): Promise<{success: boolean; error?: string}> {
  const rows = orders
    .map(
      o => `<tr>
      <td>#${o.orderNumber}</td>
      <td>${new Date(o.createdAt).toLocaleString()}</td>
      <td>${escape(o.paymentMethod)}</td>
      <td style="text-align:right">$${o.totalAmount.toFixed(2)}</td>
    </tr>`,
    )
    .join('');

  const html = `<!DOCTYPE html><html><head><meta charset="utf-8"/>
  <style>
    body { font-family: system-ui, sans-serif; padding: 24px; color: ${appPalette.onSurface}; }
    h1 { color: ${appPalette.primary}; font-size: 18px; }
    table { width: 100%; border-collapse: collapse; margin-top: 16px; font-size: 12px; }
    th, td { border: 1px solid ${appPalette.borderSoft}; padding: 8px; text-align: left; }
    th { background: ${appPalette.background}; }
  </style></head><body>
  <h1>SlipGo — ${escape(title)}</h1>
  <p>${orders.length} orders</p>
  <table><thead><tr><th>Order</th><th>Date</th><th>Payment</th><th>Total</th></tr></thead>
  <tbody>${rows}</tbody></table>
  </body></html>`;

  try {
    if (Platform.OS === 'web') {
      const ok = openHtmlPrintWindow(html);
      return ok ? {success: true} : {success: false, error: 'Could not open print window'};
    }
    const fileName = `slipgo_report_${Date.now()}`;
    const pdf = await RNHTMLtoPDF.convert({html, fileName, directory: 'Documents', base64: false});
    if (!pdf.filePath) {
      return {success: false, error: 'No PDF path'};
    }
    await Share.open({
      url: `file://${pdf.filePath}`,
      type: 'application/pdf',
      title: 'SlipGo report',
      failOnCancel: false,
    });
    return {success: true};
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    if (msg.includes('User did not share')) {
      return {success: true};
    }
    return {success: false, error: msg};
  }
}

function escape(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');
}
