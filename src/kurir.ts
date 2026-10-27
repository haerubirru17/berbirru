// BinderByte adapter — cek resi (v1.5): validasi + status singkat utk halaman order.
// Pola ala klikqris.ts: env key + mode MOCK utk dev/test. API key [REDACTED] -> wrangler secret prod.
const BASE = 'https://api.binderbyte.com/v1';
// Wilayah TIDAK di bawah /v1 — path aslinya /wilayah/*.
const ROOT = 'https://api.binderbyte.com';

export interface TrackResult {
  ok: boolean;
  // Tri-state: 'found' resi ada, 'notfound' resi tidak terdaftar, 'error' kita tidak bisa memastikan
  // (timeout/API mati/key kosong). 'error' TIDAK boleh dianggap resi palsu.
  kind: 'found' | 'notfound' | 'error';
  status: string;      // DELIVERED / ON_TRANSIT / dll (raw dari kurir)
  desc: string;        // kalimat terakhir riwayat (paling informatif utk user)
  history: { date: string; desc: string; location: string }[];
  error?: string;
}

// Format wajar: 8–25 karakter alfanumerik/tanda hubung. Sengaja longgar —
// tiap kurir punya pola berbeda dan berubah; kebenaran resi tetap ditentukan /v1/track.
export function validasiFormatResi(resi: string): { ok: boolean; error?: string } {
  const v = String(resi || '').trim();
  if (!v) return { ok: false, error: 'Nomor resi wajib diisi' };
  if (!/^[A-Za-z0-9-]{8,25}$/.test(v)) return { ok: false, error: 'Format nomor resi tidak wajar (8–25 huruf/angka)' };
  return { ok: true };
}

export function trackMock(awb: string): TrackResult {
  const ghost = /999|000/.test(awb); // resi uji "hantu" utk test jalur not-found
  if (ghost) return { ok: false, kind: 'notfound', status: '', desc: '', history: [], error: 'Data not found' };
  return {
    ok: true,
    kind: 'found',
    status: 'DELIVERED',
    desc: 'DELIVERED TO [PENERIMA | BALIKPAPAN]',
    history: [
      { date: '2026-10-18 10:00:00', desc: 'DELIVERED TO [PENERIMA]', location: 'BALIKPAPAN' },
      { date: '2026-10-17 09:00:00', desc: 'WITH DELIVERY COURIER', location: 'BALIKPAPAN' },
      { date: '2026-10-16 08:00:00', desc: 'RECEIVED AT WAREHOUSE', location: 'BANDUNG' },
    ],
  };
}

export async function cekResi(env: any, courier: string, awb: string): Promise<TrackResult> {
  if (env.KURIR_MOCK) return { ...trackMock(awb), kind: 'found' };
  if (!env.BINDERBYTE_KEY) return { ok: false, kind: 'error', status: '', desc: '', history: [], error: 'API key belum dipasang' };
  try {
    const url = `${BASE}/track?api_key=${env.BINDERBYTE_KEY}&courier=${encodeURIComponent(courier)}&awb=${encodeURIComponent(awb)}`;
    const r = await fetch(url, { signal: AbortSignal.timeout(10_000) });
    const j: any = await r.json().catch(() => null);
    if (!j) return { ok: false, kind: 'error', status: '', desc: '', history: [], error: 'Respons kurir tidak terbaca' };
    if (j.status !== 200 || !j.data?.summary) {
      // 404/"not found" = resi memang tidak ada. Selain itu = gangguan, jangan divonis palsu.
      const msg = String(j?.message || '');
      const notFound = j.status === 404 || /not\s*found|tidak ditemukan/i.test(msg);
      return { ok: false, kind: notFound ? 'notfound' : 'error', status: '', desc: '', history: [], error: msg || 'Resi tidak ditemukan' };
    }
    const h: any[] = j.data.history || [];
    return {
      ok: true,
      kind: 'found',
      status: j.data.summary.status || '-',
      desc: h[0]?.desc || j.data.summary.desc || '',
      history: h.slice(0, 10).map((x) => ({ date: x.date, desc: x.desc, location: x.location || '' })),
    };
  } catch {
    return { ok: false, kind: 'error', status: '', desc: '', history: [], error: 'Gagal menghubungi kurir' };
  }
}

// cron D+1 utk handover ekspedisi: resi valid -> ok; NGGAK ketemu -> error 'Data not found'

