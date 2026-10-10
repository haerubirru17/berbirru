// Keputusan gerbang Turnstile — dipisah dari Worker supaya bisa diuji tanpa
// Hono/D1. Kontrak:
//  - secret tidak diset  -> TOLAK selalu (fail-closed; ini salah konfigurasi server,
//    bukan salah user, jadi jangan pernah diloloskan).
//  - token ada tapi invalid -> TOLAK selalu. Ini sinyal serangan nyata; JANGAN
//    pernah dialihkan ke jalur cadangan.
//  - token tidak ada (widget diblokir adblocker/iframe) -> boleh lewat HANYA bila
//    endpoint mengizinkan jalur cadangan berkuota ketat.
export type GateDecision = 'ok' | 'fallback' | 'reject';

export function turnstileGate(o: {
  hasSecret: boolean;
  hasToken: boolean;
  tokenValid: boolean;
  allowFallback: boolean;
}): GateDecision {
  if (!o.hasSecret) return 'reject';
  if (!o.hasToken) return o.allowFallback ? 'fallback' : 'reject';
  return o.tokenValid ? 'ok' : 'reject';
}
