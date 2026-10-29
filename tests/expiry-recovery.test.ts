// Cek runnable: npm test
// Regression run-2 R2-03/R2-04: expiry atomik + recovery pembayaran terlambat.
import { register } from 'node:module';
register(new URL('./ts-ext-hook.mjs', import.meta.url));
const { sweepExpireBatch, latePaymentToDispute, ownerReconcilePayment } = await import('../src/routes/pasar.ts');

const assert = (cond: unknown, msg: string) => { if (!cond) throw new Error('GAGAL: ' + msg); };

type O = any;
class DB {
  orders: O[]; stock: Map<string, number>; events: any[] = []; batches = 0; failOn?: string;
  constructor(o: O[]) { this.orders = o; this.stock = new Map(o.map(x => [x.listing_id, 0])); }
  prepare(sql: string) { return new Stmt(this, sql); }
  async batch(stmts: any[]) {
    this.batches++;
    // Simulasi transaksi D1: snapshot; salah satu stmt gagal → rollback semua.
    const snapO = JSON.parse(JSON.stringify(this.orders));
    const snapS = new Map(this.stock);
    try {
      const out: any[] = [];
      for (const s of stmts) {
        if (this.failOn && s.sql.includes(this.failOn)) throw new Error('D1_ERROR: injected');
        out.push(await s.run());
      }
      return out;
    } catch (e) { this.orders = snapO; this.stock = snapS; throw e; }
  }
}
class Stmt {
  sql: string; args: any[]; db: DB;
  constructor(db: DB, sql: string) { this.db = db; this.sql = sql.replace(/\s+/g, ' ').trim(); this.args = []; }
  bind(...a: any[]) { this.args = a; return this; }
  async first(col?: string) {
    const s = this.sql, d = this.db;
    if (s.startsWith('SELECT * FROM orders WHERE id')) return d.orders.find(o => o.id === this.args[0]) || null;
    if (s.includes('COALESCE(SUM(delta)')) return col ? 0 : { n: 0 };
    return col ? 0 : null;
  }
  async all() { return { results: [] }; }
  async run() {
    const s = this.sql, d = this.db;
    if (s.startsWith("UPDATE orders SET status = '")) {
      const target = /SET status = '(\w+)'/.exec(s)![1];
      const guard = /AND status = '(\w+)'/.exec(s)?.[1] || null;
      const o = d.orders.find(x => x.id === this.args[0]); if (!o) return { meta: { changes: 0 } };
      if (o.status !== (guard || target)) return { meta: { changes: 0 } };
      o.status = target; return { meta: { changes: 1 } };
    }
    if (s.startsWith('UPDATE listings SET stock')) { d.stock.set(String(this.args[0]), (d.stock.get(String(this.args[0])) || 0) + 1); return { meta: { changes: 1 } }; }
    if (s.startsWith('INSERT INTO order_events')) { d.events.push({ id: this.args[0], to: this.args[3] }); return { meta: { changes: 1 } }; }
    if (s.startsWith('INSERT INTO notifications')) return { meta: { changes: 1 } };
    return { meta: { changes: 0 } };
  }
}
const mk = (status: string): O => ({ id: 'oX', listing_id: 'l1', status, buyer_id: 'b', seller_id: 's', qris_order_id: 'q1', qris_signature: 'sig', qris_final_amount: 5000, price: 5000, shipping: 0, paid_with: 'qris' });
const env = { KLIKQRIS_API_KEY: 'k', KLIKQRIS_MERCHANT_ID: 'm', OWNER_EMAIL: 'o@x' };

// 1. Expiry atomik: satu batch memuat flip+restore+event; semua berubah bersama.
{ globalThis.fetch = (async () => Response.json({ order_id: 'q1', status: 'PENDING', amount: 1000 })) as any;
  const d = new DB([mk('created')]);
  const res = await sweepExpireBatch(d, d.orders[0]);
  assert(res.changes === 1, 'expiry sukses');
  assert(d.batches === 1, 'harus satu batch atomik');
  assert(d.orders[0].status === 'expired' && d.stock.get('l1') === 1 && d.events.length === 1, 'flip+stok+event konsisten'); }

// 2. Failure injection di tengah batch → rollback total (stok & status).
{ globalThis.fetch = (async () => Response.json({ order_id: 'q1', status: 'PENDING', amount: 1000 })) as any;
  const d = new DB([mk('created')]); d.failOn = 'UPDATE listings';
  let threw = false; try { await sweepExpireBatch(d, d.orders[0]); } catch { threw = true; }
  assert(threw, 'kegagalan dilempar agar cron mencatat');
  assert(d.orders[0].status === 'created' && d.stock.get('l1') === 0 && d.events.length === 0, 'rollback utuh: tidak ada partial write'); }

// 3. Late payment pada order expired: webhook helper → disputed (bukan auto-paid), stok tidak diubah lagi.
{ globalThis.fetch = (async () => Response.json({ order_id: 'q1', status: 'PAID', amount: 5000 })) as any;
  const d = new DB([mk('expired')]); d.stock.set('l1', 1);
  const r = await latePaymentToDispute(d, d.orders[0]);
  assert(r.ok && d.orders[0].status === 'disputed', 'late payment → disputed');
  assert(d.stock.get('l1') === 1, 'stok tidak diubah lagi saat late payment');
  assert(d.events.some(e => e.to === 'disputed'), 'event late payment tercatat'); }

// 4. Owner reconcile: provider error → fail-closed; provider paid pada created → paid.
{ globalThis.fetch = (async () => new Response('{}', { status: 503 })) as any;
  const d = new DB([mk('created')]);
  const r1 = await ownerReconcilePayment(d, env, 'oX');
  assert(!r1.ok && d.orders[0].status === 'created', 'provider error → fail-closed'); }
{ globalThis.fetch = (async (u: any) => { const q = decodeURIComponent(String(u).split('/').at(-1)); return Response.json({ order_id: q, status: 'PAID', amount: 5000 }); }) as any;
  const d = new DB([mk('created')]);
  const r2 = await ownerReconcilePayment(d, env, 'oX');
  assert(r2.ok && d.orders[0].status === 'paid', 'owner reconcile created+paid → paid'); }
{ globalThis.fetch = (async (u: any) => { const q = decodeURIComponent(String(u).split('/').at(-1)); return Response.json({ order_id: q, status: 'PAID', amount: 5000 }); }) as any;
  const d = new DB([mk('expired')]);
  const r3 = await ownerReconcilePayment(d, env, 'oX');
  assert(r3.ok && d.orders[0].status === 'disputed', 'owner reconcile expired+paid → disputed'); }

globalThis.fetch = (globalThis as any).__origFetch ?? globalThis.fetch;
console.log('OK — expiry atomik & late-payment recovery: semua cek lolos');
