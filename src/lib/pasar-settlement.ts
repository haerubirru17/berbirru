// Satu sumber biaya rekber — jangan duplikat angkanya di renderer/handler.
export const PASAR_FEE = 5000; // owner-approved 2026-10-18

export function settlementAmounts(price: number, shipping: number, fee: number) {
  const sale = Number(price) + Number(shipping);
  return { sale, fee: -Number(fee), net: sale - Number(fee) };
}

export function providerAmountMatches(actual: number | undefined, expected: number): boolean {
  return Number.isSafeInteger(actual) && actual === expected;
}

// Minimum & biaya tarik saldo — satu sumber, jangan duplikat di UI/handler.
export const WITHDRAW_MIN = 50_000;
export const WITHDRAW_TIER = 200_000;

/** Biaya tarik: penjual bertingkat (3.500 / 7.500), pembeli gratis. */
export function withdrawFee(kind: 'seller' | 'buyer', amount: number): number {
  if (kind === 'buyer') return 0;
  return Number(amount) >= WITHDRAW_TIER ? 7_500 : 3_500;
}

/** Total yang harus tersedia di saldo = jumlah ditarik + biaya. */
export function withdrawTotal(kind: 'seller' | 'buyer', amount: number): number {
  return Number(amount) + withdrawFee(kind, amount);
}

/** Nomor bukti pencairan: WD-<YYMMDD>-<4 karakter>. Dibaca manusia, unik lewat index DB. */
export function kodePencairan(now: Date, acak: string): string {
  const p2 = (n: number) => String(n).padStart(2, '0');
  const tgl = String(now.getUTCFullYear()).slice(2) + p2(now.getUTCMonth() + 1) + p2(now.getUTCDate());
  const suf = String(acak || '').toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 4).padEnd(4, '0');
  return `WD-${tgl}-${suf}`;
}
