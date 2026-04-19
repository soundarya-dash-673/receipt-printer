/**
 * PDF generation and sharing utility.
 * Uses react-native-html-to-pdf to convert receipt HTML → PDF.
 * Uses react-native-share to share the PDF file.
 */
import {Platform} from 'react-native';
import RNHTMLtoPDF from 'react-native-html-to-pdf';
import Share from 'react-native-share';
import type {ReceiptPayload} from './receiptTemplate';
import {buildReceiptHTML} from './receiptTemplate';
import {openHtmlPrintWindow} from './webHtmlPrint';

export interface PrintResult {
  success: boolean;
  filePath?: string;
  error?: string;
}

export async function exportReceiptAsPDF(payload: ReceiptPayload): Promise<PrintResult> {
  try {
    const html = buildReceiptHTML(payload);
    if (Platform.OS === 'web') {
      const ok = openHtmlPrintWindow(html);
      return ok ? {success: true, filePath: 'browser-print'} : {success: false, error: 'Could not open print window'};
    }
    const fileName = `slipgo_${payload.orderNumber}_${Date.now()}`;

    const options = {
      html,
      fileName,
      directory: 'Documents',
      base64: false,
    };

    const pdf = await RNHTMLtoPDF.convert(options);

    if (!pdf.filePath) {
      return {success: false, error: 'PDF generation failed: no file path returned'};
    }

    await Share.open({
      url: `file://${pdf.filePath}`,
      type: 'application/pdf',
      title: `Receipt — ${payload.shopName}`,
      message: `SlipGo receipt #${payload.orderNumber}`,
      failOnCancel: false,
    });

    return {success: true, filePath: pdf.filePath};
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    if (msg.includes('User did not share')) {
      return {success: true};
    }
    console.error('PDF export error', err);
    return {success: false, error: msg};
  }
}
