// Adapter KlikQRIS (klikqris.com) — fetch-based untuk Cloudflare Workers.
// Ref kontrak API: adapter komunitas gammarinaldi/klikqris-adapter (axios) +
// skill payment-gateway-integration. Dana settle ke rekening merchant owner;
// payout manual oleh owner (lihat plan .hermes/plans/2026-10-18-pasar-buku.md).

export interface KlikQrisEnv {
  KLIKQRIS_API_KEY?: string;
  KLIKQRIS_MERCHANT_ID?: string;
}

const QRIS_CREATE_URL = 'https://klikqris.com/api/qrisv2/create';

export interface QrisResult {
  ok: boolean;
  qrisUrl?: string;
  signature?: string;
  error?: string;
}

export async function createQrisTransaction(
  env: KlikQrisEnv,
  opts: { orderId: string; amount: number; description: string }
): Promise<QrisResult> {
  const apiKey = env.KLIKQRIS_API_KEY;
  const merchantId = env.KLIKQRIS_MERCHANT_ID;
  // ponytail: mock mode untuk dev/E2E — hapus saat kredensial produksi terpasang di .dev.vars
  if ((env as any).KLIKQRIS_MOCK === '1') {
    return { ok: true, qrisUrl: `data:image/svg+xml;base64,${btoa(`<svg xmlns="http://www.w3.org/2000/svg" width="300" height="300"><rect width="300" height="300" fill="#fff"/><text x="20" y="150" font-size="16" fill="#0B192C">MOCK QRIS ${opts.orderId}</text></svg>`)}`, signature: 'mock-sig-' + opts.orderId };
  }
  if (!apiKey || !merchantId) {
    return { ok: false, error: 'Kredensial KlikQRIS belum diset (KLIKQRIS_API_KEY / KLIKQRIS_MERCHANT_ID)' };
  }
  if (!Number.isInteger(opts.amount) || opts.amount < 1) {
    return { ok: false, error: 'Nominal tidak valid' };
  }
  try {
    const res = await fetch(QRIS_CREATE_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'id_merchant': merchantId,
        'User-Agent': 'Mozilla/5.0 (Berbirru; rekber)',
      },
      body: JSON.stringify({
        order_id: opts.orderId,
        id_merchant: merchantId,
        amount: opts.amount,
        keterangan: opts.description.slice(0, 120),
      }),
    });
    if (!res.ok) {
      return { ok: false, error: `KlikQRIS HTTP ${res.status}` };
    }
    const data: any = await res.json().catch(() => null);
    // Kontrak adapter komunitas: { status: true, data: { qris_url, signature, ... } }
    const qrisUrl: string | undefined = data?.data?.qris_url ?? data?.data?.qrisUrl ?? data?.qris_url;
    const signature: string | undefined = data?.data?.signature ?? data?.signature;
    if (!qrisUrl) {
      return { ok: false, error: 'Respons KlikQRIS tanpa qris_url' };
    }
    return { ok: true, qrisUrl, signature };
  } catch (e: any) {
    return { ok: false, error: e?.message || 'Gagal menghubungi KlikQRIS' };
  }
}

// Verifikasi webhook: signature dari create disimpan di orders.qris_signature;
// webhook harus mengirim signature yang sama. Amount juga dicek terhadap order.
export function verifyWebhook(
  incoming: { order_id?: string; status?: string; signature?: string; amount?: number },
  stored: { qris_order_id: string; qris_signature: string | null; total: number }
): { ok: boolean; paid: boolean; error?: string } {
  if (!incoming.order_id || incoming.order_id !== stored.qris_order_id) {
    return { ok: false, paid: false, error: 'order_id tidak cocok' };
  }
  if (!incoming.signature || !stored.qris_signature || incoming.signature !== stored.qris_signature) {
    return { ok: false, paid: false, error: 'signature tidak cocok' };
  }
  if (typeof incoming.amount === 'number' && incoming.amount !== stored.total) {
    return { ok: false, paid: false, error: 'nominal tidak cocok' };
  }
  const paid = incoming.status === 'PAID' || incoming.status === 'SUCCESS' || incoming.status === 'Settlement';
  return { ok: true, paid };
}

// Self-check ringan (dipakai node:test): pola verify tanpa jaringan.
export function _selftest(): boolean {
  const good = verifyWebhook(
    { order_id: 'O1', status: 'PAID', signature: 'sig', amount: 50000 },
    { qris_order_id: 'O1', qris_signature: 'sig', total: 50000 }
  );
  const badSig = verifyWebhook(
    { order_id: 'O1', status: 'PAID', signature: 'x', amount: 50000 },
    { qris_order_id: 'O1', qris_signature: 'sig', total: 50000 }
  );
  const badAmt = verifyWebhook(
    { order_id: 'O1', status: 'PAID', signature: 'sig', amount: 999 },
    { qris_order_id: 'O1', qris_signature: 'sig', total: 50000 }
  );
  return good.ok && good.paid && !badSig.ok && !badAmt.ok;
}
