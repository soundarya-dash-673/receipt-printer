/**
 * PDF generation and sharing utility.
 * Uses react-native-html-to-pdf to convert receipt HTML → PDF.
 * Uses react-native-share to share the PDF file.
 */
import RNHTMLtoPDF from 'react-native-html-to-pdf';
import Share from 'react-native-share';
import {Order} from '../context/AppContext';
import {buildReceiptHTML} from './receiptTemplate';

export interface PrintResult {
  success: boolean;
  filePath?: string;
  error?: string;
}

/**
 * Generates a PDF from the order and opens the share sheet.
 */
export async function exportReceiptAsPDF(order: Order): Promise<PrintResult> {
  try {
    const html = buildReceiptHTML(order);
    const fileName = `receipt_${order.id.slice(-8).toUpperCase()}_${Date.now()}`;

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

    // Share / print the PDF
    await Share.open({
      url: `file://${pdf.filePath}`,
      type: 'application/pdf',
      title: `Receipt - ${order.restaurantName}`,
      message: `Receipt for order #${order.id.slice(-8).toUpperCase()}`,
      failOnCancel: false,
    });

    return {success: true, filePath: pdf.filePath};
  } catch (err: any) {
    if (err?.message?.includes('User did not share')) {
      return {success: true}; // User cancelled share — not an error
    }
    console.error('PDF export error', err);
    return {success: false, error: err?.message ?? 'Unknown error'};
  }
}
