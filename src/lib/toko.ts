// Logika ringkasan dashboard penjual — dipisah supaya bisa diuji tanpa render.
export type Kelompok = 'perlu' | 'kirim' | 'selesai';

export interface Ringkasan {
  perlu: number;
  kirim: number;
  selesai: number;
  disputed: number;
  saldo: number;
}

// Status order → kelompok tab. Status asing (expired/canceled) tidak masuk kelompok mana pun.
const PETA: Record<string, Kelompok> = {
  paid: 'perlu',
  handed: 'kirim',
  completed: 'selesai',
  refunded: 'selesai',
};

export function kelompokDari(status: string): Kelompok | null {
  return PETA[status] || null;
}

export function kelompokPesanan(orders: any[], k: Kelompok): any[] {
  return (orders || []).filter((o) => kelompokDari(String(o?.status)) === k);
}

export function ringkasToko(orders: any[], saldo: number, bukuAktif: number): Ringkasan & { bukuAktif: number } {
  const r: Ringkasan & { bukuAktif: number } = { perlu: 0, kirim: 0, selesai: 0, disputed: 0, saldo: Number(saldo) || 0, bukuAktif: Number(bukuAktif) || 0 };
  for (const o of orders || []) {
    const st = String(o?.status);
    const k = kelompokDari(st);
    if (k) r[k] += 1;
    if (st === 'disputed') r.disputed += 1;
  }
  return r;
}

// ── Sisi pembeli: 4 tab (belum bayar / diproses / dikirim / selesai) ──
export type KelompokBeli = 'bayar' | 'proses' | 'kirim' | 'selesai';

const PETA_BELI: Record<string, KelompokBeli> = {
  created: 'bayar',
  paid: 'proses',
  handed: 'kirim',
  completed: 'selesai',
  refunded: 'selesai',
  cancelled: 'selesai', // order batal tetap harus bisa dibuka pembeli
  disputed: 'kirim',    // sengketa setelah paket dikirim; pembeli butuh akses kwitansi
};

export function kelompokBeliDari(status: string): KelompokBeli | null {
  return PETA_BELI[status] || null;
}

export function kelompokPesananBeli(orders: any[], k: KelompokBeli): any[] {
  return (orders || []).filter((o) => kelompokBeliDari(String(o?.status)) === k);
}

export function ringkasBeli(orders: any[]): Record<KelompokBeli, number> {
  const r: Record<KelompokBeli, number> = { bayar: 0, proses: 0, kirim: 0, selesai: 0 };
  for (const o of orders || []) {
    const k = kelompokBeliDari(String(o?.status));
    if (k) r[k] += 1;
  }
  return r;
}

// ── Slug toko publik: stabil, aman URL, tidak bergantung pen_name ──
export function slugToko(nama: string): string {
  const dasar = String(nama || '')
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40)
    .replace(/-+$/g, '');
  return dasar || 'toko';
}

// Tambah sufiks angka kalau sudah dipakai. `terpakai` = daftar slug yang sudah ada.
export function slugUnik(nama: string, terpakai: Iterable<string>): string {
  const dasar = slugToko(nama);
  const set = new Set(Array.from(terpakai, (x) => String(x || '').toLowerCase()));
  if (!set.has(dasar)) return dasar;
  for (let i = 2; i < 1000; i++) {
    const calon = `${dasar.slice(0, 36)}-${i}`;
    if (!set.has(calon)) return calon;
  }
  return `${dasar.slice(0, 30)}-${Date.now().toString(36)}`;
}
