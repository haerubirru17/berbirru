import { getAuthUser, isOwner, hitRate } from '../lib/shared';
import { renderAkunPage } from '../web/akun';
import { renderAlamatListPage, renderAlamatFormPage } from '../web/alamat';
import { renderPasarPage, renderJualPage, renderEditListingPage, renderListingDetail } from '../web/pasar';
import { renderCheckoutPage } from '../web/checkout';
import { renderOrderPage } from '../web/order';
import { renderNotaPengiriman, renderNotaPembelian } from '../web/nota';
import { renderVerifikasiPage } from '../web/verifikasi';
import { renderPasarSaya } from '../web/pasarSaya';
import { renderTokoPublikPage } from '../web/tokoPublik';
import { renderBuktiPencairan } from '../web/pencairan';
import { createQrisTransaction, getQrisStatus, verifyWebhook, KlikQrisEnv } from '../klikqris';
import { providerAmountMatches, settlementAmounts, PASAR_FEE, WITHDRAW_MIN, withdrawFee, withdrawTotal, kodePencairan } from '../lib/pasar-settlement';
import { bolehLihatPesanan, bolehUnggahBukti, jenisDokumen, kunciBukti, kunciDokumen, MAKS_BUKTI_PER_PIHAK } from '../lib/berkas';
import { validasiPenerima, normalisasiHp } from '../lib/alamat';
import { slugToko, slugUnik } from '../lib/toko';
import { cekResi, validasiFormatResi, ambilWilayah, cekTarifOngkir, KURIR_DIDUKUNG, KURIR_LABEL } from '../kurir';
import { validStock } from '../lib/pasar-inventory';
import { notifyOrder, logOrderEvent, sellerBalance, KURIR_MAP } from '../lib/pasar-core';
import { Env } from '../env';

// Seluruh handler, helper, konstanta, dan middleware pasar dipindah verbatim dari index.ts. (reconcileQris bertingkat top-level supaya bisa di-import owner.ts — audit B-05)
export async function reconcileQris(db: any, env: Env, o: any): Promise<{ ok: boolean; paid?: boolean; error?: string }> {
  if (o.status !== 'created') return { ok: true, paid: o.status === 'paid' };
  const provider = await getQrisStatus(env, o.qris_order_id);
  if (!provider.ok) return { ok: false, error: provider.error };
  const expected = Number(o.qris_final_amount || Number(o.price) + Number(o.shipping));
  if (!providerAmountMatches(provider.finalAmount, expected)) return { ok: false, error: 'Nominal status KlikQRIS tidak cocok atau hilang' };
  if (provider.signature && o.qris_signature && provider.signature !== o.qris_signature) return { ok: false, error: 'Signature status KlikQRIS tidak cocok' };
  if (!provider.paid) return { ok: true, paid: false };
  const res = await db.prepare("UPDATE orders SET status = 'paid', updated_at = datetime('now') WHERE id = ? AND status = 'created'").bind(o.id).run();
  if ((res.meta?.changes || 0) > 0) {
    await logOrderEvent(db, o.id, 'system', 'created', 'paid', 'Status KlikQRIS terverifikasi');
    await notifyOrder(db, { userId: o.seller_id, actorId: o.buyer_id, type: 'order_paid', orderId: o.id });
  }
  return { ok: true, paid: true };
}

// ---- AUDIT R2-03/R2-04: expiry atomik & late-payment ----
// Expiry order created: restore stok + event + flip dalam SATU batch (rollback utuh saat svc error).
export async function sweepExpireBatch(db: any, o: any): Promise<{ changes: number }> {
  const res = await db.batch([
    db.prepare("UPDATE listings SET stock = MIN(stock + 1, 999) WHERE id = ? AND status != 'deleted' AND EXISTS (SELECT 1 FROM orders WHERE id = ? AND status = 'created')").bind(o.listing_id, o.id),
    db.prepare("INSERT INTO order_events (order_id, actor, from_st, to_st, note) SELECT ?,?,?,?,? WHERE EXISTS (SELECT 1 FROM orders WHERE id = ? AND status = 'created')").bind(o.id, 'system', 'created', 'expired', 'Pesanan kedaluwarsa — stok dikembalikan', o.id),
    db.prepare("UPDATE orders SET status = 'expired', updated_at = datetime('now') WHERE id = ? AND status = 'created'").bind(o.id),
  ]);
  return { changes: (res[2].meta?.changes || 0) };
}

// Pembayaran terlambat pada order expired: provider paid → masuk sengketa (bukan auto-paid,
// stok mungkin sudah terjual lagi). Satu batch, guard status='expired'.
export async function latePaymentToDispute(db: any, o: any): Promise<{ ok: boolean }> {
  const res = await db.batch([
    db.prepare("UPDATE orders SET status = 'disputed', updated_at = datetime('now') WHERE id = ? AND status = 'expired'").bind(o.id),
    db.prepare("INSERT INTO order_events (order_id, actor, from_st, to_st, note) SELECT ?,?,?,?,? WHERE EXISTS (SELECT 1 FROM orders WHERE id = ? AND status = 'disputed')").bind(o.id, 'system', 'expired', 'disputed', 'Pembayaran QRIS terdeteksi setelah kedaluwarsa — masuk pemeriksaan owner', o.id),
  ]);
  if ((res[0].meta?.changes || 0) === 0) return { ok: false };
  await notifyOrder(db, { userId: o.buyer_id, actorId: o.seller_id, type: 'order_late_payment', orderId: o.id });
  await notifyOrder(db, { userId: o.seller_id, actorId: o.buyer_id, type: 'order_late_payment', orderId: o.id });
  return { ok: true };
}

// Owner: periksa ulang provider utk order created|expired. Fail-closed saat provider error.
export async function ownerReconcilePayment(db: any, env: any, orderId: string): Promise<{ ok: boolean; status?: string; error?: string }> {
  const o: any = await db.prepare('SELECT * FROM orders WHERE id = ?').bind(orderId).first();
  if (!o || (o.status !== 'created' && o.status !== 'expired') || !o.qris_order_id) return { ok: false, error: 'order tidak memenuhi syarat reconcile' };
  const provider = await getQrisStatus(env, o.qris_order_id);
  if (!provider.ok) return { ok: false, error: provider.error };
  if (!provider.paid) return { ok: true, status: o.status };
  if (o.status === 'created') {
    const rr = await reconcileQris(db, env, o);
    if (!rr.ok) return { ok: false, error: rr.error };
    return { ok: true, status: 'paid' };
  }
  // expired + paid → disputed untuk keputusan owner (stok mungkin sudah terjual ulang).
  const r = await latePaymentToDispute(db, o);
  return { ok: r.ok, status: r.ok ? 'disputed' : o.status };
}

