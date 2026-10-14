# 🛡️ Kebijakan & Kerangka Audit Keamanan (Enterprise Security & Audit Baseline) — BERBIRRU.COM

> **Referensi Standar:** [Cloudflare Security Audit Framework (`cloudflare/security-audit-skill`)](https://github.com/cloudflare/security-audit-skill)  
> **Ruang Lingkup:** `https://berbirru.com`, Cloudflare Edge Workers, Cloudflare D1 Database, Cloudflare KV, dan API Subdomain.  
> **Klasifikasi:** Enterprise Zero-Trust Security Baseline  
> **Terakhir Diperbarui:** Oktober 2026

---

## 1. Komitmen Keamanan & Pelaporan Kerentanan (Vulnerability Disclosure)

Tim **Berbirru** berkomitmen menjaga integritas data pengguna, kerahasiaan identitas penulis, dan ketersediaan layanan dengan standar keamanan tertinggi. Kami menyambut baik laporan riset keamanan dari komunitas *ethical hacker*.

### 📬 Jalur Kontak Resmi:
- **Surel Pelaporan:** `security@berbirru.com` *(atau via Telegram Admin: `@haerubirru17`)*
- **PGP/Enkripsi:** Tersedia atas permintaan untuk pengungkapan laporan sensitif.

### ⏱️ SLA Respons Insiden (Standar Cloudflare Audit):
| Fase | Target Waktu |
| :--- | :--- |
| **Acknowledge (Penerimaan Laporan)** | < 24 Jam |
| **Triage & Verifikasi Dampak** | < 48 Jam |
| **Mitigasi / Hotfix Deploy** | < 72 Jam *(Kritis)* / < 7 Hari *(Medium)* |
| **Penyelesaian & Credit Penemu** | Bersamaan dengan rilis patch |

### 🤝 Kebijakan Safe Harbor:
Kami tidak akan mengambil tindakan hukum terhadap peneliti yang:
1. Melakukan pengujian tanpa merusak data pengguna atau menurunkan performa sistem (*No DoS/DDoS*).
2. Menghindari akses ke data privat milik pengguna lain tanpa izin (*No unauthorized data scraping*).
3. Memberikan waktu yang cukup (*Coordinated Disclosure*) sebelum mempublikasikan temuan ke publik.

---

## 2. Taksonomi Audit Keamanan Cloudflare (6-Domain Security Controls)

Mengadopsi taksonomi resmi **Cloudflare Security Audit Harness**, seluruh lapisan arsitektur Berbirru diaudit berdasarkan 6 domain keamanan berikut:

```
┌────────────────────────────────────────────────────────────────────────┐
│ 1. WEB PROTOCOL & AUTH (WEB-PROTOCOL-AND-AUTH.md)                      │
│    ├── Timing-Attack Safe Comparison (crypto.subtle.timingSafeEqual)   │
│    ├── Fail-Closed Session Verification & Secure HTTP-Only Cookies     │
│    └── CSRF/Origin Binding Guards on all State-Changing Mutations      │
├────────────────────────────────────────────────────────────────────────┤
│ 2. CLOUD & DEPLOYMENT INVARIANTS (CLOUD-AND-DEPLOYMENT.md)             │
│    ├── Strict Secret Redaction (No API keys / Secrets in Git repo)     │
│    ├── Cloudflare Turnstile Verification on Edge (Anti-Bot Defense)    │
│    └── Ephemeral Storage Lifecycle (D1 Auto-Purge OTP & Temp Data)     │
├────────────────────────────────────────────────────────────────────────┤
│ 3. CLIENT-SIDE DOM & CSP (CLIENT-SIDE.md)                              │
│    ├── Dynamic Nonce-based Content-Security-Policy (No unsafe-inline)  │
│    ├── Anti-Clickjacking: X-Frame-Options: DENY, frame-ancestors 'none'│
│    └── Strict HTML Entity Encoding on all User-Generated Inputs       │
├────────────────────────────────────────────────────────────────────────┤
│ 4. DATA ISOLATION & ACCESS CONTROL (DATA-ISOLATION-AND-LIFECYCLE.md)   │
│    ├── Zero-Raw SQL (100% Parameterized Prepared Statements in D1)     │
│    ├── Strict IDOR Ownership Check (user_id === session.user_id)      │
│    └── Data Minimization (Emails never exposed on public JSON routes)  │
├────────────────────────────────────────────────────────────────────────┤
│ 5. RESOURCE EXHAUSTION & DoS (RESOURCE-EXHAUSTION-AND-AVAILABILITY.md) │
│    ├── IP & User-based Rate Limiting (Cloudflare KV Edge Buckets)      │
│    ├── Payload Size Enforcements (Max 4KB per warkah post)             │
│    └── Unmetered Edge DDoS Layer 3/4/7 Absorption via Cloudflare Proxy │
├────────────────────────────────────────────────────────────────────────┤
│ 6. SUPPLY CHAIN & CODE INTEGRITY (SUPPLY-CHAIN-AND-RELEASE.md)         │
│    ├── Zero Bloat / Minimal Production Dependencies                    │
│    ├── Immutable Deploy Artifacts via Wrangler & Git Tag Verifications │
│    └── Automated Static Security Analysis before Production Release    │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Standar Kriptografi & Manajemen Sesi

1. **Hashing Kata Sandi:** PBKDF2-SHA256 via WebCrypto (`crypto.subtle.deriveBits`),
   **10.000 iterasi**, salt acak 16 byte per user, format simpanan
   `pbkdf2$sha256$<iterasi>$<salt-b64>$<hash-b64>`.
   - **Batas yang diketahui & diterima:** OWASP menyarankan 600k iterasi
     PBKDF2-SHA256. Angka itu **tidak dapat dicapai** di runtime ini — WebCrypto
     Workers menolak iterasi > 100.000 (`NotSupportedError`), dan cap CPU 10 ms
     per request pada Workers Free hanya menyisakan ruang untuk ±10k (≈5 ms).
     Percobaan 600k menyebabkan 500 massal pada login (insiden 10 Okt 2026).
     100k baru layak bila pindah ke Workers Paid (30 s CPU); hash lama otomatis
     di-upgrade saat login berikutnya.
   - Argon2id/scrypt **tidak tersedia** di WebCrypto dan tidak dipakai (Workers
     tanpa dependency biner), meski secara teori lebih kuat.
2. **Manajemen Sesi:**
   - Token acak kriptografis 2× `crypto.randomUUID()` (≈244 bit entropy),
     masa berlaku 30 hari, maksimal 5 sesi per user.
   - **Hash-at-rest (vuln-0005):** DB menyimpan **SHA-256 token** di kolom
     `token_hash` — token plaintext hanya hidup di cookie, tidak pernah
     ditulis ke D1. Lookup sesi memakai hash; bocornya DB tidak langsung
     memberi sesi valid. (Migrasi `0003`, sesi lama dicabut semua — setuju
     owner 14 Okt 2026.) Baris OTP pending tetap memakai kolom `token`
     (`otp_<hash>`); `token_hash`-nya NULL.
   - Cookie: `HttpOnly`, `Secure`, `SameSite=Lax`, `Path=/`.
     `Lax` (bukan `Strict`) dipilih agar navigasi dari tautan eksternal/email
     tetap membawa sesi; endpoint pengubah data tetap diproteksi pemeriksaan
     `Origin`.
   - `POST /api/auth/logout-all` mencabut seluruh sesi lain milik user.
3. **Adaptive Step-Up OTP:**
   - Kode OTP 6-digit dari CSPRNG (`crypto.getRandomValues`).
   - **Disimpan sebagai hash PBKDF2**, bukan kode mentah (`otp_<hash>` di tabel
     `sessions`), berlaku **10 menit**, satu kode aktif per user.
   - Pembatasan percobaan lewat rate limit D1: 5 kirim / 15 menit per email,
     10 verifikasi / 10 menit per IP **dan** per akun.
4. **Otorisasi & Kontrol Akses IDOR (Access Control):**
   - Mutasi data sensitif seperti `DELETE /api/posts/:id` memvalidasi kepemilikan mutlak di server (`author_id === user.id`).
   - Halaman profil privat `/u/:pen_name` memproteksi sesi via redirect login untuk pengunjung yang belum terautentikasi.
   - Operasi penghapusan memakai transaksi `D1.batch()` untuk menjamin integritas relasi likes, bookmarks, dan notifikasi.

---

## 4. Validasi Keamanan Otomatis (Pre-Deploy Security Gate)

Setiap rilis kode ke produksi `https://berbirru.com` wajib melewati uji validasi keamanan otomatis:
```bash
# Uji kepatuhan skema & sanitasi kode
npm test

# Validasi berkas temuan audit (wajib argumen)
node ~/.hermes/skills/security/security-audit/validate-findings.cjs <path-to-findings.json>
node ~/.hermes/skills/security/security-audit/validate-coverage-ledger.cjs <path-to-coverage-ledger.json>
```

---

## 5. Hasil Audit Putaran 2 (Strix Deep — 13 Okt 2026)

Laporan *deep scan* (31 temuan: 1 HIGH, 4 MEDIUM, 26 LOW) diverifikasi ulang terhadap kode
sebelum diperbaiki. Semua temuan aplikasi (bukan CVE toolchain) telah ditutup:

| # | Temuan | Penanganan | Bukti |
| :-- | :-- | :-- | :-- |
| 29 | Stored XSS via `parent_id` (HIGH) | `POST /api/posts` menerima hanya UUID yang benar-benar ada; sink `feed.ts` menolak nilai non-UUID sebelum masuk `onclick` | payload `');alert(1)//` tersimpan `NULL`; `alert(1)` tidak ada di HTML feed |
| 26 | Stored XSS via judul pada tombol sambung | nilai judul pindah ke atribut `data-title` + `this.dataset.title` (tidak lagi string JS inline) | tidak ada interpolasi HTML ke konteks JS |
| 22 | IDOR bookmark/likes (`tab=saved\|likes`) | ditutup untuk semua kecuali pemilik (`403`); tab disembunyikan untuk profil orang lain | `403` tanpa cookie, `200` untuk `tab=original` |
| 23 | Pre-hijacking registrasi | `users.email_verified` (migrasi `0002`, default `1` untuk data lama); registrasi tidak lagi mengeluarkan sesi, wajib OTP; respons seragam; rate limit per IP & per email | login akun belum aktif → `403` |
| 24 | Banjir notifikasi | dedup per (penerima, pelaku, jenis, pos), notifikasi ditarik saat unlike, rate limit `hitRate` 60/60 detik | 20 siklus toggle → maksimal 1 notifikasi |
| 28 | Baris OTP pending diterima sebagai sesi | filter `s.token NOT LIKE 'otp_%'` di `getAuthUser` | — |
| 31 | Fallback hash SHA-256 salt-statis | format non-`pbkdf2$` ditolak; `legacySha256` dihapus dari kode | hash lama → `ok:false` |
| — | Akun lama terkunci oleh penolakan hash | `POST /api/auth/change-password` (wajib sesi, limit 5/jam) + field "Kata Sandi Baru" pada modal Edit Profil | sandi baru → `200`, sandi lama → ditolak |

**Sisa (diterima):** 26 temuan LOW semuanya CVE pada dependensi *development* (wrangler →
miniflare → undici/ws/sharp/busboy). Rantai itu tidak ikut ter-bundle ke Worker produksi —
satunya dependensi runtime adalah `hono`. Upgrade `wrangler@^4` direkomendasikan saat jendela
pemeliharaan.

---

## 6. Hasil Audit Putaran 3 (Strix Deep ke repo terbaru — 14 Okt 2026)

Laporan penetrasi putaran ketiga (6 temuan: 1 HIGH, 4 MEDIUM, 1 INFO) diuji ulang terhadap
source berjalan; 5 temuan aplikasi diperbaiki, semuanya terverifikasi E2E di runtime lokal:

| # | Temuan | Penanganan | Bukti E2E |
| :-- | :-- | :-- | :-- |
| vuln-0003 (HIGH 8.1) | `verify-otp` tanpa gerbang Turnstile + tanpa batas 5 sesi | `requireHuman(...,'votp',...)` fail-closed + prune 5 sesi seperti login | verify tanpa token → `403`; dengan token → `200` |
| vuln-0004 (MED 6.8) | Pre-hijack: sandi pendaftar pertama tetap hidup setelah aktivasi OTP pendaftar kedua | field `new_password` opsional di verify-otp; kalau tak diisi, hash lama dihancurkan (`otp-disabled:<random>`) saat aktivasi akun pending | login P1 setelah aktivasi → `401` (dulu `200`) |
| vuln-0005 (MED 5.3) | siteverify tak melakukan binding hostname | tolak kecuali `data.hostname === APP_DOMAIN`; test-key dev dikecualikan | header logging mismatch; fail-closed |
| vuln-0001 (MED 5.4) | `POST /api/posts`, `DELETE /api/posts/:id`, `PATCH /api/users/me` tanpa rate limit | bucket per-penulis `post:` / `profile:` 20/60 dtk | 20× `201` lalu `429` |
| vuln-0007 (MED 4.3) | Tabel `rate_limits` tumbuh tanpa akhir | GC probabilistik 2% per panggilan `hitRate` menghapus baris expired | — |
| — | Bug fungsional: notif chain `INSERT` sebelum post (FK gagal, reply lintas-penulis `500`) | notif dibuat **setelah** `INSERT` post | reply lintas-penulis tak lagi `500` |
| vuln-0006 (INFO) | Oracle keberadaan akun lewat sisi pengiriman | diterima sebagai sisa desain anti-enumerasi (body seragam); didokumentasikan | — |
