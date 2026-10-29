// Cek runnable: npm test
// Regression audit run-2 R2-01/R2-02: sweep expire wajib fail-closed terhadap provider.
import { register } from 'node:module';
register(new URL('./ts-ext-hook.mjs', import.meta.url));
const { sweepOrders } = await import('../src/routes/owner.ts');

const assert = (cond: unknown, msg: string) => { if (!cond) throw new Error('GAGAL: ' + msg); };

type O = { id: string; listing_id: string; qris_order_id: string | null; qris_final_amount: number; price: number; shipping: number; status: string; created_at: string; seller_id: string; buyer_id: string; qris_signature: string | null };
function orders(n: number, withQris = true): O[] {
  return Array.from({ length: n }, (_, i) => ({
    id: 'o' + String(i + 1).padStart(3, '0'), listing_id: 'l' + String(i + 1).padStart(3, '0'),
    qris_order_id: withQris ? 'q' + String(i + 1) : null, qris_final_amount: 1000, price: 1000, shipping: 0,
    status: 'created', created_at: '2026-01-01 00:00:00', seller_id: 's', buyer_id: 'b', qris_signature: null,
  }));
}

class DB {
  orders: O[]; stock: Map<string, number> = new Map(); meta = new Map<string, string>(); events: any[] = [];
  constructor(o: O[]) { this.orders = o; for (const x of o) this.stock.set(x.listing_id, 0); }
  prepare(sql: string) { return new Stmt(this, sql); }
  async batch(stmts: any[]) { const out: any[] = []; for (const s of stmts) out.push(await s.run()); return out; }
}
class Stmt {
  sql: string; args: any[]; db: DB;
  constructor(db: DB, sql: string) { this.db = db; this.sql = sql.replace(/\s+/g, ' ').trim(); this.args = []; }
  bind(...a: any[]) { this.args = a; return this; }
  async first(col?: string) {
    const s = this.sql, d = this.db;
    if (s.includes('INSERT INTO sweep_meta') && s.includes('RETURNING key')) { if (d.meta.has('lock')) return null; d.meta.set('lock', 'x'); return col ? 'lock' : { key: 'lock' }; }
    if (s.startsWith('SELECT value FROM sweep_meta')) { const v = d.meta.get(String(this.args[0])); const r = v == null ? null : { value: v }; return col ? (r as any)?.[col] : r; }
    if (s.startsWith('SELECT * FROM orders WHERE id')) return d.orders.find(o => o.id === this.args[0]) || null;
    if (s.startsWith('SELECT COUNT(*) AS n FROM orders')) { const n = d.orders.filter(o => o.status === 'created').length; return col ? n : { n }; }
    return col ? 0 : null;
  }
  async all() {
    const s = this.sql, d = this.db;
    if (s.includes("FROM orders WHERE status = 'created'") && s.includes('LIMIT 100')) {
      const [at, , id] = this.args;
      const rows = d.orders.filter(o => o.status === 'created' && (o.created_at > at || (o.created_at === at && o.id > id)))
        .sort((a, b) => a.created_at.localeCompare(b.created_at) || a.id.localeCompare(b.id)).slice(0, 100);
      return { results: rows };
    }
    if (s.includes("FROM orders WHERE status = 'handed'")) return { results: [] };
    if (s.includes('FROM seller_docs')) return { results: [] };
    return { results: [] };
  }
  async run() {
    const s = this.sql, d = this.db;
    if (s.startsWith('INSERT INTO sweep_meta') && s.includes('ON CONFLICT(key)')) { d.meta.set(String(this.args[0]), String(this.args[1])); return { meta: { changes: 1 } }; }
    if (s.startsWith("DELETE FROM sweep_meta WHERE key = 'lock'")) { d.meta.delete('lock'); return { meta: { changes: 1 } }; }
    if (s.startsWith("UPDATE orders SET status = 'paid'")) { const o = d.orders.find(x => x.id === this.args[0] && x.status === 'created'); if (o) o.status = 'paid'; return { meta: { changes: o ? 1 : 0 } }; }
    if (s.startsWith("UPDATE orders SET status = 'expired'")) { const o = d.orders.find(x => x.id === this.args[0] && x.status === 'created'); if (o) o.status = 'expired'; return { meta: { changes: o ? 1 : 0 } }; }
    if (s.startsWith('UPDATE listings SET stock')) { d.stock.set(String(this.args[0]), (d.stock.get(String(this.args[0])) || 0) + 1); return { meta: { changes: 1 } }; }
    if (s.startsWith('INSERT INTO order_events')) { d.events.push(this.args); return { meta: { changes: 1 } }; }
    if (s.startsWith('INSERT INTO notifications')) return { meta: { changes: 1 } };
    if (s.startsWith('DELETE FROM seller_docs')) return { meta: { changes: 0 } };
    return { meta: { changes: 0 } };
  }
}
const env = { KLIKQRIS_API_KEY: 'k', KLIKQRIS_MERCHANT_ID: 'm' };
const realFetch = globalThis.fetch;

