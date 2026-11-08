import { getAuthUser, hitRate } from '../lib/shared';
import { SU_AKTIF } from '../lib/pasar-core';
import { ambilWilayah, cekTarifOngkir, KURIR_DIDUKUNG, KURIR_LABEL } from '../kurir';

// Handlers kurir dipindah verbatim dari index.ts.
export function mountKurir(app: any) {
app.get('/api/kurir/wilayah', async (c: any) => {
  // Strix run-3 #2: upstream berbayar wajib sesi aktif — cek SEBELUM limiter & provider,
  // jadi tamu tidak makan budget limiter maupun kuota BinderByte.
  const me = await getAuthUser(c);
  if (!me) return c.json({ ok: false, error: 'Harus masuk dulu' }, 401);
  // Audit D-05: tetap dibatasi per-IP sebagai kontrol sekunder untuk sesi yang sah.
  const ip = c.req.header('cf-connecting-ip') || 'unknown';
  if (await hitRate(c.env.DB, `kurir:wil:${ip}`, 30, 60)) return c.json({ ok: false, error: 'Terlalu banyak. Coba sebentar lagi.' }, 429);
  const parent = (c.req.query('parent') || '').trim();
  const r = await ambilWilayah(c.env, parent || undefined);
  if (!r.ok) return c.json({ ok: false, error: r.error }, 503);
  return c.json({ ok: true, items: r.items });
});

// Tarif ongkir live untuk satu listing (pembeli pilih kecamatan tujuan).
app.post('/api/pasar/ongkir', async (c: any) => {
  // Strix run-3 #3: hit provider berbayar wajib sesi aktif — cek SEBELUM limiter,
  // parsing body, DB lookup, dan provider (tamu = 401, nol panggilan upstream).
  const me = await getAuthUser(c);
  if (!me) return c.json({ error: 'Harus masuk dulu' }, 401);
  // Audit D-05: limiter per-IP tetap sebagai kontrol sekunder.
  const ip = c.req.header('cf-connecting-ip') || 'unknown';
  if (await hitRate(c.env.DB, `kurir:ongkir:${ip}`, 12, 60)) return c.json({ error: 'Terlalu banyak. Coba sebentar lagi.' }, 429);
  const body: any = await c.req.json().catch(() => null);
  const destId = String(body?.dest_id || '').trim();
  const destName = String(body?.dest_name || '').trim().slice(0, 120);
  const p: any = await c.env.DB.prepare("SELECT id, seller_id, weight_g, couriers FROM listings WHERE id = ? AND status = 'active' AND stock > 0" + SU_AKTIF)
    .bind(String(body?.listing_id || '')).first();
  if (!p) return c.json({ error: 'Listing tidak tersedia' }, 404);
  if (!destId) return c.json({ error: 'Pilih kecamatan tujuan dulu' }, 400);
  const seller: any = await c.env.DB.prepare('SELECT district_id FROM users WHERE id = ?').bind(p.seller_id).first();
  if (!seller?.district_id) return c.json({ error: 'Penjual belum menetapkan kota asal' }, 409);

  let couriers: string[] = [];
  try { couriers = JSON.parse(p.couriers || '[]'); } catch { couriers = []; }
  const r = await cekTarifOngkir(c.env, {
    couriers, origin: seller.district_id, destination: destId, weightG: Number(p.weight_g || 1000),
  });
  if (!r.ok) return c.json({ error: r.error || 'Tarif tidak tersedia' }, 503);
  return c.json({ ok: true, options: r.options, dest: { id: destId, name: destName } });
});
}