export function mountPasar(app: any) {
// ================= PASAR BUKU (rekber marketplace) =================
// Fee rekber 5.000/order ditanggung penjual; pembeli bayar harga+ongkir persis.
const MAX_LISTING_PHOTOS = 5;
const PHOTO_MAX_BYTES = 5 * 1024 * 1024;
const PHOTO_DIR = 'pasar';
const PHOTO_TYPES: Record<string, string> = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' };

// Owner = admin murni (keputusan pemilik): tidak berjualan/berbelanja lewat akun owner.
// Satu middleware menutup semua jalur tulis pasar, bukan guard di tiap endpoint.
app.use('/api/pasar/*', async (c: any, next: any) => {
  if (c.req.method === 'GET') return next();
  const me = await getAuthUser(c);
  if (me && isOwner(c.env, me)) {
    return c.json({ error: 'Akun owner hanya untuk administrasi. Pakai akun lain untuk berjualan atau berbelanja.' }, 403);
  }
  await next();
});

// Satu jalur unggah foto: listing, bukti sengketa, dokumen penjual.
// Validasi (tipe, sniff isi berkas, batas 5 MB) ada di sini — pemanggil tidak menduplikasi.
async function putFoto(
  c: any,
  keyName: (ext: string) => string
): Promise<{ key: string } | { error: string; status: 400 | 413 | 415 | 503 }> {
  const ct = (c.req.header('Content-Type') || '').split(';')[0].trim().toLowerCase();
  const ext = PHOTO_TYPES[ct];
  if (!ext) return { error: 'Hanya JPEG/PNG/WebP', status: 415 };
  if (!c.env.MEDIA) return { error: 'Media belum siap', status: 503 };
  const buf = await c.req.arrayBuffer();
  if (!buf || buf.byteLength === 0) return { error: 'Berkas kosong', status: 400 };
  if (buf.byteLength > PHOTO_MAX_BYTES) return { error: 'Foto terlalu besar (maks 5MB)', status: 413 };
  const b = new Uint8Array(buf);
  const isJpeg = b[0] === 0xFF && b[1] === 0xD8;
  const isPng = b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4E && b[3] === 0x47;
  const isWebP = b[0] === 0x52 && b[1] === 0x49 && b[2] === 0x46 && b[3] === 0x46 && b[8] === 0x57 && b[9] === 0x45 && b[10] === 0x42 && b[11] === 0x50;
  const sniffExt = isJpeg ? 'jpg' : isPng ? 'png' : isWebP ? 'webp' : null;
  if (!sniffExt || sniffExt !== ext) return { error: 'Isi berkas tidak cocok dengan tipenya', status: 415 };
  const key = keyName(ext);
  await c.env.MEDIA.put(key, buf, { httpMetadata: { contentType: ct } });
  return { key };
}

app.post('/api/pasar/upload', async (c: any) => {
  const me = await getAuthUser(c);
  if (!me) return c.json({ error: 'Harus masuk dulu' }, 401);
  // Audit D-07: R2 berbayar dan tanpa lifecycle → batasi per-akun.
  if (await hitRate(c.env.DB, `up:${me.id}`, 20, 3600)) return c.json({ error: 'Terlalu banyak unggahan. Coba lagi nanti.' }, 429);
  const r = await putFoto(c, (ext) => `${PHOTO_DIR}/${me.id}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}.${ext}`);
  if ('error' in r) return c.json({ error: r.error }, r.status);
  return c.json({ ok: true, key: r.key, url: `/media/${r.key}?v=${Date.now()}` });
});

app.delete('/api/pasar/upload', async (c: any) => {
  const me = await getAuthUser(c);
  if (!me) return c.json({ error: 'Harus masuk dulu' }, 401);
  const key = c.req.query('key') || '';
  // hanya boleh hapus foto miliknya sendiri di folder pasar
  if (!key.startsWith(`${PHOTO_DIR}/${me.id}_`)) return c.json({ error: 'Key tak valid' }, 403);
  if (!/^[a-z0-9_/-]+\.(jpg|png|webp)$/i.test(key)) return c.json({ error: 'Key tak valid' }, 400);
  await c.env.MEDIA.delete(key).catch(() => {});
  return c.json({ ok: true });
});

// ---- Berkas privat: bukti sengketa & dokumen penjual ----
// Disajikan lewat route ber-guard (bukan /media yang publik + cache 5 menit).
async function serveBerkas(c: any, key: string) {
  if (!c.env.MEDIA) return c.notFound();
  const obj = await c.env.MEDIA.get(key);
  if (!obj) return c.notFound();
  return c.body(obj.body, 200, {
    'Content-Type': obj.httpMetadata?.contentType || 'application/octet-stream',
    'Cache-Control': 'private, no-store',
    'X-Content-Type-Options': 'nosniff',
  });
}

// Bukti foto sengketa: hanya pembeli/penjual pesanan itu, hanya saat status disputed.
app.post('/api/pasar/order/:id/evidence', async (c: any) => {
  const me = await getAuthUser(c);
  if (!me) return c.json({ error: 'Harus masuk dulu' }, 401);
  const o: any = await c.env.DB.prepare('SELECT id, buyer_id, seller_id, status FROM orders WHERE id = ?').bind(c.req.param('id')).first();
  if (!o || (me.id !== o.buyer_id && me.id !== o.seller_id)) return c.json({ error: 'Tidak ditemukan' }, 404);
  const sud: any = await c.env.DB.prepare(
    'SELECT COUNT(*) AS n FROM order_evidence WHERE order_id = ? AND uploader_id = ?'
  ).bind(o.id, me.id).first();
  if (!bolehUnggahBukti(o.status, Number(sud?.n || 0))) {
    return c.json({
      error: o.status === 'disputed'
        ? `Maksimal ${MAKS_BUKTI_PER_PIHAK} foto per pihak`
        : 'Bukti hanya bisa diunggah saat sengketa',
    }, 409);
  }
  if (await hitRate(c.env.DB, `bukti:${me.id}`, 10, 600)) {
    return c.json({ error: 'Terlalu banyak unggahan. Coba lagi nanti.' }, 429);
  }
  const note = String(c.req.query('note') || '').trim().slice(0, 200);
  const r = await putFoto(c, (ext) => kunciBukti(o.id, me.id, ext));
  if ('error' in r) return c.json({ error: r.error }, r.status);
  // Audit B-12: count masuk INSERT atomik supaya dua unggahan konkuren tak melampaui cap per-pihak.
  const ins = await c.env.DB.prepare(
    `INSERT INTO order_evidence (id, order_id, uploader_id, role, r2_key, note)
     SELECT ?, ?, ?, ?, ?, ? WHERE (
       SELECT COUNT(*) FROM order_evidence WHERE order_id = ? AND uploader_id = ?
     ) < ${MAKS_BUKTI_PER_PIHAK}`
  ).bind(crypto.randomUUID(), o.id, me.id, me.id === o.buyer_id ? 'buyer' : 'seller', r.key, note || null, o.id, me.id).run();
  if (!ins.meta.changes) {
    return c.json({ error: `Maksimal ${MAKS_BUKTI_PER_PIHAK} foto per pihak` }, 409);
  }
  return c.json({ ok: true });
});

app.get('/berkas/sengketa/:id', async (c: any) => {
  const me = await getAuthUser(c);
  const row: any = await c.env.DB.prepare(
    'SELECT e.r2_key, o.buyer_id, o.seller_id FROM order_evidence e JOIN orders o ON o.id = e.order_id WHERE e.id = ?'
  ).bind(c.req.param('id')).first();
  if (!row) return c.notFound();
  if (!bolehLihatPesanan(row, me?.id, isOwner(c.env, me))) return c.notFound();
  return serveBerkas(c, row.r2_key);
});

// Dokumen verifikasi penjual: KTP & buku tabungan — HANYA owner yang boleh membuka.
app.post('/api/pasar/seller/docs', async (c: any) => {
  const me = await getAuthUser(c);
  if (!me) return c.json({ error: 'Harus masuk dulu' }, 401);
  if (me.seller_status === 'approved') return c.json({ error: 'Akun sudah terverifikasi' }, 409);
  const kind = jenisDokumen(c.req.query('kind'));
  if (!kind) return c.json({ error: 'Jenis dokumen tidak dikenal' }, 400);
  if (await hitRate(c.env.DB, `dok:${me.id}`, 6, 3600)) {
    return c.json({ error: 'Terlalu banyak unggahan. Coba lagi nanti.' }, 429);
  }
  const lama: any = await c.env.DB.prepare('SELECT r2_key FROM seller_docs WHERE user_id = ? AND kind = ?').bind(me.id, kind).first();
  const r = await putFoto(c, (ext) => kunciDokumen(me.id, kind, ext));
  if ('error' in r) return c.json({ error: r.error }, r.status);
  await c.env.DB.prepare(
    `INSERT INTO seller_docs (user_id, kind, r2_key) VALUES (?,?,?)
     ON CONFLICT(user_id, kind) DO UPDATE SET r2_key = excluded.r2_key, uploaded_at = datetime('now')`
  ).bind(me.id, kind, r.key).run();
  if (lama?.r2_key && lama.r2_key !== r.key) await c.env.MEDIA.delete(lama.r2_key).catch(() => {});
  return c.json({ ok: true });
});

app.get('/berkas/dokumen/:userId/:kind', async (c: any) => {
  const me = await getAuthUser(c);
  if (!isOwner(c.env, me)) return c.notFound();
  const kind = jenisDokumen(c.req.param('kind'));
  if (!kind) return c.notFound();
  const row: any = await c.env.DB.prepare('SELECT r2_key FROM seller_docs WHERE user_id = ? AND kind = ?').bind(c.req.param('userId'), kind).first();
  if (!row) return c.notFound();
  return serveBerkas(c, row.r2_key);
});

const MAX_PRICE = 10_000_000; // Audit B-08: satu plafon konsisten untuk create & PATCH (keputusan konservatif).
app.post('/api/pasar/listings', async (c: any) => {
  const me = await getAuthUser(c);
  if (!me) return c.json({ error: 'Harus masuk dulu' }, 401);
  if (me.seller_status !== 'approved') return c.json({ error: 'Akun penjual belum terverifikasi owner' }, 403);
  const body: any = await c.req.json().catch(() => null);
  if (!body) return c.json({ error: 'Body tidak valid' }, 400);
  const title = String(body.title || '').trim();
  const author = String(body.author || '').trim().slice(0, 100);
  const descr = String(body.descr || '').trim().slice(0, 800);
  const cond = ['baru', 'bekas_bagus', 'bekas_layak'].includes(body.cond) ? body.cond : 'bekas_bagus';
  const price = Number(body.price);
  const stock = validStock(body.stock);
  // Ongkir dari layanan kurir: penjual pilih kurir + berat + kecamatan asal (bukan angka tebakan).
  const couriers: string[] = (Array.isArray(body.couriers) ? body.couriers : [])
    .map((x: any) => String(x).toLowerCase())
    .filter((x: string, i: number, a: string[]) => KURIR_DIDUKUNG.includes(x) && a.indexOf(x) === i);
  const weightG = Number(body.weight_g);
  const originId = String(body.origin_id || '').trim();
  const originName = String(body.origin_name || '').trim().slice(0, 120);
  let photos: string[] = Array.isArray(body.photos) ? body.photos.map(String) : [];
  photos = photos.filter((k) => new RegExp(`^${PHOTO_DIR}/${me.id}_[0-9]+_[a-z0-9]+\\.(jpg|png|webp)$`).test(k)).slice(0, MAX_LISTING_PHOTOS);
  if (!title || title.length > 140) return c.json({ error: 'Judul wajib diisi (maks 140 karakter)' }, 400);
  if (!Number.isInteger(price) || price < 1000 || price > MAX_PRICE) return c.json({ error: 'Harga harus Rp1.000–10.000.000' }, 400);
  if (stock === null) return c.json({ error: 'Stok harus bilangan bulat 1–999' }, 400);
  if (!couriers.length) return c.json({ error: 'Pilih minimal satu layanan pengiriman' }, 400);
  if (!Number.isInteger(weightG) || weightG < 100 || weightG > 30_000) return c.json({ error: 'Berat buku harus 100–30.000 gram' }, 400);
  if (!originId) return c.json({ error: 'Pilih kecamatan asal pengiriman' }, 400);
  if (photos.length === 0) return c.json({ error: 'Minimal 1 foto buku' }, 400);
  // Asal disimpan ke profil: listing berikutnya tak perlu pilih ulang.
  await c.env.DB.prepare('UPDATE users SET district_id = ?, district_name = ? WHERE id = ?')
    .bind(originId, originName || null, me.id).run();
  const id = crypto.randomUUID();
  await c.env.DB.prepare(
    'INSERT INTO listings (id, seller_id, title, author, descr, cond, price, stock, shipping_flat, weight_g, couriers, status, photos) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)'
  ).bind(id, me.id, title, author, descr, cond, price, stock, 0, weightG, JSON.stringify(couriers), 'active', JSON.stringify(photos)).run();
  return c.json({ ok: true, id });
});

// Wilayah bertingkat: parent kosong = provinsi, 2 digit = kabupaten, 6 digit = kecamatan.
// (handlers wilayah diregistrasi di index lewat routes/kurir.ts — mountKurir tetap di index)

app.get('/pasar', async (c: any) => {
  const user = await getAuthUser(c);
  // Filter dicari di server: 100 judul pun tetap satu query, tanpa JS.
  const q = String(c.req.query('q') || '').trim().slice(0, 60);
  const cond = ['baru', 'bekas_bagus', 'bekas_layak'].includes(String(c.req.query('cond') || '')) ? String(c.req.query('cond')) : '';
  const sort = ['baru', 'murah', 'mahal'].includes(String(c.req.query('sort') || '')) ? String(c.req.query('sort')) : 'baru';
  const max = Math.max(0, Math.min(100_000_000, Number.parseInt(String(c.req.query('max') || '0'), 10) || 0));

  const perPage = 24;
  const hal = Math.max(1, Math.min(99, Number.parseInt(String(c.req.query('hal') || '1'), 10) || 1));
  let where = " FROM listings WHERE status = 'active' AND stock > 0";
  const binds: any[] = [];
  if (q) {
    const pola = '%' + q.replace(/[\\%_]/g, '\\$&') + '%';
    where += " AND (title LIKE ? ESCAPE '\\' OR author LIKE ? ESCAPE '\\')";
    binds.push(pola, pola);
  }
  if (cond) { where += ' AND cond = ?'; binds.push(cond); }
  if (max) { where += ' AND price <= ?'; binds.push(max); }

  const urut = sort === 'murah' ? ' ORDER BY price ASC, created_at DESC'
    : sort === 'mahal' ? ' ORDER BY price DESC, created_at DESC'
    : ' ORDER BY created_at DESC';

  const countStmt = c.env.DB.prepare('SELECT COUNT(*) AS n' + where);
  const total: any = binds.length ? await countStmt.bind(...binds).first() : await countStmt.first();

  const sql = 'SELECT id, seller_id, title, cond, price, shipping_flat, photos' + where + urut + ' LIMIT ? OFFSET ?';
  const stmt = c.env.DB.prepare(sql).bind(...binds, perPage, (hal - 1) * perPage);
  const listings = await stmt.all();
  return c.html(renderPasarPage(user, listings.results || [], { q, cond, sort, max }, {
    hal, perPage, total: Number(total?.n || 0),
  }, isOwner(c.env, user) ? { pending: Number((user as any).owner_pending || 0) } : undefined));
});

// Halaman akun: pintu pengaturan yang masuk akal di dalam Pasar.
app.get('/akun', async (c: any) => {
  const user = await getAuthUser(c);
  if (!user) return c.redirect('/login');
  // Refund = uang kembali ke rekening, bukan saldo. Tapi pembeli tetap butuh daftarnya.
  const refunds = await c.env.DB.prepare(
    `SELECT id, refund_amount, refund_ref, refunded_at, price, shipping, qris_final_amount
       FROM orders WHERE buyer_id = ? AND status = 'refunded' ORDER BY refunded_at DESC LIMIT 10`
  ).bind(user.id).all();
  return c.html(renderAkunPage(user, refunds.results || [], isOwner(c.env, user)));
});

// ---- Buku alamat (maks 5, satu utama) ----
const bacaAlamat = (f: any) => {
  const t = (v: any, n: number) => String(v ?? '').trim().slice(0, n);
  const a = {
    label: t(f.label, 20) || null,
    receiver: t(f.receiver, 60),
    phone: String(f.phone ?? '').replace(/[^0-9+]/g, '').slice(0, 20),
    postal: String(f.postal ?? '').replace(/\D/g, '').slice(0, 5),
    text: t(f.text, 300),
    province_id: t(f.province_id, 12) || null, province_name: t(f.province_name, 60) || null,
    city_id: t(f.city_id, 12) || null, city_name: t(f.city_name, 60) || null,
    district_id: t(f.district_id, 12) || null, district_name: t(f.district_name, 60) || null,
    utama: String(f.utama ?? '') === '1',
  };
  const salah = a.receiver.length < 3 ? 'Nama penerima minimal 3 karakter.'
    : a.phone.replace(/\D/g, '').length < 9 ? 'Nomor HP minimal 9 angka.'
    : !a.district_id ? 'Pilih kecamatan tujuan.'
    : a.postal.length !== 5 ? 'Kode pos harus 5 angka.'
    : a.text.length < 10 ? 'Alamat lengkap minimal 10 karakter.' : '';
  return { a, salah };
};

// Cerminkan alamat utama ke users.addr_* — kode lama (checkout/order) masih membacanya.
const cerminUtama = (db: D1Database, userId: string, a: any) => db.prepare(
  `UPDATE users SET addr_receiver = ?, addr_phone = ?, addr_postal = ?, addr_text = ?,
     addr_province_id = ?, addr_province_name = ?, addr_city_id = ?, addr_city_name = ?,
     addr_district_id = ?, addr_district_name = ? WHERE id = ?`
).bind(a.receiver, a.phone, a.postal, a.text, a.province_id, a.province_name,
  a.city_id, a.city_name, a.district_id, a.district_name, userId);

app.get('/akun/alamat', async (c: any) => {
  const user = await getAuthUser(c);
  if (!user) return c.redirect('/login');
  const rows = await c.env.DB.prepare(
    'SELECT * FROM addresses WHERE user_id = ? ORDER BY is_default DESC, created_at ASC'
  ).bind(user.id).all();
  const pesan = c.req.query('ok') === 'baru' ? 'Alamat baru tersimpan.' : c.req.query('ok') ? 'Perubahan tersimpan.' : '';
  return c.html(renderAlamatListPage(user, rows.results || [], pesan));
});

app.get('/akun/alamat/baru', async (c: any) => {
  const user = await getAuthUser(c);
  if (!user) return c.redirect('/login');
  const n: any = await c.env.DB.prepare('SELECT COUNT(*) AS n FROM addresses WHERE user_id = ?').bind(user.id).first();
  if (Number(n?.n || 0) >= 5) return c.redirect('/akun/alamat');
  return c.html(renderAlamatFormPage(user, { receiver: user.addr_receiver, phone: user.addr_phone }));
});

app.post('/akun/alamat', async (c: any) => {
  const user = await getAuthUser(c);
  if (!user) return c.redirect('/login');
  const f: any = await c.req.parseBody();
  const { a, salah } = bacaAlamat(f);
  if (salah) return c.html(renderAlamatFormPage(user, a, salah), 400);
  const n: any = await c.env.DB.prepare('SELECT COUNT(*) AS n FROM addresses WHERE user_id = ?').bind(user.id).first();
  if (Number(n?.n || 0) >= 5) return c.redirect('/akun/alamat');

  const id = crypto.randomUUID();
  const utama = a.utama || Number(n?.n || 0) === 0;
  await c.env.DB.batch([
    ...(utama ? [c.env.DB.prepare('UPDATE addresses SET is_default = 0 WHERE user_id = ?').bind(user.id)] : []),
    c.env.DB.prepare(
      `INSERT INTO addresses (id, user_id, label, receiver, phone, postal, text,
        province_id, province_name, city_id, city_name, district_id, district_name, is_default)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)`
    ).bind(id, user.id, a.label, a.receiver, a.phone, a.postal, a.text, a.province_id,
      a.province_name, a.city_id, a.city_name, a.district_id, a.district_name, utama ? 1 : 0),
    ...(utama ? [cerminUtama(c.env.DB, user.id, a)] : []),
  ]);
  return c.redirect('/akun/alamat?ok=baru');
});

app.get('/akun/alamat/:id/ubah', async (c: any) => {
  const user = await getAuthUser(c);
  if (!user) return c.redirect('/login');
  const a: any = await c.env.DB.prepare('SELECT * FROM addresses WHERE id = ? AND user_id = ?')
    .bind(c.req.param('id'), user.id).first();
  if (!a) return c.notFound();
  return c.html(renderAlamatFormPage(user, a));
});

app.post('/akun/alamat/:id', async (c: any) => {
  const user = await getAuthUser(c);
  if (!user) return c.redirect('/login');
  const lama: any = await c.env.DB.prepare('SELECT * FROM addresses WHERE id = ? AND user_id = ?')
    .bind(c.req.param('id'), user.id).first();
  if (!lama) return c.notFound();
  const f: any = await c.req.parseBody();
  const { a, salah } = bacaAlamat(f);
  if (salah) return c.html(renderAlamatFormPage(user, { ...a, id: lama.id }, salah), 400);
  const utama = a.utama || Number(lama.is_default) === 1;
  await c.env.DB.batch([
    ...(utama && !lama.is_default ? [c.env.DB.prepare('UPDATE addresses SET is_default = 0 WHERE user_id = ?').bind(user.id)] : []),
    c.env.DB.prepare(
      `UPDATE addresses SET label = ?, receiver = ?, phone = ?, postal = ?, text = ?,
         province_id = ?, province_name = ?, city_id = ?, city_name = ?, district_id = ?, district_name = ?,
         is_default = ?, updated_at = datetime('now') WHERE id = ? AND user_id = ?`
    ).bind(a.label, a.receiver, a.phone, a.postal, a.text, a.province_id, a.province_name,
      a.city_id, a.city_name, a.district_id, a.district_name, utama ? 1 : 0, lama.id, user.id),
    ...(utama ? [cerminUtama(c.env.DB, user.id, a)] : []),
  ]);
  return c.redirect('/akun/alamat?ok=1');
});

app.post('/akun/alamat/:id/utama', async (c: any) => {
  const user = await getAuthUser(c);
  if (!user) return c.redirect('/login');
  const a: any = await c.env.DB.prepare('SELECT * FROM addresses WHERE id = ? AND user_id = ?')
    .bind(c.req.param('id'), user.id).first();
  if (!a) return c.notFound();
  await c.env.DB.batch([
    c.env.DB.prepare('UPDATE addresses SET is_default = 0 WHERE user_id = ?').bind(user.id),
    c.env.DB.prepare('UPDATE addresses SET is_default = 1 WHERE id = ?').bind(a.id),
    cerminUtama(c.env.DB, user.id, a),
  ]);
  return c.redirect('/akun/alamat?ok=1');
});

app.post('/akun/alamat/:id/hapus', async (c: any) => {
  const user = await getAuthUser(c);
  if (!user) return c.redirect('/login');
  const a: any = await c.env.DB.prepare('SELECT * FROM addresses WHERE id = ? AND user_id = ?')
    .bind(c.req.param('id'), user.id).first();
  if (!a) return c.notFound();
  await c.env.DB.prepare('DELETE FROM addresses WHERE id = ? AND user_id = ?').bind(a.id, user.id).run();
  if (Number(a.is_default) === 1) {
    const sisa: any = await c.env.DB.prepare(
      'SELECT * FROM addresses WHERE user_id = ? ORDER BY created_at ASC LIMIT 1'
    ).bind(user.id).first();
    if (sisa) {
      await c.env.DB.batch([
        c.env.DB.prepare('UPDATE addresses SET is_default = 1 WHERE id = ?').bind(sisa.id),
        cerminUtama(c.env.DB, user.id, sisa),
      ]);
    }
  }
  return c.redirect('/akun/alamat?ok=1');
});

app.get('/pasar/listing/:id/edit', async (c: any) => {
  const me = await getAuthUser(c);
  if (!me) return c.redirect('/login');
  const l: any = await c.env.DB.prepare('SELECT id, seller_id, title, price, cond, status, stock FROM listings WHERE id = ?')
    .bind(c.req.param('id')).first();
  if (!l || l.seller_id !== me.id) return c.notFound();
  if (l.status === 'sold') return c.redirect('/pasar/saya?tab=toko');
  return c.html(renderEditListingPage(me, l));
});

app.get('/pasar/jual', async (c: any) => {
  const user = await getAuthUser(c);
  if (!user) return c.redirect('/login');
  if (isOwner(c.env, user)) return c.redirect('/owner'); // owner = admin, bukan penjual
  // Gerbang: hanya penjual terverifikasi yang boleh memasang buku.
  if (user.seller_status !== 'approved') {
    const docs = await c.env.DB.prepare('SELECT kind FROM seller_docs WHERE user_id = ?').bind(user.id).all();
    const ada = new Set((docs.results || []).map((d: any) => d.kind));
    return c.html(renderVerifikasiPage({ ...user, doc_ktp: ada.has('ktp'), doc_bank: ada.has('bank') }));
  }
  return c.html(renderJualPage(user));
});

// ---- Toko publik penjual: /toko/<slug> (bisa dibagikan, tanpa login) ----
app.get('/toko/:slug', async (c: any) => {
  const slug = String(c.req.param('slug') || '').toLowerCase().slice(0, 60);
  if (!/^[a-z0-9-]{1,60}$/.test(slug)) return c.notFound();
  const toko: any = await c.env.DB.prepare(
    `SELECT id, pen_name, shop_name, city, created_at, shop_slug FROM users
      WHERE shop_slug = ? AND seller_status = 'approved' LIMIT 1`
  ).bind(slug).first();
  if (!toko) return c.notFound();
  const perPage = 24;
  const hal = Math.max(1, Math.min(99, Number.parseInt(String(c.req.query('hal') || '1'), 10) || 1));
  const jumlah: any = await c.env.DB.prepare(
    "SELECT COUNT(*) AS n FROM listings WHERE seller_id = ? AND status = 'active' AND stock > 0"
  ).bind(toko.id).first();
  const rows = await c.env.DB.prepare(
    `SELECT id, title, price, cond, photos, stock FROM listings
      WHERE seller_id = ? AND status = 'active' AND stock > 0 ORDER BY created_at DESC LIMIT ? OFFSET ?`
  ).bind(toko.id, perPage, (hal - 1) * perPage).all();
  const done: any = await c.env.DB.prepare(
    "SELECT COUNT(*) AS n FROM orders WHERE seller_id = ? AND status = 'completed'"
  ).bind(toko.id).first();
  const rate: any = await c.env.DB.prepare(
    'SELECT COUNT(*) AS n, AVG(stars) AS avg FROM reviews WHERE seller_id = ?'
  ).bind(toko.id).first();
  const me = await getAuthUser(c);
  const baseUrl = new URL(c.req.url).origin;
  return c.html(renderTokoPublikPage(
    { ...toko, transaksi_selesai: Number(done?.n || 0), ulasan_n: Number(rate?.n || 0), ulasan_avg: Number(rate?.avg || 0), buku_aktif: Number(jumlah?.n || 0) },
    rows.results || [],
    { isOwner: !!me && me.id === toko.id, baseUrl, hal, perPage, total: Number(jumlah?.n || 0) },
  ));
});

// ---- Pusat Pasar Buku: pesanan + toko + saldo + aktivitas dalam satu halaman ----
app.get('/pasar/saya', async (c: any) => {
  const user = await getAuthUser(c);
  if (!user) return c.redirect('/login');
  const approved = user.seller_status === 'approved';
  const tab = String(c.req.query('tab') || '').toLowerCase();
  const sub = String(c.req.query('sub') || '');

  // hitungan tab butuh kedua sisi; query dibatasi 60 baris dan hanya kolom yang dipakai.
  const beliRows = await c.env.DB.prepare(
    `SELECT o.id, o.price, o.shipping, o.qris_final_amount, o.status, o.created_at,
            COALESCE(l.title, '(buku sudah dihapus)') AS title, s.pen_name AS seller_name
       FROM orders o LEFT JOIN listings l ON l.id = o.listing_id JOIN users s ON s.id = o.seller_id
      WHERE o.buyer_id = ? ORDER BY o.created_at DESC LIMIT 60`
  ).bind(user.id).all();
  const jualRows = approved ? await c.env.DB.prepare(
    `SELECT o.id, o.price, o.shipping, o.status, o.created_at, o.handed_at,
            COALESCE(l.title, '(buku sudah dihapus)') AS title, b.pen_name AS buyer_name
       FROM orders o LEFT JOIN listings l ON l.id = o.listing_id JOIN users b ON b.id = o.buyer_id
      WHERE o.seller_id = ? ORDER BY o.created_at DESC LIMIT 60`
  ).bind(user.id).all() : { results: [] as any[] };
  const bukuRows = approved ? await c.env.DB.prepare(
    `SELECT id, title, price, status, photos, stock,
            (SELECT COUNT(*) FROM orders o WHERE o.listing_id = listings.id) AS jumlah_pesanan
       FROM listings WHERE seller_id = ? AND status != 'deleted' ORDER BY created_at DESC LIMIT 60`
  ).bind(user.id).all() : { results: [] as any[] };

  const saldo = await sellerBalance(c.env.DB, user.id);
  let ledger: any[] = [], wd: any[] = [];
  if (tab === 'saldo') {
    ledger = (await c.env.DB.prepare(
      'SELECT delta, kind, order_id, created_at FROM ledger WHERE user_id = ? ORDER BY id DESC LIMIT 20'
    ).bind(user.id).all()).results || [];
    wd = (await c.env.DB.prepare(
      'SELECT id, amount, fee, kind, status, method, account, requested_at, paid_at FROM withdrawals WHERE user_id = ? ORDER BY requested_at DESC LIMIT 20'
    ).bind(user.id).all()).results || [];
  }

  const akt = await c.env.DB.prepare(
    `SELECT n.id, n.type, n.order_id, n.is_read, n.created_at, u.pen_name AS actor_pen_name, l.title AS order_title
       FROM notifications n
       JOIN users u ON u.id = n.actor_id
       LEFT JOIN orders o ON o.id = n.order_id
       LEFT JOIN listings l ON l.id = o.listing_id
      WHERE n.user_id = ? AND n.type LIKE 'order_%'
      ORDER BY n.created_at DESC LIMIT 50`
  ).bind(user.id).all();
  const aktItems = akt.results || [];

  // Tab default: Toko kalau ada pesanan yang harus dikirim, selain itu Pesanan.
  const perluKirim = (jualRows.results || []).filter((o: any) => o.status === 'paid').length;
  // Prioritas: ?tab= → ada yang perlu dikirim → penjual tanpa pembelian → Pesanan.
  // Angka ringkas ala dashboard: GMV (nilai transaksi selesai) & escrow (dana ditahan).
  const agg: any = approved ? await c.env.DB.prepare(
    `SELECT
       COALESCE(SUM(CASE WHEN status = 'completed' THEN price + shipping ELSE 0 END), 0) AS gmv,
       COALESCE(SUM(CASE WHEN status IN ('paid','handed','disputed')
                         THEN COALESCE(qris_final_amount, price + shipping) ELSE 0 END), 0) AS escrow
     FROM orders WHERE seller_id = ?`
  ).bind(user.id).first() : { gmv: 0, escrow: 0 };
  // "Uangku di mana" versi penjual: dana yang sudah dibayar tapi belum jadi saldo.
  const tahanRows = await c.env.DB.prepare(
    `SELECT id, price, shipping, qris_final_amount, status, updated_at FROM orders
      WHERE ${approved ? 'seller_id' : 'buyer_id'} = ? AND status IN ('paid','handed','disputed')
      ORDER BY updated_at DESC LIMIT 20`
  ).bind(user.id).all();
  const belumPernahBeli = (beliRows.results || []).length === 0;
  const tabFinal = tab || (approved && (perluKirim > 0 || belumPernahBeli) ? 'toko' : 'pesanan');

  return c.html(renderPasarSaya(user, tabFinal, sub, {
    pesanan: { orders: beliRows.results || [], sub },
    toko: { orders: jualRows.results || [], listings: bukuRows.results || [], gmv: Number(agg?.gmv || 0), escrow: Number(agg?.escrow || 0) },
    saldo: { balance: saldo, ledger, withdrawals: wd, ditahan: tahanRows.results || [] },
    aktivitas: { items: aktItems, unread: aktItems.filter((n: any) => !n.is_read).length },
  }));
});

app.get('/pasar/:id', async (c: any) => {
  const user = await getAuthUser(c);
  const owner = isOwner(c.env, user);
  const p: any = await c.env.DB.prepare(
    owner ? 'SELECT * FROM listings WHERE id = ?' : "SELECT * FROM listings WHERE id = ? AND status NOT IN ('hidden','deleted')"
  ).bind(c.req.param('id')).first();
  if (!p) return c.notFound();
  const seller: any = await c.env.DB.prepare(
    'SELECT pen_name, display_name, city, avatar_key, shop_name, shop_slug, seller_status FROM users WHERE id = ?'
  ).bind(p.seller_id).first();
  if (!seller) return c.notFound();
  return c.html(renderListingDetail(user, p, seller, owner));
});

// ---- Order: kwitansi → QRIS → webhook → serah → selesai ----
// State: created → paid → handed → completed | expired | disputed







app.get('/pasar/:id/beli', async (c: any) => {
  const user = await getAuthUser(c);
  if (!user) return c.redirect('/login');
  const p: any = await c.env.DB.prepare("SELECT * FROM listings WHERE id = ? AND status = 'active' AND stock > 0")
    .bind(c.req.param('id')).first();
  if (!p) return c.notFound();
  if (p.seller_id === user.id) return c.redirect(`/pasar/${p.id}`);
  const addr = await c.env.DB.prepare(
    'SELECT * FROM addresses WHERE user_id = ? ORDER BY is_default DESC, created_at ASC LIMIT 5'
  ).bind(user.id).all();
  return c.html(renderCheckoutPage(user, p, await sellerBalance(c.env.DB, user.id), addr.results || []));
});

app.post('/api/pasar/orders', async (c: any) => {
  const me = await getAuthUser(c);
  if (!me) return c.json({ error: 'Harus masuk dulu' }, 401);
  // Audit D-06: sebuah akun tak boleh mengunci inventori (freeze stok katalog).
  if (await hitRate(c.env.DB, `order:${me.id}`, 5, 600)) {
    return c.json({ error: 'Terlalu banyak belanja sekaligus. Selesaikan dulu pesananmu.' }, 429);
  }
  const aktifPembeli: any = await c.env.DB.prepare(
    "SELECT COUNT(*) AS n FROM orders WHERE buyer_id = ? AND status = 'created'"
  ).bind(me.id).first();
  if ((aktifPembeli?.n || 0) >= 3) {
    return c.json({ error: 'Kamu punya ≥3 pesanan menunggu bayar. Selesaikan atau batalkan dulu.' }, 409);
  }
  const body: any = await c.req.json().catch(() => null);
  if (!body) return c.json({ error: 'Body tidak valid' }, 400);
  // Kwitansi Rekber: kesepakatan wajib — ini satu-satunya "form", pengiriman bukan urusan platform.
  const kesepakatan = String(body.kesepakatan || '').trim().slice(0, 500);
  if (kesepakatan.length < 10) return c.json({ error: 'Tuliskan kesepakatan minimal 10 karakter' }, 400);

  const p: any = await c.env.DB.prepare("SELECT * FROM listings WHERE id = ? AND status = 'active' AND stock > 0")
    .bind(String(body.listing_id || '')).first();
  if (!p) return c.json({ error: 'Listing tidak tersedia' }, 404);
  if (p.seller_id === me.id) return c.json({ error: 'Tidak bisa membeli barang sendiri' }, 400);

  // Satu checkout aktif per listing sampai idempotency key per checkout tersedia.
  const live: any = await c.env.DB.prepare(
    "SELECT id FROM orders WHERE listing_id = ? AND status IN ('created','paid','handed') LIMIT 1"
  ).bind(p.id).first();
  if (live) return c.json({ error: 'Ada pesanan aktif untuk buku ini. Coba lagi setelah selesai atau batal.' }, 409);

  // Stok dikunci setelah semua validasi/kuotasi selesai, tepat sebelum order dibuat.
  // Guard atomik `stock > 0` menjadi sumber kebenaran saat beberapa pembeli bersamaan.

  // Ongkir: harga TIDAK dipercaya dari klien — kuotasi ulang di server lalu samakan.
  const destId = String(body.dest_id || '').trim();
  const destName = String(body.dest_name || '').trim().slice(0, 120);
  const destAddress = String(body.dest_address || '').trim().slice(0, 300);
  const courierCode = String(body.courier || '').trim().toLowerCase();
  const service = String(body.service || '').trim().toUpperCase().slice(0, 20);
  const claimedShipping = Number(body.shipping);
  if (!destId) return c.json({ error: 'Pilih kecamatan tujuan pengiriman' }, 400);
  if (destAddress.length < 10) return c.json({ error: 'Tulis alamat lengkap minimal 10 karakter' }, 400);
  if (!courierCode || !service) return c.json({ error: 'Pilih layanan pengiriman' }, 400);

  // Data penerima: wajib — tanpa nama & HP, kurir tidak bisa mengantar.
  const receiverName = String(body.receiver_name || '').trim().slice(0, 60);
  const receiverPhone = normalisasiHp(String(body.receiver_phone || ''));
  const postalCode = String(body.postal_code || '').replace(/[^0-9]/g, '').slice(0, 5);
  const cekPenerima = validasiPenerima({ name: receiverName, phone: receiverPhone, postal: postalCode });
  if (!cekPenerima.ok) return c.json({ error: cekPenerima.error }, 400);

  const seller: any = await c.env.DB.prepare('SELECT district_id FROM users WHERE id = ?').bind(p.seller_id).first();
  if (!seller?.district_id) return c.json({ error: 'Penjual belum menetapkan kota asal' }, 409);
  let sellerCouriers: string[] = [];
  try { sellerCouriers = JSON.parse(p.couriers || '[]'); } catch { sellerCouriers = []; }
  const quote = await cekTarifOngkir(c.env, {
    couriers: sellerCouriers, origin: seller.district_id, destination: destId, weightG: Number(p.weight_g || 1000),
  });
  if (!quote.ok) return c.json({ error: quote.error || 'Tarif pengiriman tidak tersedia' }, 503);
  const picked = quote.options.find((o) => o.courier === courierCode && o.service === service);
  if (!picked) return c.json({ error: 'Layanan pengiriman tidak tersedia untuk rute ini' }, 409);
  if (Number.isSafeInteger(claimedShipping) && claimedShipping !== picked.price) {
    return c.json({ error: `Ongkir berubah menjadi ${picked.price}. Ulangi pemesanan.` }, 409);
  }
  const shipping = picked.price;

  const id = crypto.randomUUID();
  const qrisOrderId = `BBR-${id.slice(0, 8)}-${Date.now()}`;
  const total = Number(p.price) + shipping;

  // Bayar pakai saldo: hanya boleh kalau saldo MENUTUP SELURUH tagihan (harga + ongkir).
  // Tidak ada pembayaran campuran — supaya refund tidak perlu dibelah.
  if (body.use_saldo === true) {
    const saldo = await sellerBalance(c.env.DB, me.id);
    if (saldo < total) {
      return c.json({ error: `Saldo ${saldo.toLocaleString('id-ID')} tidak cukup untuk tagihan ${total.toLocaleString('id-ID')}. Bayar penuh dengan QRIS.` }, 409);
    }
    const r = await c.env.DB.batch([
      c.env.DB.prepare(
        `INSERT INTO orders (id, listing_id, buyer_id, seller_id, price, shipping, status, kesepakatan,
           qris_final_amount, paid_with, courier_code, courier_name, service, eta,
           dest_district_id, dest_district_name, dest_address, receiver_name, receiver_phone, postal_code)
         SELECT ?,?,?,?,?,?,'paid',?,?,'saldo',?,?,?,?,?,?,?,?,?,? FROM listings
         WHERE id = ? AND status = 'active' AND stock > 0
           AND ? <= (SELECT COALESCE(SUM(delta),0) FROM ledger WHERE user_id = ?)
                  - (SELECT COALESCE(SUM(amount + fee),0) FROM withdrawals WHERE user_id = ? AND status = 'requested')`
      ).bind(id, p.id, me.id, p.seller_id, p.price, shipping, kesepakatan, total,
        picked.courier, picked.courierName, picked.service, picked.eta, destId, destName || null, destAddress,
        receiverName, receiverPhone, postalCode, p.id, total, me.id, me.id),
      c.env.DB.prepare("UPDATE listings SET stock = stock - 1 WHERE id = ? AND EXISTS (SELECT 1 FROM orders WHERE id = ?)").bind(p.id, id),
      // Potong saldo sekali saja (NOT EXISTS = idempoten kalau request diulang).
      c.env.DB.prepare(
        `INSERT INTO ledger (user_id, order_id, delta, kind)
         SELECT buyer_id, id, -qris_final_amount, 'purchase' FROM orders
          WHERE id = ? AND status = 'paid'
            AND NOT EXISTS (SELECT 1 FROM ledger WHERE order_id = ? AND kind = 'purchase')`
      ).bind(id, id),
      c.env.DB.prepare("INSERT INTO order_events (order_id, actor, from_st, to_st, note) SELECT ?,?,?,?,? WHERE EXISTS (SELECT 1 FROM orders WHERE id = ?)")
        .bind(id, 'buyer', null, 'created', 'Dibayar penuh dengan saldo', id),
    ]);
    if ((r[0].meta?.changes || 0) === 0) {
      return c.json({ error: 'Stok habis, ada pesanan aktif, atau saldo tidak cukup' }, 409);
    }
    await logOrderEvent(c.env.DB, id, 'system', 'created', 'paid', 'Pembayaran saldo terverifikasi');
    await notifyOrder(c.env.DB, { userId: p.seller_id, actorId: me.id, type: 'order_paid', orderId: id });
    return c.json({ ok: true, id, paid_with: 'saldo' });
  }

  const reserve = await c.env.DB.batch([
    c.env.DB.prepare(
      `INSERT INTO orders (id, listing_id, buyer_id, seller_id, price, shipping, status, kesepakatan,
         qris_order_id, qris_final_amount, courier_code, courier_name, service, eta,
         dest_district_id, dest_district_name, dest_address, receiver_name, receiver_phone, postal_code)
       SELECT ?,?,?,?,?,?,'created',?,?,?,?,?,?,?,?,?,?,?,?,? FROM listings
        WHERE id = ? AND status = 'active' AND stock > 0`
    ).bind(id, p.id, me.id, p.seller_id, p.price, shipping, kesepakatan, qrisOrderId, total,
      picked.courier, picked.courierName, picked.service, picked.eta, destId, destName || null, destAddress,
      receiverName, receiverPhone, postalCode, p.id),
    c.env.DB.prepare("UPDATE listings SET stock = stock - 1 WHERE id = ? AND EXISTS (SELECT 1 FROM orders WHERE id = ?)").bind(p.id, id),
    c.env.DB.prepare('INSERT INTO order_events (order_id, actor, from_st, to_st, note) SELECT ?,?,?,?,? WHERE EXISTS (SELECT 1 FROM orders WHERE id = ?)')
      .bind(id, 'buyer', null, 'created', `Kwitansi dibuat oleh ${me.pen_name}`, id),
  ]).catch(() => null);
  if (!reserve || (reserve[0].meta?.changes || 0) === 0) return c.json({ error: 'Stok buku baru saja habis atau ada pesanan aktif' }, 409);

  const qris = await createQrisTransaction(c.env as unknown as KlikQrisEnv, {
    orderId: qrisOrderId, amount: total, description: `Pasar Buku: ${p.title.slice(0, 60)}`,
  });
  if (!qris.ok) {
    // Audit B-03: restore stok hanya bila flip status benar-benar untuk order masih-created
    // (mimik guard EXISTS di cancel created — menutup race cancel-vs-fail-QRIS).
    await c.env.DB.batch([
      c.env.DB.prepare("UPDATE orders SET status = 'cancelled', updated_at = datetime('now') WHERE id = ? AND status = 'created'").bind(id),
      c.env.DB.prepare("UPDATE listings SET stock = MIN(stock + 1, 999) WHERE id = ? AND status != 'deleted' AND EXISTS (SELECT 1 FROM orders WHERE id = ? AND status = 'created')").bind(p.id, id),
    ]);
    return c.json({ error: qris.error || 'Gagal menyiapkan pembayaran' }, 502);
  }

  await c.env.DB.prepare(
    'UPDATE orders SET qris_signature = ?, qris_url = ?, qris_final_amount = ?, qris_expired_at = ? WHERE id = ? AND status = ?'
  ).bind(qris.signature || null, qris.qrisUrl || null, qris.finalAmount || total, qris.expiredAt || null, id, 'created').run();
  if (body.save_address) {
    const pId = String(body.dest_province_id || '').slice(0, 20) || null;
    const pNm = String(body.dest_province_name || '').slice(0, 120) || null;
    const cId = String(body.dest_city_id || '').slice(0, 20) || null;
    const cNm = String(body.dest_city_name || '').slice(0, 120) || null;
    // Cermin ke users.addr_* (kode lama) + masukkan ke buku alamat kalau belum ada & masih < 5.
    await c.env.DB.prepare(
      `UPDATE users SET addr_receiver = ?, addr_phone = ?, addr_postal = ?, addr_text = ?,
         addr_province_id = ?, addr_province_name = ?, addr_city_id = ?, addr_city_name = ?,
         addr_district_id = ?, addr_district_name = ? WHERE id = ?`
    ).bind(receiverName, receiverPhone, postalCode, destAddress, pId, pNm, cId, cNm,
      destId, destName || null, me.id).run();

    const sama: any = await c.env.DB.prepare(
      'SELECT id FROM addresses WHERE user_id = ? AND district_id = ? AND text = ? LIMIT 1'
    ).bind(me.id, destId, destAddress).first();
    if (!sama) {
      const jml: any = await c.env.DB.prepare('SELECT COUNT(*) AS n FROM addresses WHERE user_id = ?').bind(me.id).first();
      if (Number(jml?.n || 0) < 5) {
        await c.env.DB.batch([
          c.env.DB.prepare('UPDATE addresses SET is_default = 0 WHERE user_id = ?').bind(me.id),
          c.env.DB.prepare(
            `INSERT INTO addresses (id, user_id, label, receiver, phone, postal, text,
               province_id, province_name, city_id, city_name, district_id, district_name, is_default)
             VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,1)`
          ).bind(crypto.randomUUID(), me.id, 'Alamat baru', receiverName, receiverPhone, postalCode,
            destAddress, pId, pNm, cId, cNm, destId, destName || null),
        ]);
      }
    }
  }
  return c.json({ ok: true, id });
});

// ---- Nota cetak: stiker pengiriman (8x11,5) & nota pembelian (A5) ----
app.get('/pasar/order/:id/nota', async (c: any) => {
  const user = await getAuthUser(c);
  if (!user) return c.redirect('/login');
  const o: any = await c.env.DB.prepare('SELECT * FROM orders WHERE id = ?').bind(c.req.param('id')).first();
  if (!o) return c.notFound();
  // hanya pembeli & penjual; kwitansi privat
  if (user.id !== o.buyer_id && user.id !== o.seller_id) return c.notFound();

  const p: any = await c.env.DB.prepare('SELECT id, title, author, cond, weight_g FROM listings WHERE id = ?')
    .bind(o.listing_id).first();
  const seller: any = await c.env.DB.prepare('SELECT pen_name, shop_name, city FROM users WHERE id = ?')
    .bind(o.seller_id).first();
  const buyer: any = await c.env.DB.prepare('SELECT pen_name FROM users WHERE id = ?')
    .bind(o.buyer_id).first();

  if (c.req.query('jenis') === 'pengiriman') {
    if (!o.resi) return c.redirect('/pasar/order/' + o.id + '?err=resi');
    return c.html(renderNotaPengiriman(o, p || {}, seller || {}));
  }
  return c.html(renderNotaPembelian(o, p || {}, seller || {}, buyer || {}, user.id === o.buyer_id ? 'pembeli' : 'penjual'));
});

app.get('/pasar/order/:id', async (c: any) => {
  const user = await getAuthUser(c);
  const o: any = await c.env.DB.prepare('SELECT * FROM orders WHERE id = ?').bind(c.req.param('id')).first();
  if (!o) return c.notFound();
  // Pembeli, penjual, atau owner (mode periksa) boleh lihat; orang lain 404.
  const adminView = isOwner(c.env, user);
  if (!bolehLihatPesanan(o, user?.id, adminView)) return c.notFound();
  const p: any = await c.env.DB.prepare('SELECT title, photos FROM listings WHERE id = ?').bind(o.listing_id).first();
  if (!p) return c.notFound();
  const ev = await c.env.DB.prepare('SELECT actor, note, to_st, created_at FROM order_events WHERE order_id = ? ORDER BY id').bind(o.id).all();
  o.events = ev.results || [];
  // Bukti foto sengketa (kalau ada) — ditampilkan ke owner dan kedua pihak.
  const bukti = await c.env.DB.prepare(
    'SELECT id, uploader_id, role, note, created_at FROM order_evidence WHERE order_id = ? ORDER BY created_at'
  ).bind(o.id).all().catch(() => ({ results: [] as any[] }));
  o.evidence = bukti.results || [];
  const rv: any = await c.env.DB.prepare('SELECT stars, body FROM reviews WHERE order_id = ?').bind(o.id).first();
  o.review_stars = rv ? Number(rv.stars) : 0;
  o.review_body = rv?.body || '';
  let photos: string[] = [];
  try { photos = JSON.parse(p.photos || '[]'); } catch { photos = []; }
  return c.html(renderOrderPage(o, p, photos, user, adminView));
});


app.get('/api/pasar/orders/:id/status', async (c: any) => {
  const me = await getAuthUser(c);
  if (!me) return c.json({ error: 'Harus masuk dulu' }, 401);
  const o: any = await c.env.DB.prepare('SELECT * FROM orders WHERE id = ?').bind(c.req.param('id')).first();
  if (!o || (o.buyer_id !== me.id && o.seller_id !== me.id)) return c.json({ error: 'Tidak ditemukan' }, 404);
  if (o.status === 'created') {
    const r = await reconcileQris(c.env.DB, c.env, o);
    if (!r.ok) return c.json({ ok: false, status: o.status, error: r.error }, 502);
    if (r.paid) o.status = 'paid';
  }
  return c.json({ ok: true, status: o.status });
});

// Webhook hanya trigger; status API provider tetap sumber kebenaran.
app.post('/api/klikqris/webhook', async (c: any) => {
  // Audit B-04: webhook tanpa nonce/replay-table — pelindung defensif rate limit.
  if (await hitRate(c.env.DB, 'klikqris:webhook', 30, 60)) return c.json({ ok: false }, 429);
  const body: any = await c.req.json().catch(() => null);
  if (!body) return c.json({ ok: false }, 400);
  const o: any = await c.env.DB.prepare('SELECT * FROM orders WHERE qris_order_id = ?').bind(String(body.order_id || '')).first();
  if (!o) return c.json({ ok: false, error: 'order tak dikenal' }, 404);
  // Audit R2-04: webhook pada order expired tetap memverifikasi; provider paid →
  // masuk sengketa (bukan diabaikan), stok TIDAK dikembalikan lagi.
  if (o.status === 'expired') {
    const v = verifyWebhook(body, { qris_order_id: o.qris_order_id, qris_signature: o.qris_signature, final_amount: Number(o.qris_final_amount || Number(o.price) + Number(o.shipping)) });
    if (!v.ok) return c.json({ ok: false, error: v.error }, 400);
    const st = await getQrisStatus(c.env, o.qris_order_id);
    if (!st.ok) return c.json({ ok: false, error: st.error }, 502);
    if (!st.paid) return c.json({ ok: true, note: 'expired tanpa pembayaran' });
    const r = await latePaymentToDispute(c.env.DB, o);
    return c.json(r.ok ? { ok: true, note: 'late payment → disputed' } : { ok: false }, r.ok ? 200 : 409);
  }
  if (o.status !== 'created') return c.json({ ok: true, note: 'sudah diproses' });
  const v = verifyWebhook(body, { qris_order_id: o.qris_order_id, qris_signature: o.qris_signature, final_amount: Number(o.qris_final_amount || Number(o.price) + Number(o.shipping)) });
  if (!v.ok) return c.json({ ok: false, error: v.error }, 400);
  const r = await reconcileQris(c.env.DB, c.env, o);
  if (!r.ok) return c.json({ ok: false, error: r.error }, 409);
  if (!r.paid) return c.json({ ok: false, error: 'Pembayaran belum terkonfirmasi provider' }, 409);
  return c.json({ ok: true });
});



// Penjual tandai serah: mode "cod" (COD/antar/kurir sendiri) atau "ekspedisi"
// (kurir + resi WAJIB → bukti trackable pembeli + admin). Guard WHERE status='paid' (idempoten).
// Daftar kurir + URL lacak = TRACK_URLS di src/web/pasar.ts (satu sumber).
// Pembeli membatalkan pesanan yang belum dibayar (stok belum terkunci).
app.post('/api/pasar/order/:id/cancel', async (c: any) => {
  const me = await getAuthUser(c);
  if (!me) return c.json({ error: 'Masuk dulu' }, 401);
  const o: any = await c.env.DB.prepare(
    'SELECT id, buyer_id, seller_id, listing_id, status, paid_with, qris_final_amount, price, shipping FROM orders WHERE id = ?'
  ).bind(c.req.param('id')).first();
  if (!o || o.buyer_id !== me.id) return c.json({ error: 'Pesanan tidak ditemukan' }, 404);

  // Belum dibayar: batal tanpa uang berpindah; marker membuat restore stok retry-safe.
  if (o.status === 'created') {
    const res = await c.env.DB.batch([
      c.env.DB.prepare(
        "UPDATE listings SET stock = MIN(stock + 1, 999) WHERE id = ? AND status != 'deleted' AND EXISTS (SELECT 1 FROM orders WHERE id = ? AND status = 'created')"
      ).bind(o.listing_id, o.id),
      c.env.DB.prepare(
        "UPDATE orders SET status = 'cancelled', updated_at = datetime('now') WHERE id = ? AND status = 'created'"
      ).bind(o.id),
      c.env.DB.prepare(
        "INSERT INTO order_events (order_id, actor, from_st, to_st, note) SELECT ?,?,?,?,? WHERE EXISTS (SELECT 1 FROM orders WHERE id = ? AND status = 'cancelled')"
      ).bind(o.id, 'buyer', 'created', 'cancelled', 'Dibatalkan pembeli sebelum dibayar', o.id),
    ]);
    if ((res[1].meta?.changes || 0) === 0) return c.json({ error: 'Pesanan sudah berubah status' }, 409);
    return c.json({ ok: true });
  }

  if (o.status === 'cancelled' || o.status === 'expired') return c.json({ error: 'Pesanan sudah dibatalkan atau kedaluwarsa — stok sudah dikembalikan' }, 409);

  // Sudah dibayar, penjual BELUM serahkan: boleh batal, tapi uang harus kembali.
  if (o.status === 'paid') {
    if (o.paid_with !== 'saldo') {
      return c.json({ error: 'Pembayaran QRIS harus lewat sengketa supaya dana bisa dikembalikan owner' }, 409);
    }
    const nominal = Number(o.qris_final_amount || (Number(o.price) + Number(o.shipping || 0)));
    // Atomik (audit B-01): flip + refund + restore + event dalam SATU batch — crash di tengah
    // tidak lagi menjadikan order cancelled tanpa ledger. Cond guard disusul di tiap stmt
    // agar race cancel ganda tetap tepat-sekali (pola batch cancel 'created' di atas).
    const res = await c.env.DB.batch([
      c.env.DB.prepare(
        "UPDATE listings SET stock = MIN(stock + 1, 999) WHERE id = ? AND status != 'deleted' AND EXISTS (SELECT 1 FROM orders WHERE id = ? AND status = 'paid' AND paid_with = 'saldo')"
      ).bind(o.listing_id, o.id),
      c.env.DB.prepare(
        "UPDATE orders SET status = 'cancelled', resolution_note = ?, updated_at = datetime('now') WHERE id = ? AND status = 'paid' AND paid_with = 'saldo'"
      ).bind('Dibatalkan pembeli sebelum dikirim — saldo dikembalikan', o.id),
      c.env.DB.prepare(
        `INSERT INTO ledger (user_id, order_id, delta, kind)
         SELECT buyer_id, id, qris_final_amount, 'refund' FROM orders
          WHERE id = ? AND status = 'cancelled'
            AND NOT EXISTS (SELECT 1 FROM ledger WHERE order_id = ? AND kind = 'refund')`
      ).bind(o.id, o.id),
      c.env.DB.prepare(
        "INSERT INTO order_events (order_id, actor, from_st, to_st, note) SELECT ?,?,?,?,? WHERE EXISTS (SELECT 1 FROM orders WHERE id = ? AND status = 'cancelled')"
      ).bind(o.id, 'buyer', 'paid', 'cancelled', 'Dibatalkan pembeli sebelum dikirim — saldo dikembalikan', o.id),
    ]);
    if ((res[1].meta?.changes || 0) === 0) return c.json({ error: 'Pesanan sudah berubah status' }, 409);
    await notifyOrder(c.env.DB, { userId: o.seller_id, actorId: me.id, type: 'order_cancel', orderId: o.id });
    return c.json({ ok: true, refunded: nominal });
  }

  return c.json({ error: 'Pesanan sudah dikirim — pakai tombol Ada Masalah' }, 409);
});

// Ulasan hanya dari pembeli, hanya setelah selesai, sekali per pesanan (UNIQUE order_id).
app.post('/api/pasar/order/:id/review', async (c: any) => {
  const me = await getAuthUser(c);
  if (!me) return c.json({ error: 'Masuk dulu' }, 401);
  const o: any = await c.env.DB.prepare('SELECT id, buyer_id, seller_id, listing_id, status FROM orders WHERE id = ?').bind(c.req.param('id')).first();
  if (!o || o.buyer_id !== me.id) return c.json({ error: 'Pesanan tidak ditemukan' }, 404);
  if (o.status !== 'completed') return c.json({ error: 'Ulasan bisa ditulis setelah pesanan selesai' }, 409);
  const body: any = await c.req.json().catch(() => ({}));
  const stars = Number(body?.stars || 0);
  if (!(stars >= 1 && stars <= 5)) return c.json({ error: 'Pilih bintang 1–5' }, 400);
  const teks = String(body?.body || '').trim().slice(0, 300);
  try {
    await c.env.DB.prepare(
      'INSERT INTO reviews (id, order_id, listing_id, seller_id, buyer_id, stars, body) VALUES (?,?,?,?,?,?,?)'
    ).bind(crypto.randomUUID(), o.id, o.listing_id, o.seller_id, me.id, stars, teks || null).run();
  } catch (e: any) {
    if (String(e?.message || e).includes('UNIQUE')) return c.json({ error: 'Pesanan ini sudah kamu ulas' }, 409);
    throw e;
  }
  return c.json({ ok: true });
});

app.post('/pasar/order/:id/handover', async (c: any) => {
  const me = await getAuthUser(c);
  if (!me) return c.json({ error: 'Harus masuk dulu' }, 401);
  const body: any = await c.req.json().catch(() => ({}));
  const mode = body?.mode === 'ekspedisi' ? 'ekspedisi' : 'cod';
  let note = String(body?.note || '').trim().slice(0, 200);
  let kurir: string | null = null, resi: string | null = null;
  let resiVerified = 0;
  if (mode === 'ekspedisi') {
    kurir = String(body?.kurir || '').trim().slice(0, 40);
    resi = String(body?.resi || '').trim().slice(0, 60);
    if (!kurir || !resi) return c.json({ error: 'Kirim via ekspedisi wajib isi nama kurir + nomor resi' }, 400);
    const fmt = validasiFormatResi(resi);
    if (!fmt.ok) return c.json({ error: fmt.error }, 400);
    note = `Dikirim via ${kurir} — resi ${resi}`;
  } else if (!note) note = 'Penjual menandai sudah diserahkan';
  const o: any = await c.env.DB.prepare('SELECT * FROM orders WHERE id = ?').bind(c.req.param('id')).first();
  if (!o || o.seller_id !== me.id) return c.json({ error: 'Tidak ditemukan' }, 404);
  // Guard status lebih dulu: jangan memakai kuota verifikasi resi / panggilan BinderByte
  // untuk pesanan yang memang belum bisa diserahkan.
  if (o.status !== 'paid') return c.json({ error: 'Pesanan tidak dalam status dibayar' }, 409);

  if (mode === 'ekspedisi') {
    // Rate limit: maksimum 5 percobaan resi per jam per pesanan (cegah tebak-tebakan nomor).
    const withinHour = o.resi_try_at && (Date.now() - new Date(String(o.resi_try_at).replace(' ', 'T') + 'Z').getTime()) < 3600_000;
    const tries = (withinHour ? Number(o.resi_tries || 0) : 0) + 1;
    if (tries > 5) return c.json({ error: 'Terlalu banyak percobaan nomor resi. Coba lagi 1 jam lagi.' }, 429);
    await c.env.DB.prepare("UPDATE orders SET resi_tries = ?, resi_try_at = datetime('now') WHERE id = ?").bind(tries, o.id).run();

    // Verifikasi ke kurir SEKARANG, bukan menunggu cron 24 jam.
    const cek = await cekResi(c.env, KURIR_MAP[kurir!] || 'jne', resi!);
    if (cek.kind === 'notfound') {
      return c.json({ error: `Nomor resi tidak terdaftar di ${kurir}. Periksa kembali nomor dari kurir.` }, 400);
    }
    // kind='error' → gangguan API: terima tapi tandai belum terverifikasi; auto-selesai ditahan.
    resiVerified = cek.kind === 'found' ? 1 : 0;
  }

  let res: any;
  try {
    res = await c.env.DB.prepare(
      "UPDATE orders SET status = 'handed', handed_at = datetime('now'), kurir = ?, resi = ?, resi_verified = ?, resi_checked_at = datetime('now'), updated_at = datetime('now') WHERE id = ? AND status = 'paid'"
    ).bind(kurir, resi, resiVerified, o.id).run();
  } catch (e: any) {
    // unique index (kurir, resi) → resi sudah dipakai pesanan lain
    if (/UNIQUE/i.test(String(e?.message || ''))) return c.json({ error: 'Nomor resi ini sudah dipakai pesanan lain' }, 409);
    throw e;
  }
  if ((res.meta?.changes || 0) === 0) return c.json({ error: 'Pesanan tidak dalam status dibayar' }, 409);
  const noteFinal = mode === 'ekspedisi' && resiVerified === 0 ? `${note} (belum terverifikasi kurir, dicek ulang otomatis)` : note;
  await logOrderEvent(c.env.DB, o.id, 'seller', 'paid', 'handed', noteFinal);
  await notifyOrder(c.env.DB, { userId: o.buyer_id, actorId: o.seller_id, type: 'order_handed', orderId: o.id });
  return c.json({ ok: true });
});

// Cek status resi live (BinderByte) — pembeli/penjual pada order sendiri. Guard: handed+resi.
// KURIR_MOCK utk dev/test; BINDERBYTE_KEY prod. Fallback selalu "Buka Web Kurir".
app.post('/pasar/order/:id/track', async (c: any) => {
  const me = await getAuthUser(c);
  if (!me) return c.json({ error: 'Harus masuk dulu' }, 401);
  const o: any = await c.env.DB.prepare('SELECT * FROM orders WHERE id = ?').bind(c.req.param('id')).first();
  // owner ikut boleh: dia yang memutus sengketa, butuh melihat perjalanan paket
  if (!o || (o.buyer_id !== me.id && o.seller_id !== me.id && !isOwner(c.env, me))) return c.json({ error: 'Tidak ditemukan' }, 404);
  if (!o.kurir || !o.resi) return c.json({ error: 'Resi belum tercatat' }, 409);
  const r = await cekResi(c.env, KURIR_MAP[o.kurir] || 'jne', o.resi);
  if (r.kind === 'found' && !o.resi_verified) {
    await c.env.DB.prepare("UPDATE orders SET resi_verified = 1, resi_checked_at = datetime('now') WHERE id = ? AND resi_verified = 0").bind(o.id).run();
  }
  return c.json(r.ok ? { ok: true, status: r.status, desc: r.desc, history: r.history } : { ok: false, kind: r.kind, error: r.error });
});

// Pembeli klik "Pesanan Diterima" → completed + kredit saldo penjual (fee 5000 dipotong),
// ongkir utuh ke penjual. Guard WHERE status='handed' = idempoten.
app.post('/pasar/order/:id/receive', async (c: any) => {
  const me = await getAuthUser(c);
  if (!me) return c.json({ error: 'Harus masuk dulu' }, 401);
  const o: any = await c.env.DB.prepare('SELECT * FROM orders WHERE id = ?').bind(c.req.param('id')).first();
  if (!o || o.buyer_id !== me.id) return c.json({ error: 'Tidak ditemukan' }, 404);
  if (o.status !== 'handed') return c.json({ error: 'Pesanan belum ditandai diserahkan penjual' }, 409);

  const money = settlementAmounts(o.price, o.shipping, PASAR_FEE);
  let settled: any[];
  try {
    settled = await c.env.DB.batch([
      c.env.DB.prepare("UPDATE orders SET status = 'completed', updated_at = datetime('now') WHERE id = ? AND status = 'handed'").bind(o.id),
      c.env.DB.prepare("INSERT INTO ledger (user_id, order_id, delta, kind) SELECT ?,?,?,? FROM orders WHERE id = ? AND status = 'completed'").bind(o.seller_id, o.id, money.sale, 'sale', o.id),
      c.env.DB.prepare("INSERT INTO ledger (user_id, order_id, delta, kind) SELECT ?,?,?,? FROM orders WHERE id = ? AND status = 'completed'").bind(o.seller_id, o.id, money.fee, 'fee', o.id),
      c.env.DB.prepare("INSERT INTO order_events (order_id, actor, from_st, to_st, note) SELECT ?,?,?,?,? FROM orders WHERE id = ? AND status = 'completed'")
        .bind(o.id, 'buyer', 'handed', 'completed', 'Pembeli konfirmasi terima', o.id),
    ]);
  } catch (e: any) {
    if (String(e?.message || e).includes('UNIQUE')) return c.json({ error: 'Pesanan sudah diselesaikan' }, 409);
    throw e;
  }
  if (!(settled[0].meta?.changes || 0)) return c.json({ error: 'Pesanan sudah diselesaikan' }, 409);
  await notifyOrder(c.env.DB, { userId: o.seller_id, actorId: o.buyer_id, type: 'order_done', orderId: o.id });
  return c.json({ ok: true });
});

// Pembeli lapor sengketa
app.post('/pasar/order/:id/dispute', async (c: any) => {
  const me = await getAuthUser(c);
  if (!me) return c.json({ error: 'Harus masuk dulu' }, 401);
  const body: any = await c.req.json().catch(() => null);
  const note = String(body?.note || '').trim().slice(0, 500);
  if (note.length < 10) return c.json({ error: 'Ceritakan masalah minimal 10 karakter' }, 400);
  const o: any = await c.env.DB.prepare('SELECT * FROM orders WHERE id = ?').bind(c.req.param('id')).first();
  if (!o || (o.buyer_id !== me.id && o.seller_id !== me.id)) return c.json({ error: 'Tidak ditemukan' }, 404);
  if (!['paid', 'handed'].includes(o.status)) return c.json({ error: 'Status tidak bisa disengketakan' }, 409);

  const res = await c.env.DB.prepare(
    "UPDATE orders SET status = 'disputed', updated_at = datetime('now') WHERE id = ? AND status = ?"
  ).bind(o.id, o.status).run();
  if ((res.meta?.changes || 0) === 0) return c.json({ ok: true });
  await logOrderEvent(c.env.DB, o.id, me.id === o.buyer_id ? 'buyer' : 'seller', o.status, 'disputed', note);
  await notifyOrder(c.env.DB, {
    userId: me.id === o.buyer_id ? o.seller_id : o.buyer_id,
    actorId: me.id, type: 'order_dispute', orderId: o.id,
  });
  return c.json({ ok: true });
});

// ---- Saldo penjual: lihat, tarik (min 40rb), riwayat ----




// Satu pintu setelah login: owner ke dashboard, pengguna lain ke feed.


app.get('/saldo', async (c: any) => {
  const user = await getAuthUser(c);
  if (!user) return c.redirect('/login');
  return c.redirect('/pasar/saya?tab=saldo');
});

// Bukti pencairan: dokumen internal bernomor. Bisa dibuka owner & pemilik saldo.
app.get('/saldo/pencairan/:kode', async (c: any) => {
  const me = await getAuthUser(c);
  if (!me) return c.redirect('/login');
  const w: any = await c.env.DB.prepare(
    `SELECT w.*, u.pen_name FROM withdrawals w JOIN users u ON u.id = w.user_id WHERE w.kode = ?`
  ).bind(c.req.param('kode')).first();
  if (!w) return c.notFound();
  const owner = isOwner(c.env, me);
  if (!owner && w.user_id !== me.id) return c.notFound();
  return c.html(renderBuktiPencairan(w, { owner, penName: w.pen_name || '—' }));
});

app.post('/api/saldo/withdraw', async (c: any) => {
  const me = await getAuthUser(c);
  if (!me) return c.json({ error: 'Harus masuk dulu' }, 401);
  const body: any = await c.req.json().catch(() => null);
  const amount = Number(body?.amount);
  const kind: 'seller' | 'buyer' = me.seller_status === 'approved' ? 'seller' : 'buyer';
  const fee = withdrawFee(kind, amount);
  const total = withdrawTotal(kind, amount);
  const method = ['qris', 'bank', 'ewallet'].includes(body?.method) ? body.method : 'qris';
  const account = String(body?.account || '').trim().slice(0, 120);
  if (!Number.isSafeInteger(amount) || amount < WITHDRAW_MIN) {
    return c.json({ error: `Minimal tarik Rp${WITHDRAW_MIN.toLocaleString('id-ID')}` }, 400);
  }
  if (account.length < 4) return c.json({ error: 'Tulis tujuan pencairan (no. QRIS/rekening/e-wallet)' }, 400);
  // Anti-banjir antrean: satu pengajuan aktif, maksimal 3 pengajuan per 24 jam.
  const akt: any = await c.env.DB.prepare(
    "SELECT COUNT(*) AS n FROM withdrawals WHERE user_id = ? AND status = 'requested'"
  ).bind(me.id).first();
  if (Number(akt?.n || 0) > 0) return c.json({ error: 'Masih ada pengajuan yang diproses owner. Tunggu sampai selesai.' }, 409);
  const hr: any = await c.env.DB.prepare(
    "SELECT COUNT(*) AS n FROM withdrawals WHERE user_id = ? AND requested_at > datetime('now','-1 day')"
  ).bind(me.id).first();
  if (Number(hr?.n || 0) >= 3) return c.json({ error: 'Batas 3 pengajuan pencairan per 24 jam. Coba lagi besok.' }, 429);

  const id = crypto.randomUUID();
  // Nomor bukti: dipakai owner & penjual untuk merujuk pencairan ini (bukan UUID).
  const acak = [...crypto.getRandomValues(new Uint8Array(3))].map((b) => b.toString(36)).join('');
  const kode = kodePencairan(new Date(), acak);
  // Cek saldo menyatu di statement INSERT: double-tap tak bisa bikin saldo minus.
  // Reservasi = jumlah ditarik + biaya, supaya biaya tidak bisa dipakai dua kali.
  const res = await c.env.DB.prepare(
    `INSERT INTO withdrawals (id, user_id, amount, fee, kind, method, account, status, kode)
     SELECT ?,?,?,?,?,?,?, 'requested', ?
     WHERE ? <= (SELECT COALESCE(SUM(delta),0) FROM ledger WHERE user_id = ?)
              - (SELECT COALESCE(SUM(amount + fee),0) FROM withdrawals WHERE user_id = ? AND status = 'requested')`
  ).bind(id, me.id, amount, fee, kind, method, account, kode, total, me.id, me.id).run();
  if ((res.meta?.changes || 0) === 0) return c.json({ error: 'Saldo tidak cukup untuk jumlah + biaya tarik' }, 409);
  return c.json({ ok: true, id, kode, fee, net: amount });
});

// ---- Pesanan pembeli ----
// Halaman lama → satu pintu hub (302, tautan & bookmark lama tetap hidup).
app.get('/pesanan', async (c: any) => {
  const user = await getAuthUser(c);
  if (!user) return c.redirect('/login');
  const sub = c.req.query('tab') || 'bayar';
  return c.redirect(`/pasar/saya?tab=pesanan&sub=${encodeURIComponent(sub)}`);
});

// ---- Kelola listing dan stok buku ----
app.patch('/api/pasar/listings/:id', async (c: any) => {
  const me = await getAuthUser(c);
  if (!me) return c.json({ error: 'Harus masuk dulu' }, 401);
  const body: any = await c.req.json().catch(() => ({}));
  const title = String(body?.title || '').trim().slice(0, 120);
  const price = Number(body?.price || 0);
  const stock = validStock(body?.stock, true);
  const cond = ['baru', 'bekas_bagus', 'bekas_layak'].includes(String(body?.cond)) ? String(body.cond) : '';
  if (title.length < 3) return c.json({ error: 'Judul minimal 3 karakter' }, 400);
  if (!(price >= 1000 && price <= MAX_PRICE)) return c.json({ error: 'Harga harus Rp1.000–Rp10.000.000' }, 400);
  if (stock === null) return c.json({ error: 'Stok harus bilangan bulat 0–999' }, 400);
  if (!cond) return c.json({ error: 'Kondisi buku tidak dikenal' }, 400);

  const l: any = await c.env.DB.prepare('SELECT id, seller_id, status FROM listings WHERE id = ?').bind(c.req.param('id')).first();
  if (!l || l.seller_id !== me.id) return c.json({ error: 'Tidak ditemukan' }, 404);
  if (l.status === 'sold' || l.status === 'deleted') return c.json({ error: 'Listing ini tidak bisa diubah' }, 409);
  const live: any = await c.env.DB.prepare(
    "SELECT 1 FROM orders WHERE listing_id = ? AND status IN ('created','paid','handed','disputed') LIMIT 1"
  ).bind(l.id).first();
  if (live) return c.json({ error: 'Ada pesanan berjalan — stok belum bisa diubah' }, 409);

  await c.env.DB.prepare('UPDATE listings SET title = ?, price = ?, cond = ?, stock = ? WHERE id = ?')
    .bind(title, Math.round(price), cond, stock, l.id).run();
  return c.json({ ok: true });
});

// Laporan listing: satu per orang per buku, tidak boleh melaporkan milik sendiri.
app.post('/api/pasar/listings/:id/report', async (c: any) => {
  const me = await getAuthUser(c);
  if (!me) return c.json({ error: 'Masuk dulu' }, 401);
  const body: any = await c.req.json().catch(() => ({}));
  const reason = ['mismatch', 'fraud', 'misleading', 'price', 'other'].includes(String(body?.reason)) ? String(body.reason) : 'other';
  const note = String(body?.note || '').trim().slice(0, 300);
  const l: any = await c.env.DB.prepare("SELECT id, seller_id, status FROM listings WHERE id = ? AND status != 'hidden'")
    .bind(c.req.param('id')).first();
  if (!l) return c.json({ error: 'Buku tidak ditemukan' }, 404);
  if (l.seller_id === me.id) return c.json({ error: 'Tidak bisa melaporkan buku sendiri' }, 400);
  try {
    await c.env.DB.prepare(
      'INSERT INTO listing_reports (id, listing_id, reporter_id, reason, note) VALUES (?,?,?,?,?)'
    ).bind(crypto.randomUUID(), l.id, me.id, reason, note || null).run();
  } catch (e: any) {
    if (String(e?.message || e).includes('UNIQUE')) return c.json({ error: 'Kamu sudah melaporkan buku ini' }, 409);
    throw e;
  }
  return c.json({ ok: true });
});

app.post('/api/pasar/listings/:id/status', async (c: any) => {
  const me = await getAuthUser(c);
  if (!me) return c.json({ error: 'Harus masuk dulu' }, 401);
  const body: any = await c.req.json().catch(() => null);
  const next = body?.status === 'hidden' ? 'hidden' : body?.status === 'active' ? 'active' : null;
  if (!next) return c.json({ error: 'Status tidak dikenal' }, 400);

  const l: any = await c.env.DB.prepare('SELECT id, seller_id, status FROM listings WHERE id = ?')
    .bind(c.req.param('id')).first();
  if (!l || l.seller_id !== me.id) return c.json({ error: 'Tidak ditemukan' }, 404);
  if (l.status === 'sold') return c.json({ error: 'Buku sudah terjual — tidak bisa diubah' }, 409);

  const live: any = await c.env.DB.prepare(
    // Audit B-07: 'disputed' juga status hidup (sama dgn PATCH/DELETE guard).
    "SELECT id FROM orders WHERE listing_id = ? AND status IN ('created','paid','handed','disputed') LIMIT 1"
  ).bind(l.id).first();
  if (live) return c.json({ error: 'Ada pesanan berjalan untuk buku ini' }, 409);

  await c.env.DB.prepare('UPDATE listings SET status = ? WHERE id = ?').bind(next, l.id).run();
  return c.json({ ok: true, status: next });
});

app.delete('/api/pasar/listings/:id', async (c: any) => {
  const me = await getAuthUser(c);
  if (!me) return c.json({ error: 'Harus masuk dulu' }, 401);
  const l: any = await c.env.DB.prepare('SELECT id, seller_id, status, photos FROM listings WHERE id = ?')
    .bind(c.req.param('id')).first();
  if (!l || l.seller_id !== me.id) return c.json({ error: 'Tidak ditemukan' }, 404);
  if (l.status === 'deleted') return c.json({ ok: true });
  const live: any = await c.env.DB.prepare(
    "SELECT 1 FROM orders WHERE listing_id = ? AND status IN ('created','paid','handed','disputed') LIMIT 1"
  ).bind(l.id).first();
  if (live) return c.json({ error: 'Ada pesanan berjalan — listing belum bisa dihapus' }, 409);
  await c.env.DB.prepare("UPDATE listings SET status = 'deleted', stock = 0 WHERE id = ? AND seller_id = ?")
    .bind(l.id, me.id).run();
  // Audit D-07/B-06: objek foto tetap tidak layak tayang — bersihkan dari R2 (best-effort,
  // sama dengan pola seller_docs di pasar.ts replace & sweep).
  try {
    const photos = JSON.parse(l.photos || '[]');
    if (c.env.MEDIA) for (const k of photos) await c.env.MEDIA.delete(String(k)).catch(() => {});
  } catch (_) { /* JSON foto rusak — diabaikan, status sudah 'deleted'. */ }
  return c.json({ ok: true });
});

// ---- Dashboard penjual (hanya yang sudah approved) ----
app.get('/toko', async (c: any) => {
  const user = await getAuthUser(c);
  if (!user) return c.redirect('/login');
  // Belum terverifikasi → halaman verifikasi (satu pintu, tidak ada dashboard kosong).
  if (user.seller_status !== 'approved') return c.redirect('/pasar/jual');
  const sub = c.req.query('tab') || 'perlu';
  return c.redirect(`/pasar/saya?tab=toko&sub=${encodeURIComponent(sub)}`);
});

// ---- Verifikasi penjual: ajukan → owner review ----
app.post('/api/pasar/seller/apply', async (c: any) => {
  const me = await getAuthUser(c);
  if (!me) return c.json({ error: 'Harus masuk dulu' }, 401);
  if (me.seller_status === 'approved') return c.json({ error: 'Akun sudah terverifikasi' }, 409);
  if (me.seller_status === 'pending') return c.json({ error: 'Pengajuan masih ditinjau owner' }, 409);

  const body: any = await c.req.json().catch(() => null);
  const fullName = String(body?.full_name || '').trim().slice(0, 80);
  const phone = String(body?.phone || '').replace(/\D/g, '').slice(0, 15);
  const note = String(body?.note || '').trim().slice(0, 300);
  const shopName = String(body?.shop_name || '').replace(/\s+/g, ' ').trim().slice(0, 40);
  const bankName = String(body?.bank_name || '').replace(/\s+/g, ' ').trim().slice(0, 80);
  const bankAccount = String(body?.bank_account || '').replace(/[^0-9]/g, '').slice(0, 20);
  if (fullName.length < 3) return c.json({ error: 'Nama lengkap minimal 3 karakter' }, 400);
  if (!/^0?8\d{8,13}$/.test(phone)) return c.json({ error: 'Nomor WhatsApp tidak valid' }, 400);
  if (shopName.length < 2) return c.json({ error: 'Nama toko minimal 2 karakter' }, 400);
  if (bankName.length < 3) return c.json({ error: 'Isi nama pemilik rekening/QRIS (min 3 karakter)' }, 400);
  if (bankAccount.length < 8) return c.json({ error: 'Nomor rekening/QRIS minimal 8 angka' }, 400);
  // Owner memverifikasi manual: tanpa foto KTP & buku tabungan, pengajuan tidak bisa dinilai.
  const docs: any = await c.env.DB.prepare('SELECT COUNT(*) AS n FROM seller_docs WHERE user_id = ?').bind(me.id).first();
  if (Number(docs?.n || 0) < 2) return c.json({ error: 'Unggah foto KTP dan buku tabungan dulu' }, 400);
  const dipakai: any = await c.env.DB.prepare(
    'SELECT 1 FROM users WHERE shop_name = ? COLLATE NOCASE AND id != ? LIMIT 1'
  ).bind(shopName, me.id).first();
  if (dipakai) return c.json({ error: 'Nama toko sudah dipakai, pilih yang lain' }, 409);

  // Guard status di WHERE: double-submit tidak menimpa pengajuan yang sudah diproses owner.
  const res = await c.env.DB.prepare(
    `UPDATE users SET seller_status='pending', seller_full_name=?, seller_phone=?, seller_note=?, shop_name=?,
       seller_bank_name=?, seller_bank_account=?,
       seller_applied_at=datetime('now'), seller_reject_reason=NULL
     WHERE id=? AND seller_status IN ('none','rejected')`
  ).bind(fullName, phone, note || null, shopName, bankName, bankAccount, me.id).run();
  if ((res.meta?.changes || 0) === 0) return c.json({ error: 'Pengajuan tidak bisa dikirim sekarang' }, 409);
  return c.json({ ok: true });
});

// ---- Owner: putuskan sengketa + cairkan saldo ----
// (handlers owner diregistrasi di index lewat routes/owner.ts — mountOwner tetap di index)




}
