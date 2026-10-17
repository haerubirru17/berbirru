# Warkah Bersambung (A1 + Expand + Lembar Sambungan) — Implementation Plan

> **For Hermes:** Implement task-by-task, gate per task. Owner approval ("gas") sudah diberikan untuk RENCANA; eksekusi menunggu sinyal terpisah.

**Goal:** Membuat relasi sambungan (parent_id, sudah ada di DB) terlihat & terbaca: atribusi di kartu feed, expand/collapse sambungan di feed, halaman "Lembar Sambungan", badge status terbuka, dan proksi data saat induk dihapus (opsi yatim + notice).

**Architecture:** Zero-migration. Semua fitur = query JOIN induk + render. Sambungan tetap post biasa dengan `parent_id`; keberadaan induk dicek saat render (LEFT JOIN), bukan diasumsikan. Payload feed tidak dibebani isi sambungan — fetch on-expand.

**Tech Stack:** Cloudflare Workers + D1 (existing), render SSR string templates (pola existing `src/web/feed.ts`), tanpa library baru.

**Desain terkunci (kesepakatan owner, 2026-10-17):**
- A1: chip biru kecil "↷ menyambung bait dari @x" di atas kartu post hasil sambungan (bukan A2 kutipan).
- Expand/collapse: bar "⛓ N sambungan — ketuk untuk lihat ▼" di kartu induk; default tertutup; saat dibuka, mini-bait fetch on-demand dan melorot di dalam kartu; klik lagi melipat; state per-post di memori halaman (URL tetap bersih).
- Lembar Sambungan (B): halaman baca fokus — induk di atas, rail titik + bait urut waktu, tombol "✍️ Sambung Bait Ini" (buka composer existing dengan parent), tombol kembali.
- Badge status: 🟢 "Buka untuk siapapun" pada induk di Lembar Sambungan (data memang terbuka; mode persetujuan 🔐 TIDAK dibangun — disimpan untuk nanti).
- Kepemilikan: per-bait milik penulisnya masing-masing; induk dihapus → sambungan TIDAK diCascade, tampil notice netral "Bait asli telah dihapus penulisnya…" dan chip induk disembunyikan (guard render, oksi 1 "yatim + notice").
- Hapus sambungan oleh author induk: TIDAK termasuk paket ini (menunggu kasus nyata).

---

## Task 1 — Chip atribusi A1 di kartu feed

**Objective:** Post hasil sambungan menampilkan chip "menyambung bait dari @induk" yang klik ke Lembar Sambungan induk.

**Files:**
- Modify: `src/index.ts` — query feed (`GET /api/posts` / tab feed): LEFT JOIN induk:
  `LEFT JOIN posts parent ON posts.parent_id = parent.id LEFT JOIN users pu ON parent.author_id = pu.id`
  → ambil `parent.id AS parent_exists, pu.pen_name AS parent_pen`.
  NOTE: hati-hati query feed existing punya JOIN users/pen_name sendiri — alias jangan tabrakan.
- Modify: `src/web/feed.ts` — `hardenPost`/peta post: bawa `parent_pen` (null bila induk telah dihapus). Render chip hanya jika `p.parent_id && p.parent_pen` (induk hidup). Chip = link `/chain/<parent_id>`. Nilai `works_count` induk tidak diubah.
- CSS chip: 1 rule kecil (`.attr-line`), gaya sesuai mockup (biru muda, border tipis, ikon rantai inline SVG stroke currentColor).

**Verify:**
- `npx esbuild src/index.ts --bundle --format=esm --outfile=/tmp/bc.mjs` → OK
- `npm test` → 6/6
- Dev: buat post A → sambung B (akun bob) → curl `/api/posts` → post B membawa `parent_pen=alice`. Hapus A → `parent_pen` null & chip hilang di render (uji via curl HTML).

## Task 2 — Lembar Sambungan (halaman B)

**Objective:** `GET /chain/:postId` — halaman baca fokus: induk + seluruh sambungan urut waktu + CTA sambung + badge 🟢 + notice yatim bila induk telah dihapus.

**Files:**
- Modify: `src/index.ts` — route SSR `app.get('/chain/:id')`:
  - Ambil post target + author pen_name.
  - Root = target bila `parent_id` null; bila target ANAK ( orang buka lembar dari kartu sambungan), root = induknya. Bila induk target MATI (parent_id set tapi row hilang) → mode yatim: render notice + anak-anak dari target.
  - Query anak: `SELECT p.*, u.pen_name FROM posts p JOIN users u ... WHERE parent_id = ? ORDER BY created_at ASC`.
  - Login guard pola existing; 404 pola existing.
- Create: `src/web/chain.ts` — `renderChainPage(...)` SSR (satu file baru, pola `notifications.ts`): header kembali ke feed, kartu induk (badge 🟢 "Buka untuk siapapun"), rail titik + kartu bait (nick + waktu + isi + like kecil), tombol ✍️ (redirect composer dengan parent, reuse jalur existing `openStudioModal`), notice yatim.
- Notifications tidak berubah.

**Verify:**
- Dev E2E: A(parent) → B,C anak → `/chain/A` urut B,C + badge; `/chain/B` sama (root naik ke A); DELETE A → `/chain/B` tampil notice & bait tetap; `/chain/xxx-salah` → 404; belum login → redirect `/login` (pola existing).

## Task 3 — Expand/collapse sambungan di kartu feed

**Objective:** Kartu induk dengan `chains_count > 0` menampilkan bar expand; dibuka → fetch on-demand mini-bait melorot dalam kartu; klik lagi melipat.

**Files:**
- Modify: `src/web/feed.ts` —
  - Bar expand di kartu bila `p.chains_count > 0` (di bawah actions, di atas none): `⛓ N sambungan — ketuk untuk lihat ▼` / saat terbuka `Sembunyikan sambungan ▲`.
  - JS existing-halaman: `window.toggleChain(postId, btn)` ( Wahaj WAJIB expose window — pelajaran lama) + guard `if (state[postId]) collapse else expand`; fetch `/api/posts/{id}/chains` sekali, cache di Map; render mini-bait (nick, waktu, isi) + CTA ✍️ + link "Lembar penuh ↗" ke `/chain/{id}`.
- Modify: `src/index.ts` — endpoint JSON kecil `GET /api/posts/:id/chains` (anak, ASC, limit 20; pola query Task 2).

**Verify:**
- `npm test` 6/6; esbuild OK.
- Dev: klik expand → muncul; klik lagi → hilang; cepat klik 2× tidak dobel (guard state); HTML script lulus `node --check` (tulis file dulu — node 22).

## Task 4 — Gate + deploy

- `npx esbuild ...` OK; `npm test` 6/6.
- Commit pesan ringkas daftar 3 perubahan; push origin main; `wrangler deploy`; curl produksi `/` 200 + `/chain/<id-nyata>` 200.
- Pastikan state dev bersih (post uji dihapus) sebelum commit.

## Risks / Open
- Query feed +1 LEFT JOIN ×2 — monitor murah (D1 baca tetap jauh di bawah limit).
- JS-in-HTML: TANPA escape `\/` dalam template literal (pelajaran: pakai concat/split) — sudah dicatat di Task 3.
- `chains_count` induk tidak diubah saat induk dihapus (tidak relevan — barisnya hilang).
- Mode 🔐 & tombol hapus-sambungan: sengaja di luar paket, catat backlog, jangan implement.
