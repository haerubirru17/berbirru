import { getAuthUser, isOwner } from '../lib/shared';
import { renderOwnerPage } from '../web/owner';
import { renderAkunAdminPage } from '../web/akunAdmin';
import { settlementAmounts, PASAR_FEE } from '../lib/pasar-settlement';
import { slugUnik } from '../lib/toko';
import { cekResi } from '../kurir';
import { logOrderEvent, notifyOrder, KURIR_MAP, sweepCursor, setSweepCursor, resetSweepCursor, sweepLock, sweepUnlock } from '../lib/pasar-core';
import { reconcileQris } from './pasar';

// Handlers owner dipindah verbatim dari index.ts (termasuk /api/owner/*).
export function mountOwner(app: any) {
app.get('/owner', async (c: any) => {
  const me = await getAuthUser(c);
  if (!isOwner(c.env, me)) return c.notFound(); // jangan bocorkan keberadaan halaman
  const disp = await c.env.DB.prepare(
    `SELECT o.*, l.title, s.pen_name AS seller_name, b.pen_name AS buyer_name
     FROM orders o
     JOIN listings l ON l.id = o.listing_id
     JOIN users s ON s.id = o.seller_id
     JOIN users b ON b.id = o.buyer_id
     WHERE o.status = 'disputed' ORDER BY o.updated_at DESC LIMIT 50`
  ).all();
  const wd = await c.env.DB.prepare(
    `SELECT w.*, u.pen_name FROM withdrawals w JOIN users u ON u.id = w.user_id
     WHERE w.status = 'requested' ORDER BY w.requested_at ASC LIMIT 50`
  ).all();
  const calon = await c.env.DB.prepare(
    `SELECT u.id, u.pen_name, u.email, u.city, u.seller_full_name, u.seller_phone, u.seller_note, u.shop_name, u.seller_applied_at,
            u.seller_bank_name, u.seller_bank_account,
            (SELECT COUNT(*) FROM seller_docs d WHERE d.user_id = u.id AND d.kind = 'ktp') AS doc_ktp,
            (SELECT COUNT(*) FROM seller_docs d WHERE d.user_id = u.id AND d.kind = 'bank') AS doc_bank,
            (SELECT COUNT(*) FROM listings l WHERE l.seller_id = u.id AND l.status = 'active') AS listing_aktif
       FROM users u WHERE u.seller_status = 'pending' ORDER BY u.seller_applied_at ASC LIMIT 50`
  ).all();

  // ponytail: query per kartu (maks 50 antrean) — cukup untuk volume UMKM.
  // Gold-plating: satu query agregat kalau antrean sampai ratusan.
  const disputes = disp.results || [];
  for (const o of disputes as any[]) {
    const ev = await c.env.DB.prepare(
      'SELECT actor, from_st, to_st, note, created_at FROM order_events WHERE order_id = ? ORDER BY id'
    ).bind(o.id).all();
    o.events = ev.results || [];
    const bukti = await c.env.DB.prepare(
      'SELECT id, uploader_id, role, note, created_at FROM order_evidence WHERE order_id = ? ORDER BY created_at'
    ).bind(o.id).all();
    o.evidence = bukti.results || [];
    const bs = await c.env.DB.prepare(
      `SELECT (SELECT COUNT(*) FROM orders WHERE buyer_id = ? AND status = 'completed') AS selesai,
              (SELECT COUNT(*) FROM orders WHERE buyer_id = ? AND status IN ('disputed','refunded')) AS sengketa,
              (SELECT MIN(created_at) FROM users WHERE id = ?) AS sejak`
    ).bind(o.buyer_id, o.buyer_id, o.buyer_id).first();
    o.buyer_stats = bs || {};
    const ss = await c.env.DB.prepare(
      `SELECT (SELECT COUNT(*) FROM orders WHERE seller_id = ? AND status = 'completed') AS selesai,
              (SELECT COUNT(*) FROM orders WHERE seller_id = ? AND status IN ('disputed','refunded')) AS sengketa,
              (SELECT MIN(created_at) FROM users WHERE id = ?) AS sejak`
    ).bind(o.seller_id, o.seller_id, o.seller_id).first();
    o.seller_stats = ss || {};
  }

  const withdrawals = wd.results || [];
  for (const w of withdrawals as any[]) {
    const bal: any = await c.env.DB.prepare(
      `SELECT (SELECT COALESCE(SUM(delta),0) FROM ledger WHERE user_id = ?1)
            - (SELECT COALESCE(SUM(amount),0) FROM withdrawals WHERE user_id = ?2 AND status = 'requested') AS bal`
    ).bind(w.user_id, w.user_id).first();
    w.saldo = Number(bal?.bal || 0);
    const src: any = await c.env.DB.prepare(
      `SELECT kind, COALESCE(SUM(delta),0) AS total FROM ledger WHERE user_id = ? GROUP BY kind`
    ).bind(w.user_id).all();
    w.ledger_ringkas = src.results || [];
    const risk: any = await c.env.DB.prepare(
      `SELECT COUNT(*) AS n FROM orders WHERE seller_id = ? AND status = 'disputed'`
    ).bind(w.user_id).first();
    w.sengketa_aktif = Number(risk?.n || 0);
    const hist: any = await c.env.DB.prepare(
      `SELECT COUNT(*) AS n, COALESCE(SUM(amount),0) AS total FROM withdrawals WHERE user_id = ? AND status = 'paid'`
    ).bind(w.user_id).first();
    w.riwayat_pencairan = { jumlah: Number(hist?.n || 0), total: Number(hist?.total || 0) };
  }

  const audit = await c.env.DB.prepare(
    `SELECT action, target_type, target_id, note, created_at FROM owner_actions ORDER BY created_at DESC LIMIT 25`
  ).all();
  const rep = await c.env.DB.prepare(
    `SELECT r.listing_id, r.reason, r.note, r.created_at, r.reporter_name,
            l.title, l.price, l.status AS listing_status, l.seller_id, s.pen_name AS seller_name,
            (SELECT COUNT(*) FROM listing_reports x WHERE x.listing_id = r.listing_id AND x.status = 'open') AS jumlah,
            (SELECT COUNT(*) FROM orders o WHERE o.seller_id = l.seller_id AND o.status = 'completed') AS trx_selesai,
            (SELECT COUNT(*) FROM orders o WHERE o.seller_id = l.seller_id AND o.status = 'disputed') AS sengketa
       FROM (SELECT lr.*, u.pen_name AS reporter_name FROM listing_reports lr JOIN users u ON u.id = lr.reporter_id
              WHERE lr.status = 'open') r
       JOIN listings l ON l.id = r.listing_id
       JOIN users s ON s.id = l.seller_id
      ORDER BY r.created_at DESC LIMIT 60`
  ).all();
  const laporan: any[] = [];
  const peta = new Map<string, any>();
  for (const r of (rep.results || []) as any[]) {
    let g = peta.get(r.listing_id);
    if (!g) {
      g = { ...r, items: [] };
      peta.set(r.listing_id, g);
      laporan.push(g);
    }
    g.items.push({ reason: r.reason, note: r.note, reporter: r.reporter_name, at: r.created_at });
  }

  const liab: any = await c.env.DB.prepare(
    `SELECT
       (SELECT COALESCE(SUM(delta),0) FROM ledger)
         - (SELECT COALESCE(SUM(amount + fee),0) FROM withdrawals WHERE status = 'requested') AS saldo,
       (SELECT COALESCE(SUM(COALESCE(qris_final_amount, price + shipping)),0) FROM orders
         WHERE status IN ('paid','handed','disputed')) AS escrow,
       (SELECT COALESCE(-SUM(delta),0) FROM ledger WHERE kind = 'fee') AS fee`
  ).first();
  return c.html(renderOwnerPage(disputes, withdrawals, calon.results || [], audit.results || [], {
    saldo: Number(liab?.saldo || 0), escrow: Number(liab?.escrow || 0), fee: Number(liab?.fee || 0),
  }, laporan));
});

// Riwayat akun (read-only) — owner memutuskan berdasarkan rekam jejak, bukan tebakan.
app.get('/owner/akun/:id', async (c: any) => {
  const me = await getAuthUser(c);
  if (!isOwner(c.env, me)) return c.notFound();
  const id = c.req.param('id');
  const u: any = await c.env.DB.prepare(
    `SELECT id, email, pen_name, display_name, city, seller_status, shop_name, shop_slug, seller_full_name, seller_phone,
            seller_bank_name, seller_bank_account, seller_reject_reason, seller_applied_at, created_at
       FROM users WHERE id = ?`
  ).bind(id).first();
  if (!u) return c.notFound();

  const [beli, jual, sen, list, ulas, led, saldo] = await Promise.all([
    c.env.DB.prepare(`SELECT o.id, o.status, o.price, o.shipping, o.created_at, l.title, s.pen_name AS lawan
      FROM orders o JOIN listings l ON l.id = o.listing_id JOIN users s ON s.id = o.seller_id
      WHERE o.buyer_id = ? ORDER BY o.created_at DESC LIMIT 15`).bind(id).all(),
    c.env.DB.prepare(`SELECT o.id, o.status, o.price, o.shipping, o.created_at, l.title, b.pen_name AS lawan
      FROM orders o JOIN listings l ON l.id = o.listing_id JOIN users b ON b.id = o.buyer_id
      WHERE o.seller_id = ? ORDER BY o.created_at DESC LIMIT 15`).bind(id).all(),
    c.env.DB.prepare(`SELECT o.id, o.status, o.updated_at, l.title
      FROM orders o JOIN listings l ON l.id = o.listing_id
      WHERE (o.buyer_id = ? OR o.seller_id = ?) AND o.status IN ('disputed','refunded')
      ORDER BY o.updated_at DESC LIMIT 10`).bind(id, id).all(),
    c.env.DB.prepare(`SELECT id, title, price, status, created_at FROM listings WHERE seller_id = ? ORDER BY created_at DESC LIMIT 15`).bind(id).all(),
    c.env.DB.prepare(`SELECT stars, body, created_at FROM reviews WHERE seller_id = ? ORDER BY created_at DESC LIMIT 10`).bind(id).all(),
    c.env.DB.prepare(`SELECT kind, delta, order_id, created_at FROM ledger WHERE user_id = ? ORDER BY id DESC LIMIT 15`).bind(id).all(),
    c.env.DB.prepare(`SELECT COALESCE(SUM(delta),0) AS n FROM ledger WHERE user_id = ?`).bind(id).first(),
  ]);
  const cair = await c.env.DB.prepare(
    `SELECT id, kode, amount, fee, status, requested_at, paid_at FROM withdrawals WHERE user_id = ? ORDER BY requested_at DESC LIMIT 10`
  ).bind(id).all();

  return c.html(renderAkunAdminPage(u, {
    pembeli: beli.results || [], penjual: jual.results || [], sengketa: sen.results || [],
    listings: list.results || [], ulasan: ulas.results || [], ledger: led.results || [],
    pencairan: cair.results || [],
    saldo: Number((saldo as any)?.n || 0),
  }));
});

app.post('/api/owner/orders/:id/resolve', async (c: any) => {
  const me = await getAuthUser(c);
  if (!isOwner(c.env, me)) return c.json({ error: 'Tidak ditemukan' }, 404);
  const body: any = await c.req.json().catch(() => ({}));
  const decision = body?.decision === 'refund' ? 'refund' : 'release';
  const note = String(body?.note || '').trim().slice(0, 300);
  if (note.length < 5) return c.json({ error: 'Tulis alasan keputusan (min 5 karakter) — tersimpan sebagai bukti' }, 400);
  const o: any = await c.env.DB.prepare("SELECT * FROM orders WHERE id = ? AND status = 'disputed'")
    .bind(c.req.param('id')).first();
  if (!o) return c.json({ error: 'Sengketa tidak ditemukan' }, 404);
  if (o.buyer_id === me!.id || o.seller_id === me!.id) {
    return c.json({ error: 'Sengketa yang melibatkan akun owner harus diputus orang lain.' }, 403);
  }

  if (decision === 'refund') {
    // Refund = saldo pembeli (bisa dipakai belanja lagi atau ditarik). Uang tidak keluar dari sistem.
    const nominal = Number(o.qris_final_amount || (Number(o.price) + Number(o.shipping || 0)));
    const ref = String(body?.transfer_ref || '').trim().slice(0, 80) || null;
    let r: any[];
    try {
      r = await c.env.DB.batch([
        c.env.DB.prepare(
          `UPDATE orders SET status = 'refunded', resolution_note = ?, refund_ref = ?, refund_amount = ?,
             refunded_at = datetime('now'), resolved_at = datetime('now'), updated_at = datetime('now')
           WHERE id = ? AND status = 'disputed'`
        ).bind(note, ref, nominal, o.id),
        // Kredit hanya kalau update di atas benar-benar terjadi (idempoten, tidak dobel).
        c.env.DB.prepare(
          "INSERT INTO ledger (user_id, order_id, delta, kind) SELECT ?,?,?,? FROM orders WHERE id = ? AND status = 'refunded'"
        ).bind(o.buyer_id, o.id, nominal, 'refund', o.id),
      ]);
    } catch (e: any) {
      // Audit B-09: idempoten tetapi kontraknya ramah — double-click race → 409 seperti branch release.
      if (String(e?.message || e).includes('UNIQUE')) return c.json({ error: 'Sengketa sudah diputuskan' }, 409);
      throw e;
    }
    if ((r[0].meta?.changes || 0) === 0) return c.json({ error: 'Sengketa sudah diputuskan' }, 409);
    await logOrderEvent(c.env.DB, o.id, 'owner', 'disputed', 'refunded', `${note || 'Dana dikembalikan'} · saldo pembeli +Rp${nominal.toLocaleString('id-ID')}`);
    await notifyOrder(c.env.DB, { userId: o.buyer_id, actorId: me!.id, type: 'order_refund', orderId: o.id });
    await logOwnerAction(c.env.DB, me?.email, 'dispute_refund', 'order', o.id, `${note} · saldo pembeli Rp${nominal}`);
    return c.json({ ok: true });
  }

  const money = settlementAmounts(o.price, o.shipping, PASAR_FEE);
  let r: any[];
  try {
    r = await c.env.DB.batch([
      c.env.DB.prepare("UPDATE orders SET status = 'completed', resolution_note = ?, resolved_at = datetime('now'), updated_at = datetime('now') WHERE id = ? AND status = 'disputed'").bind(note, o.id),
      c.env.DB.prepare("INSERT INTO ledger (user_id, order_id, delta, kind) SELECT ?,?,?,? FROM orders WHERE id = ? AND status = 'completed'").bind(o.seller_id, o.id, money.sale, 'sale', o.id),
      c.env.DB.prepare("INSERT INTO ledger (user_id, order_id, delta, kind) SELECT ?,?,?,? FROM orders WHERE id = ? AND status = 'completed'").bind(o.seller_id, o.id, money.fee, 'fee', o.id),
      c.env.DB.prepare("INSERT INTO order_events (order_id, actor, from_st, to_st, note) SELECT ?,?,?,?,? FROM orders WHERE id = ? AND status = 'completed'")
        .bind(o.id, 'owner', 'disputed', 'completed', note || 'Owner: dana dilepas ke penjual', o.id),
    ]);
  } catch (e: any) {
    if (String(e?.message || e).includes('UNIQUE')) return c.json({ error: 'Sengketa sudah diputuskan' }, 409);
    throw e;
  }
  if (!(r[0].meta?.changes || 0)) return c.json({ error: 'Sengketa sudah diputuskan' }, 409);
  await logOwnerAction(c.env.DB, me?.email, 'dispute_release', 'order', o.id, note);
  return c.json({ ok: true });
});

// Keputusan owner atas laporan listing: sembunyikan buku atau abaikan laporan.
app.post('/api/owner/reports/:id/resolve', async (c: any) => {
  const me = await getAuthUser(c);
  if (!isOwner(c.env, me)) return c.json({ error: 'Tidak ditemukan' }, 404);
  const body: any = await c.req.json().catch(() => ({}));
  const decision = body?.decision === 'hide' ? 'hide' : body?.decision === 'ignore' ? 'ignore' : null;
  const note = String(body?.note || '').trim().slice(0, 300);
  if (!decision) return c.json({ error: 'Keputusan tidak dikenal' }, 400);
  if (note.length < 5) return c.json({ error: 'Tulis catatan keputusan (min 5 karakter)' }, 400);

  const l: any = await c.env.DB.prepare('SELECT id, seller_id, title FROM listings WHERE id = ?').bind(c.req.param('id')).first();
  if (!l) return c.json({ error: 'Buku tidak ditemukan' }, 404);

  const status = decision === 'hide' ? 'removed' : 'ignored';
  await c.env.DB.batch([
    c.env.DB.prepare(
      "UPDATE listing_reports SET status = ?, reviewed_at = datetime('now'), review_note = ?, reviewer_email = ? WHERE listing_id = ? AND status = 'open'"
    ).bind(status, note, me?.email || null, l.id),
    ...(decision === 'hide'
      ? [c.env.DB.prepare("UPDATE listings SET status = 'hidden' WHERE id = ? AND status = 'active'").bind(l.id)]
      : []),
  ]);
  if (decision === 'hide') {
    await notifyOrder(c.env.DB, { userId: l.seller_id, actorId: me!.id, type: 'order_listing_removed', orderId: null });
  }
  await logOwnerAction(c.env.DB, me?.email, decision === 'hide' ? 'listing_remove' : 'listing_ignore', 'listing', l.id, note);
  return c.json({ ok: true });
});

app.post('/api/owner/sellers/:id/review', async (c: any) => {
  const me = await getAuthUser(c);
  if (!isOwner(c.env, me)) return c.json({ error: 'Tidak ditemukan' }, 404);
  const body: any = await c.req.json().catch(() => ({}));
  const approve = body?.decision === 'approve';
  const reason = String(body?.reason || '').trim().slice(0, 200);
  if (c.req.param('id') === me!.id) return c.json({ error: 'Tidak bisa mereview akun sendiri' }, 400);
  if (!approve && reason.length < 5) return c.json({ error: 'Tulis alasan penolakan (min 5 karakter)' }, 400);

  const res = await c.env.DB.prepare(
    `UPDATE users SET seller_status=?, seller_reviewed_at=datetime('now'), seller_reject_reason=?,
       seller_review_note = COALESCE(NULLIF(?, ''), seller_review_note)
     WHERE id=? AND seller_status='pending'`
  ).bind(approve ? 'approved' : 'rejected', approve ? null : reason, reason, c.req.param('id')).run();
  if ((res.meta?.changes || 0) === 0) return c.json({ error: 'Pengajuan tidak ditemukan' }, 404);
  if (approve) {
    // Buat slug toko publik sekali saja; link yang sudah dibagikan tidak boleh mati.
    const u: any = await c.env.DB.prepare('SELECT shop_name, shop_slug FROM users WHERE id = ?').bind(c.req.param('id')).first();
    if (u?.shop_name && !u.shop_slug) {
      const dipakai = await c.env.DB.prepare('SELECT shop_slug FROM users WHERE shop_slug IS NOT NULL').all();
      const slug = slugUnik(u.shop_name, (dipakai.results || []).map((x: any) => x.shop_slug));
      await c.env.DB.prepare('UPDATE users SET shop_slug = ? WHERE id = ? AND shop_slug IS NULL').bind(slug, c.req.param('id')).run();
    }
  }
  await notifyOrder(c.env.DB, {
    userId: c.req.param('id'), actorId: me!.id,
    type: approve ? 'order_seller_approved' : 'order_seller_rejected', orderId: null,
  });
  await logOwnerAction(c.env.DB, me?.email, approve ? 'seller_approve' : 'seller_reject', 'user', c.req.param('id'), reason || null);
  return c.json({ ok: true });
});

app.post('/api/owner/withdrawals/:id/settle', async (c: any) => {
  const me = await getAuthUser(c);
  if (!isOwner(c.env, me)) return c.json({ error: 'Tidak ditemukan' }, 404);
  const body: any = await c.req.json().catch(() => ({}));
  const decision = body?.decision === 'reject' ? 'reject' : 'pay';
  const note = String(body?.note || '').trim().slice(0, 300);
  const ref = String(body?.transfer_ref || '').trim().slice(0, 80);
  if (note.length < 5) return c.json({ error: 'Tulis catatan keputusan (min 5 karakter) — tersimpan sebagai bukti' }, 400);
  if (decision === 'pay' && ref.length < 4) return c.json({ error: 'Isi referensi/bukti transfer (min 4 karakter)' }, 400);
  const id = c.req.param('id');
  const w: any = await c.env.DB.prepare("SELECT * FROM withdrawals WHERE id = ? AND status = 'requested'").bind(id).first();
  if (!w) return c.json({ error: 'Permintaan tidak ditemukan' }, 404);

  const status = decision === 'reject' ? 'rejected' : 'paid';
  // Atomik (audit B-02): flip + ledger debit dalam SATU batch. order_id='wd:'+id supaya
  // partial unique index idx_ledger_order_kind menegakkan at-most-once (NULL lepas dari index).
  const rows: any[] = [
    c.env.DB.prepare(
      `UPDATE withdrawals SET status = ?, review_note = ?, transfer_ref = ?, reviewed_at = datetime('now'),
         paid_at = ${decision === 'reject' ? 'NULL' : "datetime('now')"} WHERE id = ? AND status = 'requested'`
    ).bind(status, note, ref || null, id),
  ];
  if (decision === 'pay') {
    rows.push(
      c.env.DB.prepare("INSERT INTO ledger (user_id, order_id, delta, kind) VALUES (?, ?, ?, 'withdraw')")
        .bind(w.user_id, 'wd:' + w.id, -Number(w.amount)),
    );
    if (Number(w.fee) > 0) {
      rows.push(c.env.DB.prepare("INSERT INTO ledger (user_id, order_id, delta, kind) VALUES (?, ?, ?, 'withdraw_fee')")
        .bind(w.user_id, 'wd:' + w.id, -Number(w.fee)));
    }
  }
  let res: any[];
  try {
    res = await c.env.DB.batch(rows);
  } catch (e: any) {
    if (String(e?.message || e).includes('UNIQUE')) return c.json({ error: 'Permintaan sudah diproses' }, 409);
    throw e;
  }
  if ((res[0].meta?.changes || 0) === 0) return c.json({ error: 'Permintaan sudah diproses' }, 409);
  await notifyOrder(c.env.DB, {
    userId: w.user_id, actorId: me!.id,
    type: decision === 'pay' ? 'order_withdraw_paid' : 'order_withdraw_reject', orderId: null,
  });
  await logOwnerAction(c.env.DB, me?.email, decision === 'pay' ? 'withdrawal_pay' : 'withdrawal_reject', 'withdrawal', id, note + (ref ? ' · ref ' + ref : ''));
  return c.json({ ok: true });
});

// Picu sweep manual (owner): cron bisa gagal diam-diam, ini jalan keluar daruratnya.
app.post('/api/owner/sweep', async (c: any) => {
  const me = await getAuthUser(c);
  if (!isOwner(c.env, me)) return c.json({ error: 'Tidak ditemukan' }, 404);
  const hasil = await sweepOrders(c.env.DB, c.env);
  await logOwnerAction(c.env.DB, me?.email, 'sweep', 'system', null, hasil);
  return c.json({ ok: true, hasil });
});

// Cron sweep per jam: expire order tak dibayar; handed D+5 tanpa gesekan → done;
// anti-resi-hantu: handed ekspedisi D+1, resi nggak ketemu di kurir → flag disputes.
// (duplikat nested sweepOrders/logOwnerAction dihapus — pakai definisi modul di bawah; audit D-09)


}

