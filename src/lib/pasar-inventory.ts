export function validStock(value: unknown, allowZero = false): number | null {
  if ((typeof value !== 'number' && typeof value !== 'string') || String(value).trim() === '') return null;
  const n = Number(value);
  return Number.isInteger(n) && n >= (allowZero ? 0 : 1) && n <= 999 ? n : null;
}

export function canRestoreStock(fromStatus: string, toStatus: string): boolean {
  return (fromStatus === 'created' || fromStatus === 'paid') && (toStatus === 'cancelled' || toStatus === 'expired');
}