// ─────────────────────────────────────────────────────────────────────────────
// Ongkir: layanan kurir + tarif (BinderByte /v1/cost) + wilayah (provinsi→kecamatan)
// ─────────────────────────────────────────────────────────────────────────────
export interface Wilayah { id: string; name: string }
export interface TarifOption {
  courier: string;        // kode BinderByte: jne, jnt, sicepat, pos, anteraja
  courierName: string;    // label UI
  service: string;        // REG / YES / OKE
  price: number;          // rupiah
  eta: string;            // estimasi dari provider
}

export const KURIR_LABEL: Record<string, string> = {
  jne: 'JNE', jnt: 'J&T', sicepat: 'SiCepat', pos: 'POS Indonesia', anteraja: 'AnterAja', ninja: 'Ninja Xpress', tiki: 'TIKI',
};
export const KURIR_DIDUKUNG = ['jne', 'jnt', 'sicepat', 'pos', 'anteraja'];

// ponytail: mock deterministik — cukup untuk uji alur; tarif asli butuh BINDERBYTE_KEY.
const MOCK_WILAYAH: Record<string, Wilayah[]> = {
  provinsi: [{ id: '36', name: 'BANTEN' }, { id: '32', name: 'JAWA BARAT' }, { id: '31', name: 'DKI JAKARTA' }],
  '36': [{ id: '36.72', name: 'KOTA CILEGON' }, { id: '36.03', name: 'KAB. PANDEGLANG' }],
  '32': [{ id: '32.73', name: 'KOTA BANDUNG' }, { id: '32.04', name: 'KAB. BANDUNG' }],
  '31': [{ id: '31.71', name: 'KOTA JAKARTA PUSAT' }, { id: '31.72', name: 'KOTA JAKARTA UTARA' }],
  '36.72': [{ id: '36.72.01', name: 'CIBEBER' }, { id: '36.72.02', name: 'CILEGON' }],
  '36.03': [{ id: '36.03.01', name: 'CIMANUK' }],
  '32.73': [{ id: '32.73.01', name: 'SUKASARI' }, { id: '32.73.02', name: 'COBLONG' }],
  '32.04': [{ id: '32.04.01', name: 'SOREANG' }],
  '31.71': [{ id: '31.71.01', name: 'GAMBIR' }, { id: '31.71.02', name: 'TANAH ABANG' }],
  '31.72': [{ id: '31.72.01', name: 'PENJARINGAN' }],
};

export async function wilayahMock(parent?: string): Promise<{ ok: boolean; items: Wilayah[] }> {
  const key = parent || 'provinsi';
  return { ok: true, items: MOCK_WILAYAH[key] || [] };
}

/** Ambil provinsi (parent kosong) / kabupaten (parent=id provinsi) / kecamatan (parent=id kabupaten). */
export async function ambilWilayah(env: any, parent?: string): Promise<{ ok: boolean; items: Wilayah[]; error?: string }> {
  if (env.KURIR_MOCK) return wilayahMock(parent);
  if (!env.BINDERBYTE_KEY) return { ok: false, items: [], error: 'Layanan wilayah belum aktif' };
  const level = !parent ? 'provinsi' : parent.length <= 2 ? 'kabupaten' : 'kecamatan';
  const qs = level === 'provinsi' ? '' : level === 'kabupaten' ? `&id_provinsi=${encodeURIComponent(parent!)}` : `&id_kabupaten=${encodeURIComponent(parent!)}`;
  try {
    const r = await fetch(`${ROOT}/wilayah/${level}?api_key=${env.BINDERBYTE_KEY}${qs}`, { signal: AbortSignal.timeout(10_000) });
    const j: any = await r.json().catch(() => null);
    // Live: { code:"200", value:[...] } — tidak ada field `status`. Jangan cek status saja.
    if (!j || !Array.isArray(j.value)) {
      return { ok: false, items: [], error: j?.message || j?.messages || 'Gagal memuat wilayah' };
    }
    return { ok: true, items: j.value.map((x: any) => ({ id: String(x.id), name: String(x.name) })) };
  } catch {
    return { ok: false, items: [], error: 'Gagal menghubungi layanan wilayah' };
  }
}

function mockTarif(couriers: string[], weightG: number): TarifOption[] {
  const kg = Math.max(1, Math.ceil(weightG / 1000));
  const out: TarifOption[] = [];
  for (const c of couriers) {
    const base = c === 'jne' ? 18000 : c === 'jnt' ? 17000 : c === 'sicepat' ? 16500 : c === 'pos' ? 19000 : 17500;
    out.push({ courier: c, courierName: KURIR_LABEL[c] || c, service: 'REG', price: base * kg, eta: `${2 + kg}-${4 + kg} hari` });
    if (c === 'jne') out.push({ courier: c, courierName: KURIR_LABEL[c], service: 'YES', price: base * kg + 12000, eta: '1-2 hari' });
  }
  return out.sort((a, b) => a.price - b.price);
}