async function logOwnerAction(db: any, email: string | undefined | null, action: string, targetType: string | null, targetId: string | null, note: string | null) {
  await db.prepare(
    "INSERT INTO owner_actions (id, owner_email, action, target_type, target_id, note) VALUES (?,?,?,?,?,?)"
  ).bind(crypto.randomUUID(), email || '?', action, targetType, targetId, note).run();
}

export async function sweepOrders(db: any, env: any): Promise<string> {
  // Audit D-04: watermark + batch per fase + lock satu-run. Volume besar tidak lagi membekukan
  // proses di batas subrequest; sisanya terlihat via `remaining_*`.
  if (!(await sweepLock(db))) {
    return 'sweep sedang berjalan (lock aktif ≤10 menit)';
  }
  try {
    const summary: Record<string, number> = {};

    // ---------- Fase 1: expire orders >48jam (created) — LIMIT 100 + watermark ----------
    const c1 = await sweepCursor(db, 'expire');
    const expiring = await db.prepare(
      "SELECT id, listing_id, qris_order_id, created_at FROM orders WHERE status = 'created' AND created_at < datetime('now', '-48 hours') AND (created_at > ? OR (created_at = ? AND id > ?)) ORDER BY created_at, id LIMIT 100"
    ).bind(c1.at, c1.at, c1.id).all();
    let expired = 0, qrisChecks = 0;
    const QRI_CK_MAX = 20;
    let last1: any = null;      // baris terakhir yang benar-benar DIPUTUSKAN (audit R2-02)
    let capStop = false;        // provider cap habis di tengah halaman → berhenti, jangan lompati
    for (const o of (expiring.results || []) as any[]) {
      // Audit B-05/R2-01: order QRIS hanya boleh expired setelah provider menjawab
      // SUKSES dan menyatakan belum dibayar. Error provider/network = fail-closed.
      if (o.qris_order_id) {
        if (env.KLIKQRIS_API_KEY && qrisChecks >= QRI_CK_MAX) { capStop = true; break; }
        if (env.KLIKQRIS_API_KEY) {
          qrisChecks++;
          const utuh = await db.prepare('SELECT * FROM orders WHERE id = ?').bind(o.id).first();
          try {
            const rr = await reconcileQris(db, env, utuh);
            if (!rr.ok || rr.paid) {
              last1 = o;
              continue; // belum diketahui / sudah dibayar — TIDAK jadi expired.
            }
          } catch (e) {
            console.error('reconcile sebelum expire gagal', o.id, String(e));
            last1 = o;
            continue; // belum diketahui — coba lagi run berikutnya.
          }
        }
      }
      const moved = await db.prepare(
        "UPDATE orders SET status = 'expired', updated_at = datetime('now') WHERE id = ? AND status = 'created'"
      ).bind(o.id).run();
      if ((moved.meta?.changes || 0) > 0) {
        expired++;
        await db.prepare("UPDATE listings SET stock = MIN(stock + 1, 999) WHERE id = ? AND status != 'deleted'").bind(o.listing_id).run();
        await logOrderEvent(db, o.id, 'system', 'created', 'expired', 'Pesanan kedaluwarsa — stok dikembalikan');
      }
      last1 = o;
    }
    // R2-02: watermark = baris terakhir yang DIPUTUSKAN. capStop berhenti di tengah
    // halaman → cursor tetap maju ke last1 sehingga run berikut memeriksa sisanya;
    // halaman penuh tanpa cap → set; halaman belum penuh → reset (wrap, antrean habis).
    if (last1 && ((expiring.results || []).length === 100 || capStop)) {
      await setSweepCursor(db, 'expire', { at: last1.created_at, id: last1.id });
    } else {
      await resetSweepCursor(db, 'expire');
    }
    summary.expired = expired;
    summary.qris_checks = qrisChecks;

    // ---------- Fase 2: ghost-resi (handed ekspedisi >24j) — LIMIT 40 + watermark ----------
    let ghosts = 0, ghostChecks = 0;
    const GHOST_MAX = 40;
    if (env.BINDERBYTE_KEY) {
      const susp = await db.prepare(
        "SELECT id, kurir, resi FROM orders WHERE status = 'handed' AND kurir IS NOT NULL AND resi IS NOT NULL AND handed_at < datetime('now', '-1 day') LIMIT 40"
      ).all();
      for (const o of (susp.results || []) as any[]) {
        if (ghostChecks >= GHOST_MAX) break;
        ghostChecks++;
        const r = await cekResi(env, KURIR_MAP[o.kurir] || 'jne', o.resi);
        if (r.kind === 'found') {
          await db.prepare("UPDATE orders SET resi_verified = 1, resi_checked_at = datetime('now') WHERE id = ? AND resi_verified = 0").bind(o.id).run();
          continue;
        }
        // Gangguan API BinderByte: JANGAN vonis penjual. Coba lagi jam berikutnya.
        if (r.kind === 'error') continue;
        const g = await db.prepare(
          "UPDATE orders SET status = 'disputed', updated_at = datetime('now') WHERE id = ? AND status = 'handed'"
        ).bind(o.id).run();
        if ((g.meta?.changes || 0) > 0) {
          ghosts++;
          await logOrderEvent(db, o.id, 'system', 'handed', 'disputed', `Resi ${o.resi} tidak terdaftar di ${o.kurir} (cek otomatis 24 jam)`);
        }
      }
    }
    summary.disputed_ghosts = ghosts;
    summary.ghost_checks = ghostChecks;

    // ---------- Fase 3: auto-selesai D+5 — LIMIT 100 + watermark ----------
    const c3 = await sweepCursor(db, 'auto');
    const stale = await db.prepare(
      // Auto-selesai hanya kalau resi sudah terverifikasi kurir (atau tanpa resi/COD).
      "SELECT id, seller_id, price, shipping, handed_at FROM orders WHERE status = 'handed' AND handed_at IS NOT NULL AND handed_at < datetime('now', '-5 days') AND (resi IS NULL OR resi_verified = 1) AND (handed_at > ? OR (handed_at = ? AND id > ?)) ORDER BY handed_at, id LIMIT 100"
    ).bind(c3.at, c3.at, c3.id).all();
    let completed = 0;
    for (const o of (stale.results || []) as any[]) {
      const money = settlementAmounts(o.price, o.shipping, PASAR_FEE);
      try {
        const settled = await db.batch([
          db.prepare("UPDATE orders SET status = 'completed', updated_at = datetime('now') WHERE id = ? AND status = 'handed'").bind(o.id),
          db.prepare("INSERT INTO ledger (user_id, order_id, delta, kind) SELECT ?,?,?,? FROM orders WHERE id = ? AND status = 'completed'").bind(o.seller_id, o.id, money.sale, 'sale', o.id),
          db.prepare("INSERT INTO ledger (user_id, order_id, delta, kind) SELECT ?,?,?,? FROM orders WHERE id = ? AND status = 'completed'").bind(o.seller_id, o.id, money.fee, 'fee', o.id),
          db.prepare("INSERT INTO order_events (order_id, actor, from_st, to_st, note) SELECT ?,?,?,?,? FROM orders WHERE id = ? AND status = 'completed'").bind(o.id, 'system', 'handed', 'completed', 'Auto-selesai D+5', o.id),
        ]);
        if ((settled[0].meta?.changes || 0) > 0) completed++;
      } catch (e: any) {
        if (!String(e?.message || e).includes('UNIQUE')) throw e;
      }
    }
    const last3 = (stale.results || []).slice(-1)[0];
    if (last3 && (stale.results || []).length === 100) {
      await setSweepCursor(db, 'auto', { at: last3.handed_at, id: last3.id });
    } else {
      await resetSweepCursor(db, 'auto');
    }
    summary.completed = completed;

    // ---------- Fase 4: retensi dokumen penjual (90 hari) — LIMIT 50 ----------
    let docsHapus = 0;
    const dokLama = await db.prepare(
      `SELECT d.user_id, d.kind, d.r2_key FROM seller_docs d JOIN users u ON u.id = d.user_id
        WHERE u.seller_reviewed_at IS NOT NULL AND u.seller_reviewed_at < datetime('now','-90 days') LIMIT 50`
    ).all();
    for (const d of (dokLama.results || []) as any[]) {
      if (env.MEDIA) await env.MEDIA.delete(d.r2_key).catch(() => {});
      await db.prepare('DELETE FROM seller_docs WHERE user_id = ? AND kind = ?').bind(d.user_id, d.kind).run();
      docsHapus++;
    }
    summary.docs = docsHapus;

    // ---------- remaining counters (D-04: sisa antrean harus terlihat) ----------
    const rem1 = await db.prepare("SELECT COUNT(*) AS n FROM orders WHERE status = 'created' AND created_at < datetime('now', '-48 hours')").first('n');
    const rem2 = await db.prepare("SELECT COUNT(*) AS n FROM orders WHERE status = 'handed' AND kurir IS NOT NULL AND resi IS NOT NULL AND handed_at < datetime('now', '-1 day')").first('n');
    const rem3 = await db.prepare("SELECT COUNT(*) AS n FROM orders WHERE status = 'handed' AND handed_at IS NOT NULL AND handed_at < datetime('now', '-5 days') AND (resi IS NULL OR resi_verified = 1)").first('n');
    summary.remaining_expire = Number(rem1 || 0);
    summary.remaining_ghosts = Number(rem2 || 0);
    summary.remaining_auto = Number(rem3 || 0);

    return JSON.stringify(summary);
  } finally {
    await sweepUnlock(db);
  }
}
