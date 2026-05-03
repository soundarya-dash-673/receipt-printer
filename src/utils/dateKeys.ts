/** Local calendar day key YYYY-MM-DD from an ISO timestamp. */
export function localDayKey(iso: string): string {
  const d = new Date(iso);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function isSameLocalDay(aIso: string, bIso: string): boolean {
  return localDayKey(aIso) === localDayKey(bIso);
}
