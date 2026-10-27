// Validasi data penerima — dipakai checkout (klien) dan POST /api/pasar/orders (server).
export interface Penerima {
  name: string;
  phone: string;
  postal: string;
}

const angka = (s: string) => String(s || '').replace(/[^0-9]/g, '');

export function normalisasiHp(hp: string): string {
  let v = angka(hp);
  if (v.startsWith('62')) v = '0' + v.slice(2);
  return v;
}

export function validasiPenerima(p: Partial<Penerima> | null | undefined): { ok: boolean; error?: string } {
  const name = String(p?.name || '').trim();
  const hp = normalisasiHp(String(p?.phone || ''));
  const pos = angka(String(p?.postal || ''));
  if (name.length < 3) return { ok: false, error: 'Nama penerima minimal 3 karakter' };
  if (name.length > 60) return { ok: false, error: 'Nama penerima maksimal 60 karakter' };
  if (hp.length < 9 || hp.length > 15) return { ok: false, error: 'Nomor HP penerima tidak wajar (9–15 angka)' };
  if (!hp.startsWith('0')) return { ok: false, error: 'Nomor HP penerima harus diawali 0 (contoh 08xx)' };
  if (pos.length !== 5) return { ok: false, error: 'Kode pos harus 5 angka' };
  return { ok: true };
}
