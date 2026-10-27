// KlikQRIS adapter — server-side only. Supports sandbox and production contracts.
export interface KlikQrisEnv {
  KLIKQRIS_API_KEY?: string;
  KLIKQRIS_MERCHANT_ID?: string;
  KLIKQRIS_API_URL?: string;
  KLIKQRIS_CALLBACK_URL?: string;
  KLIKQRIS_MOCK?: string;
}

export interface QrisResult {
  ok: boolean;
  qrisUrl?: string;
  signature?: string;
  finalAmount?: number;
  expiredAt?: string;
  orderId?: string;
  error?: string;
}

export interface QrisStatusResult {
  ok: boolean;
  status?: string;
  paid?: boolean;
  finalAmount?: number;
  signature?: string;
  error?: string;
}

const createUrl = (env: KlikQrisEnv) => (env.KLIKQRIS_API_URL || 'https://klikqris.com/api/qris/create').replace(/\/$/, '');
const statusUrl = (env: KlikQrisEnv, orderId: string) => createUrl(env).replace(/\/create$/, '/status/') + encodeURIComponent(orderId);
const payload = (raw: any) => raw?.data && typeof raw.data === 'object' ? raw.data : raw;
function qrImage(data: any): string | undefined {
  const value = data?.qris_image ?? data?.qris_url ?? data?.qrisUrl;
  if (typeof value !== 'string' || !value) return undefined;
  if (value.startsWith('data:image')) return value;
  if (value.startsWith('iVBOR')) return `data:image/png;base64,${value}`;
  return /^https:\/\//i.test(value) ? value : undefined;
}
function amount(data: any): number | undefined {
  const n = Number(data?.total_amount ?? data?.amount);
  return Number.isSafeInteger(n) && n >= 1000 ? n : undefined;
}

export async function createQrisTransaction(env: KlikQrisEnv, opts: { orderId: string; amount: number; description: string }): Promise<QrisResult> {
  if (env.KLIKQRIS_MOCK === '1') return { ok: true, orderId: opts.orderId, finalAmount: opts.amount, qrisUrl: `data:image/svg+xml;base64,${btoa(`<svg xmlns="http://www.w3.org/2000/svg" width="300" height="300"><rect width="300" height="300" fill="#fff"/><text x="20" y="150" font-size="16">MOCK QRIS ${opts.orderId}</text></svg>`)}`, signature: `mock-sig-${opts.orderId}`, expiredAt: new Date(Date.now() + 60 * 60_000).toISOString() };
  if (!env.KLIKQRIS_API_KEY || !env.KLIKQRIS_MERCHANT_ID) return { ok: false, error: 'Kredensial KlikQRIS belum diset' };
  if (!Number.isSafeInteger(opts.amount) || opts.amount < 1000) return { ok: false, error: 'Nominal minimum QRIS Rp1.000' };
  if (!env.KLIKQRIS_CALLBACK_URL) return { ok: false, error: 'Callback KlikQRIS belum diset' };
  try {
    const res = await fetch(createUrl(env), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-api-key': env.KLIKQRIS_API_KEY, 'id_merchant': env.KLIKQRIS_MERCHANT_ID, 'User-Agent': 'Mozilla/5.0 (Berbirru; rekber)' },
      body: JSON.stringify({ order_id: opts.orderId, amount: opts.amount, id_merchant: env.KLIKQRIS_MERCHANT_ID, keterangan: opts.description.slice(0, 120), callback_url: env.KLIKQRIS_CALLBACK_URL }),
    });
    const raw: any = await res.json().catch(() => null);
    if (!res.ok) return { ok: false, error: `KlikQRIS HTTP ${res.status}` };
    const data = payload(raw), returnedId = String(data?.order_id || ''), qrisUrl = qrImage(data), finalAmount = amount(data);
    if (!returnedId || returnedId !== opts.orderId) return { ok: false, error: 'Order ID KlikQRIS tidak cocok' };
    if (!qrisUrl || !finalAmount) return { ok: false, error: 'Respons KlikQRIS tidak lengkap' };
    const minutes = Math.max(1, Number(data?.expired_menit) || 60);
    return { ok: true, orderId: returnedId, qrisUrl, finalAmount, signature: typeof data?.signature === 'string' ? data.signature : undefined, expiredAt: new Date(Date.now() + minutes * 60_000).toISOString() };
  } catch (e: any) { return { ok: false, error: e?.message || 'Gagal menghubungi KlikQRIS' }; }
}

export async function getQrisStatus(env: KlikQrisEnv, orderId: string): Promise<QrisStatusResult> {
  if (!env.KLIKQRIS_API_KEY || !env.KLIKQRIS_MERCHANT_ID) return { ok: false, error: 'Kredensial KlikQRIS belum diset' };
  try {
    const res = await fetch(statusUrl(env, orderId), { headers: { 'x-api-key': env.KLIKQRIS_API_KEY, 'id_merchant': env.KLIKQRIS_MERCHANT_ID, 'User-Agent': 'Mozilla/5.0 (Berbirru; rekber)' } });
    const raw: any = await res.json().catch(() => null);
    if (!res.ok) return { ok: false, error: `KlikQRIS status HTTP ${res.status}` };
    const data = payload(raw);
    if (String(data?.order_id || '') !== orderId) return { ok: false, error: 'Order ID status tidak cocok' };
    const status = String(data?.status ?? '').toUpperCase();
    // log operasional: status mentah provider (tanpa kredensial) utk menelusuri pembayaran macet
    console.log('[qris-status]', orderId, 'status=' + status, 'amount=' + (amount(data) ?? '-'));
    return { ok: true, status, paid: status === 'PAID' || status === 'SUCCESS' || status === 'SETTLEMENT' || data?.status === true, finalAmount: amount(data), signature: typeof data?.signature === 'string' ? data.signature : undefined };
  } catch (e: any) { return { ok: false, error: e?.message || 'Gagal mengecek status KlikQRIS' }; }
}

export function verifyWebhook(incoming: { order_id?: string; signature?: string; amount?: number; total_amount?: number }, stored: { qris_order_id: string; qris_signature: string | null; final_amount: number }): { ok: boolean; error?: string } {
  if (!incoming.order_id || incoming.order_id !== stored.qris_order_id) return { ok: false, error: 'order_id tidak cocok' };
  if (!incoming.signature || !stored.qris_signature || incoming.signature !== stored.qris_signature) return { ok: false, error: 'signature tidak cocok' };
  const n = Number(incoming.total_amount ?? incoming.amount);
  if (!Number.isSafeInteger(n) || n !== stored.final_amount) return { ok: false, error: 'nominal tidak cocok atau hilang' };
  return { ok: true };
}

export function _selftest(): boolean {
  const stored = { qris_order_id: 'O1', qris_signature: 'sig', final_amount: 50000 };
  return verifyWebhook({ order_id: 'O1', signature: 'sig', total_amount: 50000 }, stored).ok && !verifyWebhook({ order_id: 'O1', signature: 'x', total_amount: 50000 }, stored).ok && !verifyWebhook({ order_id: 'O1', signature: 'sig', total_amount: 999 }, stored).ok;
}
