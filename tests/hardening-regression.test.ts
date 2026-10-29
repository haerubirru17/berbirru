// Cek runnable: npm test
// Hardening run-2 (R2-11/R2-12-wiring/R2-13-wiring/R2-15-wiring).
import { register } from 'node:module';
register(new URL('./ts-ext-hook.mjs', import.meta.url));
import { readFileSync } from 'node:fs';
const assert = (cond: unknown, msg: string) => { if (!cond) throw new Error('GAGAL: ' + msg); };

// ---------- 1. Track route rate-limit fungsional (mock D1 + KURIR_MOCK) ----------
const { Hono } = await import('hono');
const { mountPasar } = await import('../src/routes/pasar.ts');
const app = new Hono();
const rateCounts = new Map<string, number>();
const USER = 'u1';
const d1 = {
  prepare(sql: string) {
    return {
      sql, args: [] as any[],
      bind(...a: any[]) { this.args = a; return this; },
      async first(col?: string) {
        const s = this.sql;
        if (s.includes('FROM sessions s JOIN users u')) {
          return { id: USER, email: 'u@x', pen_name: 'u', avatar_key: null, cover_key: null, display_name: null, bio: '', seller_status: 'none' };
        }
        if (s.startsWith('SELECT * FROM orders WHERE id')) return { id: this.args[0], buyer_id: USER, seller_id: 's2', kurir: 'JNE', resi: 'JP123', resi_verified: 1, status: 'handed' };
        if (s.includes('INSERT INTO rate_limits')) {
          const key = String(this.args[0]);
          rateCounts.set(key, (rateCounts.get(key) || 0) + 1);
          return col ? rateCounts.get(key) : { count: rateCounts.get(key) };
        }
        if (s.startsWith('DELETE FROM rate_limits')) { rateCounts.clear(); return { meta: { changes: 1 } }; }
        if (s.startsWith("UPDATE orders SET resi_verified")) return { meta: { changes: 0 } };
        return col ? 0 : null;
      },
      async all() { return { results: [] }; },
      async batch(stmts: any[]) { const o: any[] = []; for (const s of stmts) o.push(await s.run()); return o; },
      async run() { return this.first(); },
    } as any;
  },
};
mountPasar(app as any);
const envMock = { DB: d1, KURIR_MOCK: '1', BINDERBYTE_KEY: '', OWNER_EMAIL: 'o@x', APP_DOMAIN: 't.test' } as any;
let last = 0;
for (let i = 1; i <= 22; i++) {
  const res = await app.request('/pasar/order/o1/track', { method: 'POST', headers: { Cookie: 'berbirru_session=tok' } }, envMock);
  last = res.status;
  if (i <= 20) assert(res.status === 200, 'call ' + i + ' harus 200, dapat ' + res.status);
}
assert(last === 429, 'call ke-21 harus 429, dapat ' + last);

// ---------- 2. Wiring assertions (pola auth-wiring repo) ----------
const indexSrc = readFileSync(new URL('../src/index.ts', import.meta.url), 'utf8');
assert(indexSrc.includes('hardenPost(root)'), 'chain route harus memakai hardenPost(root) (R2-12 wiring)');
assert(indexSrc.includes('.map(hardenPost)'), 'children chain harus di-hardening');

const authSrc = readFileSync(new URL('../src/routes/auth.ts', import.meta.url), 'utf8');
assert(authSrc.includes("startsWith('pbkdf2$')") && authSrc.includes('DUMMY_PBKDF2_HASH'), 'login jalur non-pbkdf2 harus melewati dummy PBKDF2 (R2-15 wiring)');
assert(authSrc.includes('WHERE email = ? LIMIT 1') && /catch \(e: any\)[\s\S]*?userId = race\.id/.test(authSrc), 'register race harus dinormalkan (R2-13 wiring)');

const pasarSrc = readFileSync(new URL('../src/routes/pasar.ts', import.meta.url), 'utf8');
assert(pasarSrc.includes("track:${me.id}`"), 'track rate-limit key harus ada');
assert(/catch\(\(\)=>null\)/.test(pasarSrc.replace(/\s+/g, '')), 'saldo batch harus punya catch');
const coreSrc = readFileSync(new URL('../src/lib/pasar-core.ts', import.meta.url), 'utf8');
assert(coreSrc.includes("DELETE FROM sweep_meta WHERE key = 'lock' AND value = ?"), 'sweepUnlock wajib token-ownership (R2-08)');

const { execSync } = await import('node:child_process');
const gittracked = execSync('git ls-files node_modules', { cwd: new URL('..', import.meta.url).pathname }).toString().trim();
assert(gittracked === '', 'node_modules tidak boleh tracked (R2-09)');

console.log('OK — hardening regression: semua cek lolos');
