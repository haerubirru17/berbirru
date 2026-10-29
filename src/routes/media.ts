import { getAuthUser } from '../lib/shared';

// Handlers + konstanta media dipindah verbatim dari index.ts.
// ---- MEDIA PROFIL (R2): avatar & cover ----
// batas setelah kompres client. ponytail: cap tetap, naikkan jika perlu.
const MEDIA_SPEC: Record<string, { max: number; col: string; dir: string }> = {
  avatar: { max: 256 * 1024, col: 'avatar_key', dir: 'avatar' },
  cover:  { max: 512 * 1024, col: 'cover_key',  dir: 'cover' }
};
const MEDIA_TYPES: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp'
};


export function mountMedia(app: any) {
app.put('/api/me/media/:kind', async (c: any) => {
  const me = await getAuthUser(c);
  if (!me) return c.json({ error: 'Harus masuk dulu' }, 401);

  const spec = MEDIA_SPEC[c.req.param('kind')];
  if (!spec) return c.json({ error: 'Jenis media tak dikenal' }, 404);

  const ct = (c.req.header('Content-Type') || '').split(';')[0].trim().toLowerCase();
  const ext = MEDIA_TYPES[ct];
  if (!ext) return c.json({ error: 'Hanya JPEG/PNG/WebP' }, 415);
  if (!c.env.MEDIA) return c.json({ error: 'Media belum siap' }, 503);

  const buf = await c.req.arrayBuffer();
  if (!buf || buf.byteLength === 0) return c.json({ error: 'Berkas kosong' }, 400);
  if (buf.byteLength > spec.max) return c.json({ error: `Gambar terlalu besar (maks ${Math.round(spec.max / 1024)}KB setelah kompresi otomatis)` }, 413);

  // magic bytes sungguhan — Content-Type bisa bohong
  const b = new Uint8Array(buf);
  const isJpeg = b[0] === 0xFF && b[1] === 0xD8;
  const isPng = b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4E && b[3] === 0x47;
  const isWebP = b[0] === 0x52 && b[1] === 0x49 && b[2] === 0x46 && b[3] === 0x46 && b[8] === 0x57 && b[9] === 0x45 && b[10] === 0x42 && b[11] === 0x50;
  const sniffExt = isJpeg ? 'jpg' : isPng ? 'png' : isWebP ? 'webp' : null;
  if (!sniffExt || sniffExt !== ext) return c.json({ error: 'Isi berkas tidak cocok dengan tipenya' }, 415);

  // key per-user+jenis: timpa lama, tak menumpuk sampah di bucket
  const key = `${spec.dir}/${me.id}.${ext}`;
  await c.env.MEDIA.put(key, buf, { httpMetadata: { contentType: ct } });

  const old: any = await c.env.DB.prepare(`SELECT ${spec.col} AS k FROM users WHERE id = ?`).bind(me.id).first();
  // simpan key + versi (?v=) — setiap render URL-nya beda dari upload sebelumnya, cache browser tak pernah basi
  const stored = `${key}?v=${Date.now()}`;
  await c.env.DB.prepare(`UPDATE users SET ${spec.col} = ? WHERE id = ?`).bind(stored, me.id).run();

  // buang objek lama kalau ekstensinya beda (strip versi sebelum hapus dari R2)
  const oldBase = String(old?.k || '').split('?')[0];
  if (oldBase && oldBase !== key) {
    await c.env.MEDIA.delete(oldBase).catch(() => {});
  }

  // cache-bust via versi = epoch saat upload
  return c.json({ ok: true, url: `/media/${stored}` });
});

app.get('/media/*', async (c: any) => {
  const key = c.req.path.replace('/media/', '');
  if (!/^[a-z0-9_-]+\/[a-z0-9_-]+\.(jpg|png|webp)$/i.test(key)) return c.json({ error: 'Key tak valid' }, 400);
  if (!c.env.MEDIA) return c.json({ error: 'Media belum siap' }, 503);
  const obj = await c.env.MEDIA.get(key);
  if (!obj) return c.json({ error: 'Tidak ditemukan' }, 404);
  return c.body(obj.body, 200, {
    'Content-Type': obj.httpMetadata?.contentType || 'application/octet-stream',
    // ponytail: max-age 5 menit — ganti avatar tampil fresh cepat; ETag-revalidate kalau traffic R2 jadi mahal
    'Cache-Control': 'public, max-age=300, stale-while-revalidate=3600'
  });
});
}