// 1. Provider error result ({ok:false}) TIDAK boleh expire order QRIS.
let providerMode: 'error' | 'pending' = 'error';
globalThis.fetch = (async () => { if (providerMode === 'error') return new Response('{}', { status: 503 }); return Response.json({ order_id: 'x', status: 'PENDING', amount: 1000 }); }) as any;
let calls = 0;
{ const d = new DB(orders(1)); const s = JSON.parse(await sweepOrders(d, env));
  assert(d.orders[0].status === 'created', 'provider-error order harus tetap created (R2-01)');
  assert(d.stock.get('l001') === 0, 'stok tidak boleh kembali saat provider error'); }

// 2. 25 order QRIS: tepat 20 checks; order 21+ tetap created; provider error semua.
providerMode = 'error';
{ const d = new DB(orders(25)); await sweepOrders(d, env);
  const expired = d.orders.filter(o => o.status === 'expired').length;
  assert(expired === 0, 'provider gagal: tidak ada order QRIS yang boleh expired, dapat ' + expired); }

// 3. Provider pending (ok, paid=false) → 20 pertama expired, 5 sisanya tetap created.
providerMode = 'pending';
{ let n = 0; globalThis.fetch = (async (url: any) => { n++; const q = decodeURIComponent(String(url).split('/').at(-1)); return Response.json({ order_id: q, status: 'PENDING', amount: 1000 }); }) as any;
  const d = new DB(orders(25)); await sweepOrders(d, env);
  assert(n === 20, 'cap 20 provider calls, dapat ' + n);
  const expired = d.orders.filter(o => o.status === 'expired').length;
  const created = d.orders.filter(o => o.status === 'created').length;
  assert(expired === 20 && created === 5, 'cap: expired=20, created=5; dapat ' + expired + '/' + created); }

// 4. Provider paid → menjadi paid, bukan expired.
{ globalThis.fetch = (async (url: any) => { const q = decodeURIComponent(String(url).split('/').at(-1)); return Response.json({ order_id: q, status: 'PAID', amount: 1000 }); }) as any;
  const d = new DB(orders(1)); await sweepOrders(d, env);
  assert(d.orders[0].status === 'paid', 'provider paid harus flip ke paid'); }

// 5. Order tanpa qris_order_id → expired tanpa provider call.
{ let n = 0; globalThis.fetch = (async () => { n++; throw new Error('should not fetch'); }) as any;
  const d = new DB(orders(3, false)); await sweepOrders(d, env);
  assert(n === 0 && d.orders.every(o => o.status === 'expired'), 'non-QRIS expired tanpa provider call'); }

globalThis.fetch = realFetch;
console.log('OK — sweep QRIS fail-closed: semua cek lolos');
