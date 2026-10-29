import { getAuthUser } from '../lib/shared';
import { ambilWilayah, cekTarifOngkir, KURIR_DIDUKUNG, KURIR_LABEL } from '../kurir';

// Handlers kurir dipindah verbatim dari index.ts.
export function mountKurir(app: any) {
app.get('/api/kurir/wilayah', async (c: any) => {
  const parent = (c.req.query('parent') || '').trim();
  const r = await ambilWilayah(c.env, parent || undefined);
  if (!r.ok) return c.json({ ok: false, error: r.error }, 503);
  return c.json({ ok: true, items: r.items });
});

// Tarif ongkir live untuk satu listing (pembeli pilih kecamatan tujuan).
app.post('/api/pasar/ongkir', async (c: any) => {
  const body: any = await c.req.json().catch(() => null);
  const destId = String(body?.dest_id || '').trim();
  const destName = String(body?.dest_name || '').trim().slice(0, 120);
  const p: any = await c.env.DB.prepare("SELECT id, seller_id, weight_g, couriers FROM listings WHERE id = ? AND status = 'active' AND stock > 0")
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
