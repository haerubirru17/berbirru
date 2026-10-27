// Aturan akses & penamaan berkas bukti/dokumen.
// Dipisah dari handler supaya bisa diuji tanpa Worker/D1.
export const JENIS_DOKUMEN = ['ktp', 'bank'] as const;
export type JenisDokumen = (typeof JENIS_DOKUMEN)[number];

export const MAKS_BUKTI_PER_PIHAK = 3;

export function jenisDokumen(x: unknown): JenisDokumen | null {
  const s = String(x || '').toLowerCase().trim();
  return (JENIS_DOKUMEN as readonly string[]).includes(s) ? (s as JenisDokumen) : null;
}

/** Pembeli, penjual, atau owner boleh membuka pesanan/bukti. Selain itu tidak. */
export function bolehLihatPesanan(
  o: { buyer_id: string; seller_id: string },
  viewerId: string | null | undefined,
  owner: boolean
): boolean {
  if (owner) return true;
  if (!viewerId) return false;
  return viewerId === o.buyer_id || viewerId === o.seller_id;
}

/** Bukti hanya bisa diunggah saat sengketa, maks 3 foto per pihak. */
export function bolehUnggahBukti(status: string, jumlahSudah: number): boolean {
  return status === 'disputed' && jumlahSudah < MAKS_BUKTI_PER_PIHAK;
}

export function kunciBukti(orderId: string, userId: string, ext: string, stamp = Date.now(), rand = Math.random()): string {
  const acak = rand.toString(36).slice(2, 8) || 'x';
  return `bukti/${orderId}/${userId}_${stamp}_${acak}.${ext}`;
}

export function kunciDokumen(userId: string, kind: JenisDokumen, ext: string, stamp = Date.now()): string {
  return `dokumen/${userId}/${kind}_${stamp}.${ext}`;
}
