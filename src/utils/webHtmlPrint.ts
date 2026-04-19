/** Opens HTML in a new tab and triggers the browser print dialog (web only). */
export function openHtmlPrintWindow(html: string): boolean {
  if (typeof window === 'undefined') {
    return false;
  }
  const w = window.open('', '_blank');
  if (!w) {
    return false;
  }
  w.document.open();
  w.document.write(html);
  w.document.close();
  w.onload = () => {
    w.focus();
    w.print();
  };
  return true;
}
