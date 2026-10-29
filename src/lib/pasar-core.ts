// Core pasar: konstan lifecycle, notifikasi order, event log, saldo penjual, peta kurir.
// Dipindah verbatim dari index.ts.

export const ORDER_EXPIRE_MIN = 48 * 60;      // created tanpa bayar 48 jam → expired (cron)
export const AUTO_COMPLETE_DAYS = 5;          // handed + diam D+5 → auto completed (cron)

// Notifikasi order: satu helper, dipanggil dari semua transisi status.
export async function notifyOrder(db: any, opts: { userId: string; actorId: string; type: string; orderId: string | null }) {
  if (!opts.userId || !opts.actorId || opts.userId === opts.actorId) return; // jangan notif diri sendiri
  try {
    await db.prepare('INSERT INTO notifications (id, user_id, actor_id, type, order_id) VALUES (?,?,?,?,?)')
      .bind(crypto.randomUUID(), opts.userId, opts.actorId, opts.type, opts.orderId).run();
  } catch (e) {
    console.error('notifyOrder gagal', opts.type, String(e)); // notifikasi tidak boleh menggagalkan transaksi
  }
}

export async function logOrderEvent(db: any, orderId: string, actor: string, fromSt: string | null, toSt: string, note?: string) {
  await db.prepare('INSERT INTO order_events (order_id, actor, from_st, to_st, note) VALUES (?,?,?,?,?)')
    .bind(orderId, actor, fromSt, toSt, note || null).run();
}

export async function sellerBalance(db: any, userId: string): Promise<number> {
  const row: any = await db.prepare(
    `SELECT (SELECT COALESCE(SUM(delta),0) FROM ledger WHERE user_id = ?1)
          - (SELECT COALESCE(SUM(amount + fee),0) FROM withdrawals WHERE user_id = ?2 AND status = 'requested') AS bal`
  ).bind(userId, userId).first();
  return Number(row?.bal || 0);
}

export const KURIR_MAP: Record<string, string> = { 'JNE': 'jne', 'J&T': 'jnt', 'SiCepat': 'sicepat', 'POS': 'pos', 'TIKI': 'tiki', 'AnterAja': 'anteraja' };
