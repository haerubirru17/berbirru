// BinderByte adapter — cek resi (v1.5): validasi + status singkat utk halaman order.
// Pola ala klikqris.ts: env key + mode MOCK utk dev/test. API key [REDACTED] -> wrangler secret prod.
const BASE = 'https://api.binderbyte.com/v1';

export interface TrackResult {
  ok: boolean;
  status: string;      // DELIVERED / ON_TRANSIT / dll (raw dari kurir)
  desc: string;        // kalimat terakhir riwayat (paling informatif utk user)
  history: { date: string; desc: string; location: string }[];
  error?: string;
}

export function trackMock(awb: string): TrackResult {
  const ghost = /999|000/.test(awb); // resi uji "hantu" utk test jalur not-found
  if (ghost) return { ok: false, status: '', desc: '', history: [], error: 'Data not found' };
  return {
    ok: true,
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
  if (env.KURIR_MOCK) return trackMock(awb);
  if (!env.BINDERBYTE_KEY) return { ok: false, status: '', desc: '', history: [], error: 'API key belum dipasang' };
  try {
    const url = `${BASE}/track?api_key=${env.BINDERBYTE_KEY}&courier=${encodeURIComponent(courier)}&awb=${encodeURIComponent(awb)}`;
    const r = await fetch(url, { signal: AbortSignal.timeout(10_000) });
    const j: any = await r.json().catch(() => null);
    if (!j || j.status !== 200 || !j.data?.summary) {
      return { ok: false, status: '', desc: '', history: [], error: j?.message || 'Resi tidak ditemukan' };
    }
    const h: any[] = j.data.history || [];
    return {
      ok: true,
      status: j.data.summary.status || '-',
      desc: h[0]?.desc || j.data.summary.desc || '',
      history: h.slice(0, 10).map((x) => ({ date: x.date, desc: x.desc, location: x.location || '' })),
    };
  } catch {
    return { ok: false, status: '', desc: '', history: [], error: 'Gagal menghubungi kurir' };
  }
}

// cron D+1 utk handover ekspedisi: resi valid -> ok; NGGAK ketemu -> error 'Data not found'
