# Laporan Audit Keamanan Penuh — Suspend/Pulihkan Akun dan Seluruh Layer

**Status Release C sandbox: PASS. Status produksi: HOLD terpisah.** Remediasi sosial/notifikasi, atomic password rotation, dan isolasi R2 sandbox sudah dipatch, diuji, dideploy ke sandbox, serta direview independen. **Production deploy: NOT DONE. Migration `0034`: NOT APPLIED. Final tag: NOT CREATED.** Ketiganya menunggu approval produksi terpisah.

## Ringkasan eksekutif

- **Audit Release C ini tidak menilai jalur Rekber/Pasar Buku.** Jalur tersebut dikeluarkan sesuai batas scope owner.
- Temuan di bawah hanya mencakup auth/session/status akun, write-block sosial, admin transition, dan bukti harness Release C.
- Produksi tetap pada build sebelum fitur suspend; tidak ada kode Rekber yang diubah, dimigrasikan, atau dideploy.

## Temuan dan remediasi Release C

1. **CLOSED — Stale unlike/unbookmark menghapus notifikasi pihak lain.** Relation judge kini dieksekusi lebih dulu; counter dan cleanup notification bergantung pada actor aktif serta relation yang sudah tidak ada. Regression test dan review independen lulus.
2. **CLOSED — Password rotation non-atomic.** Update password dan revoke sesi lain kini satu `D1.batch`; sesi aktif tetap hidup dan artefak `rst_`/`otpf_` dipertahankan. Regression test, full suite, typecheck, dan review independen lulus.
3. **CLOSED — R2 sandbox shared bucket.** `MEDIA` sandbox kini `berbirru-media-uji`, production tetap `berbirru-media`. Deploy sandbox dan fixture upload/read/delete dengan cleanup read-back nol lulus.

## Residual engineering notes

- `src/routes/media.ts:42-64`: lifecycle key avatar/cover deterministik masih menjadi reliability note terpisah; tidak menjadi scope remediasi Release C ini dan bukan jalur Rekber/Pasar.
- `tests/account-status-real-d1.sh`: real-D1 fault harness tidak dijalankan pada gate ini (`R4_D1_PERSIST` tidak diset); tidak mengubah bukti route/config sandbox yang sudah diverifikasi.

## Out of scope — tidak menjadi finding atau blocker Release C

- QRIS provider-response / stored XSS pada halaman order.
- Cancel order dan pemulihan stok.
- Kompensasi kegagalan QRIS.
- Bukti sengketa setelah order ditutup.
- Upload/delete foto listing dan false-success listing.
- Seluruh lifecycle order, saldo, ledger, settlement, withdrawal, seller docs, dan jalur Rekber lainnya.

Item-item tersebut tidak boleh dipakai untuk menahan atau mengubah keputusan Release C suspend/pulihkan akun.

## Hardening terpisah

- CSP masih memakai `unsafe-inline`; migrasikan script/handler dulu, lalu ketatkan CSP.
- HSTS `max-age=300`; naikkan bertahap setelah validasi seluruh subdomain.
- Lockfile memakai mirror HTTP tetapi semua entry punya SRI; regenerasi dari registry HTTPS.
- Advisori npm ada pada Wrangler/Miniflare dev-only; import graph Worker dan `npm audit --omit=dev` bersih.
- `workers_dev=true` membuka hostname paralel, tetapi passive parity check menunjukkan admin 404/no-store, config 404, CORS tidak reflektif, dan header setara. Nonaktifkan jika tidak diperlukan.
- Cloudflare Access tetap deferred sesuai keputusan owner; application owner gate aktif.

## Kontrol yang terbukti bekerja

- Akun suspended tidak dapat memakai sesi lama; reinstate tidak menghidupkan sesi lama.
- Owner kebal suspend di statement hakim; audit transition fail-closed dalam batch.
- OTP/reset finalizer memakai marker unik; replay hanya satu pemenang.
- Public serializer tidak membocorkan account status/reason/password/token/bank/alamat privat.
- Admin anonim 404/no-store; exact Origin gate; CORS tidak merefleksikan origin jahat.
- File `.env`, config, source, lockfile, dan `.git` tidak tersaji publik.
- D1 dan R2 sandbox terpisah dari produksi; R2 isolation dibuktikan live dengan fixture cleanup read-back nol.
- Production dependencies: 0 advisori; paket dev rentan tidak masuk bundle Worker.

## Urutan tindak lanjut

1. **Production release gate:** backup dan validasi produksi, apply migration `0034` hanya setelah approval eksplisit, deploy production, smoke test, lalu buat tag final.
2. **Terpisah dari Release C:** reliability lifecycle key avatar/cover dan real-D1 fault harness dapat dijadwalkan sebagai hardening berikutnya.
3. **Out of scope:** seluruh QRIS/order/stock/dispute/ledger/settlement/withdrawal/listing/Rekber/Pasar tetap tidak disentuh.
4. **P3:** HTTPS lockfile, Wrangler 4, CSP nonce/external scripts, HSTS panjang.

## Verification gates

**Executed and passed for Release C sandbox:**

- Focused RED→GREEN tests; full `npm test`; `npx tsc --noEmit`; SQL/source contract checks; `git diff --check`; Wrangler dry-run.
- Sandbox binding menunjukkan `MEDIA: berbirru-media-uji`; production binding tetap `berbirru-media`; fixture R2 upload/read/delete dan cleanup read-back nol.
- Independent review untuk source patches, R2 binding, dan closure artifacts.

**Deferred / not executed in this gate:**

- Real-D1 fault/race harness (`R4_D1_PERSIST` tidak diset).
- Browser/DOM test QRIS dan browser 1280/390/320 (jalur Rekber/Pasar dan browser runtime bukan scope Release C ini).
- Production backup, migration `0034`, production deploy, production smoke, dan final tag (menunggu approval produksi terpisah).

## Batas audit

Tidak ada mutation produksi, transaksi uang, upload live, atau akses data pengguna lain. Daftar objek R2 tidak tersedia bagi token audit. Stored-XSS dibuktikan dengan renderer/parser lokal dan source CSP; runtime browser lokal tidak tersedia pada verifier terakhir.