/**
 * Tarif per kurir yang dipilih penjual. Weight dalam GRAM.
 * BinderByte /v1/cost dibatasi 1 kurir per panggilan → dipanggil paralel.
 */
export async function cekTarifOngkir(
  env: any,
  opts: { couriers: string[]; origin: string; destination: string; weightG: number }
): Promise<{ ok: boolean; options: TarifOption[]; error?: string }> {
  if (!opts.origin || !opts.destination) return { ok: false, options: [], error: 'Asal & tujuan wajib diisi' };
  const couriers = (opts.couriers || []).filter((c) => KURIR_DIDUKUNG.includes(c));
  if (!couriers.length) return { ok: false, options: [], error: 'Penjual belum memilih layanan pengiriman' };
  if (env.KURIR_MOCK) return { ok: true, options: mockTarif(couriers, opts.weightG) };
  if (!env.BINDERBYTE_KEY) return { ok: false, options: [], error: 'Tarif pengiriman belum aktif' };

  // Terverifikasi dengan key asli (26 Okt): weight dalam KG, id wilayah wajib ber-prefix `kec_`.
  const weight = Math.max(1, Math.ceil((opts.weightG || 1000) / 1000));
  const asal = opts.origin.startsWith('kec_') ? opts.origin : `kec_${opts.origin}`;
  const tujuan = opts.destination.startsWith('kec_') ? opts.destination : `kec_${opts.destination}`;
  const hasil = await Promise.all(couriers.map(async (c) => {
    try {
      const url = `${BASE}/cost?api_key=${env.BINDERBYTE_KEY}&courier=${c}` // BASE sudah berakhir /v1
        + `&origin=${encodeURIComponent(asal)}&destination=${encodeURIComponent(tujuan)}&weight=${weight}`;
      const r = await fetch(url, { signal: AbortSignal.timeout(10_000) });
      const j: any = await r.json().catch(() => null);
      if (!j || String(j.code ?? j.status) !== '200') return [];
      return rapikanTarif(j.data?.results || [], c);
    } catch {
      return [];
    }
  }));
  const options = hasil.flat().sort((a, b) => a.price - b.price);
  if (!options.length) return { ok: false, options: [], error: 'Tarif tidak tersedia untuk rute ini' };
  return { ok: true, options };
}


// Layanan kargo/junk yang tak relevan untuk buku (harga per kg muatan, bukan paket).
const SERVICE_DIBUANG = /^(JTR|SPS|HALU|GOKIL|TIKI)$/i;
const HARGA_MAKS = 1_000_000; // 30 kg JNE REG masih di bawah ini; di atas = salah satuan
const MAKS_OPSI = 6;

/** Rapikan respons /v1/cost → opsi yang aman ditampilkan ke pembeli. */
export function rapikanTarif(results: any[], courier: string): TarifOption[] {
  const out: TarifOption[] = [];
  const sudah = new Set<string>();
  for (const grup of results || []) {
    for (const x of grup?.costs || []) {
      const service = String(x?.service || '').trim().toUpperCase();
      const price = Math.round(Number(x?.price));
      if (!service || sudah.has(service)) continue;
      if (/[<>]/.test(service) || SERVICE_DIBUANG.test(service)) continue;
      if (!Number.isFinite(price) || price <= 0 || price > HARGA_MAKS) continue;
      sudah.add(service);
      const eta = String(x?.estimated || x?.etd || '').trim();
      out.push({
        courier,
        courierName: KURIR_LABEL[courier] || courier,
        service,
        price,
        eta: /^-|^-\s/.test(eta) ? '' : eta, // provider kadang kirim "- hari" saat estimasi kosong
      });
    }
  }
  return out.sort((a, b) => a.price - b.price).slice(0, MAKS_OPSI);
}

export function _selftestTarif(): boolean {
  const m = mockTarif(['jne', 'jnt'], 1000);
  const two = mockTarif(['jne', 'jnt'], 2500);
  return m.length > 0 && m[0].price > 0 && two.every((o) => o.price >= m[0].price) && KURIR_DIDUKUNG.includes('jne');
}

