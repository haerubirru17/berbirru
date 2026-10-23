# Plan: Pasar Buku Berbirru (Rekber Fisik ala Shopee)

Status: DESAIN DISETUJUI OWNER (2026-10-18) — belum ada kode.
Varian UI: **A (grid 2 kolom)**, mockup `/tmp/market_a.png`.

## Model uang (FINAL)
| Item | Nilai |
|---|---|
| Fee rekber | 5.000 flat per ORDER — ditanggung PENJUAL |
| Pembeli bayar | harga + ongkir persis (fee tak terlihat) |
| Saldo penjual saat selesai | harga − 5.000 + ongkir utuh |
| Withdraw | min 40.000, biaya 0, tanpa fee % |
| KlikQRIS | 2.500 per penarikan batch (beban owner), free 80 trx/hari |
| Payout | dana settle ke rekening owner → transfer manual, ledger D1 |

## Alur order (state machine)
`created → paid → shipped → completed → withdrawn`
- created 48 jam tanpa bayar → `expired`
- paid: penjual kirim ≤2×24 jam (kurir+resi wajib) → `shipped`; lewat → `canceled` + refund
- shipped: pembeli klik "Diterima" → `completed` (ledger credit) ATAU auto-`completed` D+5 sejak shipped (cron)
- sengketa kapan pun sebelum completed → `disputed` (owner arbiter, timeline order_events)

## Pemicu status (3 pintu)
1. Webhook klikqris (verif signature+amount, idempotent guard `WHERE status='created'`)
2. Tombol user (alamat checkout / kirim+resi / diterima / sengketa)
3. Cron sweep per jam (expire, SLA kirim, auto-complete) — 3 query UPDATE flat

## Fase pembangunan
- **F0 Migration 0005**: backup `wrangler d1 export` dulu → tabel:
  - `listings`(id, seller_id, title, author, desc, cond, price, shipping_flat, status, created_at)
  - `listing_photos`(id, listing_id, r2_key, ord) — max 5, reuse R2+magic bytes
  - `orders`(id, listing_id, buyer_id, price, shipping, status, alamat, penerima, hp, kurir, resi, ship_deadline, qris_order_id, qris_signature, created_at)
  - `order_events`(id, order_id, actor, from_st, to_st, note, created_at) — timeline arbiter
  - `ledger`(id, user_id, order_id, delta, kind, created_at) — append-only
  - `withdrawals`(id, user_id, amount, status, requested_at, paid_at)
- **F1 Adapter** `src/klikqris.ts` (fetch-based, ~80 baris): createTransaction + verif signature; kredensial `.dev.vars` + `wrangler secret` (KLIKQRIS_API_KEY, KLIKQRIS_MERCHANT_ID)
- **F2 Halaman Pasar** (varian A) + form "Jual Buku" (1–5 foto)
- **F3 Checkout**: form alamat/penerima/HP + rincian harga+ongkir → QRIS page (polling status)
- **F4 Webhook** `/api/klikqris/webhook` + cron sweep (wrangler.toml triggers)
- **F5 Halaman order** (status stepper, resi, link lacak kurir, tombol diterima/sengketa) + Saldo & withdraw (min 40rb) + panel admin owner (konfirm cair, arbiter)
- **F6 Notif** reuse sistem notif; tests node:test; API kredensial lihat skill `payment-gateway-integration`

## Gate tiap deploy
esbuild bundle + npm test 6 OK + curl 200 + screenshot headless + vision/PIL + d1 export backup sebelum migration.

## Rajin-rajin diingat
- Logo header = salin UTUH `.brand-header` login.ts (lapisan z wajib)
- Kredensial TIDAK PERNAH ditulis nilainya
- Fee & angka = env/KV, bukan hardcode
