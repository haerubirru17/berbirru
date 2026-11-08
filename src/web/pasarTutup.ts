// Halaman info: Pasar Buku sedang dipersiapkan (gate PASAR_TUTUP — Strix run-4 followup).
// WAJIB pakai shell & komponen yang sama dengan halaman Pasar asli (BASE_CSS/PASAR_BASE_CSS
// + renderBottomNav) — bukan halaman statis mandiri — supaya style selalu sinkron dgn app.
import { renderBottomNav } from './layout';
import { PASAR_BASE_CSS } from './pasar';

export function renderPasarTutupPage(user: any = null): string {
  return `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Pasar Buku — BERBIRRU.COM</title>
  <link rel="icon" type="image/svg+xml" href="/favicon.ico">
  ${PASAR_BASE_CSS}
  <style>
    .tutup-wrap{max-width:560px;margin:26px auto 0;display:flex;flex-direction:column;align-items:center;text-align:center}
    .tutup-badge{font:700 10px 'Roboto Mono';letter-spacing:.14em;background:var(--yellow);border:2px solid var(--ink);padding:4px 10px;margin:0 0 14px;text-transform:uppercase}
    .tutup-icon{width:72px;height:72px;display:grid;place-items:center;border:var(--line);background:#fff;box-shadow:var(--small-shadow);margin:0 0 18px}
    .tutup-icon svg{width:34px;height:34px;stroke:var(--blue);stroke-width:1.8;fill:none;stroke-linecap:round;stroke-linejoin:round}
    .tutup-title{font:700 clamp(34px,7vw,52px)/1 'Newsreader',serif;letter-spacing:-.04em;margin:0 0 12px}
    .tutup-desc{max-width:320px;margin:0 0 24px;font-size:13.5px;font-weight:700;color:var(--muted);line-height:1.6}
    .tutup-desc b{color:var(--ink)}
    .btn-kembali{display:inline-flex;align-items:center;gap:8px;min-height:46px;padding:11px 22px;background:var(--blue);color:#fff;border:var(--line);box-shadow:var(--small-shadow);font-weight:900;text-decoration:none}
    .btn-kembali:active{transform:translate(2px,2px);box-shadow:1px 1px 0 var(--ink-soft)}
  </style>
</head>
<body>
  <div class="container">
    <div class="tutup-wrap">
      <span class="tutup-badge">Segera</span>
      <div class="tutup-icon"><svg viewBox="0 0 24 24"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20V4a2 2 0 0 0-2-2H6.5A2.5 2.5 0 0 0 4 4.5v15z"/><path d="M20 17v5H6.5A2.5 2.5 0 0 1 4 19.5"/><path d="M9 7h7M9 10h5"/></svg></div>
      <h1 class="tutup-title">Pasar Buku sedang dipersiapkan</h1>
      <p class="tutup-desc">Fitur <b>jual-beli buku</b> sedang disempurnakan agar transaksi lebih aman dan nyaman. Halaman ini akan dibuka segera.</p>
      <a class="btn-kembali" href="/feed">Kembali ke Beranda</a>
    </div>
  </div>
  ${renderBottomNav('pasar', user)}
</body>
</html>`;
}
