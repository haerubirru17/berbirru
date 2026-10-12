# 🌊 BERBIRRU.COM — Pustaka Tulisan & Kolaborasi Kata di Edge

> **Platform Sastra & Kolaborasi Warkah Berbasis Edge Cloudflare**  
> Live Production: [https://berbirru.com](https://berbirru.com)  
> Arsitektur: **Zero-DevOps Serverless Edge** (Hono + Cloudflare Workers + D1 Database + Native WebCrypto)

---

## 🏛️ Arsitektur Sistem & Spesifikasi Teknis

* **Runtime & Framework:** Cloudflare Workers (Edge V8 isolate) + **Hono.js** v4
* **Database Engine:** Cloudflare **D1** (Serverless distributed SQLite di edge)
* **Keamanan Kriptografi:** Native WebCrypto API (PBKDF2-SHA256, constant-time comparison)
* **Bot Defense:** Cloudflare Turnstile CAPTCHA (fail-closed token gate + single-use invalidation)
* **Frontend Architecture:** Pure Server-Side Rendered (SSR) HTML & Vanilla CSS/JS (Zero framework overhead, ~40ms global TTFB)
* **Email Service:** Cloudflare Worker fetch to Resend API (Transactional OTP 6-Digit)

---

## 📁 Struktur Repositori

```
berbirru/
├── wrangler.toml              # Konfigurasi Cloudflare Workers, Zone, & D1 Database Binding
├── schema.sql                 # Skema D1 SQLite utama (Users, Posts, Likes, Bookmarks, Sessions)
├── migrations/
│   └── 0001_rate_limits.sql   # Skema D1 persistent rate-limiting lintas-datacenter
│
├── src/
│   ├── index.ts               # Router API Hono, Controller Endpoint, Auth Middleware, & Error Handler
│   ├── mail.ts                # Client pengiriman surel kode OTP via Resend
│   ├── assets.ts              # Aset statis terenkripsi (misal: OG_IMAGE_BASE64 1200x630)
│   │
│   ├── lib/                   # Modul Keamanan Inti (Pure Function & Teruji Mandiri)
│   │   ├── password.ts        # PBKDF2 10.000 iterasi, constant-time comparison, token hash
│   │   ├── sanitize.ts        # Sanitizer input anti-XSS & entity encoding
│   │   └── turnstile-gate.ts  # Gate verifikasi bot Cloudflare Turnstile di edge
│   │
│   └── web/                   # Lapisan View SSR (HTML Template Literal)
│       ├── layout.ts          # Komponen bersama (DRY 5-Tab Lucide Bottom Navbar)
│       ├── landing.ts         # Landing Page utama (berbirru.com/)
│       ├── login.ts           # Halaman Masuk, Daftar, & Request OTP (berbirru.com/login)
│       ├── feed.ts            # Halaman Linimasa Warkah & Compose Modal (berbirru.com/feed)
│       ├── notifications.ts   # Halaman Riwayat Aktivitas Interaksi (berbirru.com/notifications)
│       └── profile.ts         # Halaman Paspor Penulis & Pengaturan (berbirru.com/u/:pen_name)
│
├── tests/                     # Unit Test Suite Mandiri (Node.js Test Runner)
│   ├── password.test.ts       # Verifikasi hashing, salt, & resistansi timing attack
│   ├── sanitize.test.ts       # Uji coba payload XSS, strip tags, & escape HTML
│   └── turnstile-gate.test.ts # Uji batas token bot, secret verification, & adblocker fallback
│
├── SECURITY.md                # Dokumentasi Kebijakan Keamanan, Mitigasi Strix, & Panduan Audit
├── PLANNING.md                # Log spesifikasi arsitektur & milestone fitur
└── README.md                  # Panduan proyek & instruksi audit pengembang
```

---

## 🔒 Panduan Audit & Analisis Keamanan (Security Audit Guide)

Repositori ini siap diaudit secara mandiri oleh profesional pengembang maupun agent AI otonom (*Whitebox Security Review*).

### 1. Menjalankan Security Test Suite Lokal:
```bash
# Menjalankan seluruh unit test logika keamanan & sanitasi
npm test
```

### 2. Checkpoint Penting untuk Auditor:
* **Autentikasi & Session:** Periksa `src/index.ts` fungsi `getAuthUser` dan `src/lib/password.ts`. Sesi divalidasi `fail-closed`, token disimpan dalam format hash, dan cookie dikunci `HttpOnly; Secure; SameSite=Lax`.
* **Proteksi Akses IDOR:** Periksa endpoint mutasi data seperti `DELETE /api/posts/:id` di `src/index.ts`. Seluruh query mutasi memverifikasi `author_id === user.id` sebelum eksekusi.
* **SQL Injection Resistance:** 100% database query menggunakan **Parameterized Prepared Statements** D1 (`c.env.DB.prepare(...).bind(...)`). Tidak ada interpolasi string SQL mentah.
* **XSS Defense:** Seluruh input pengguna dibersihkan dengan `sanitizeRich()` di `src/lib/sanitize.ts` sebelum masuk database, dan diemisi secara aman di template view.
* **Bot & DoS Protection:** Turnstile token divalidasi sebelum endpoint auth/otp dan rate-limiting disimpan persisten di D1 (`hitRate()`) untuk mencegah bypass multi-POP edge.

Detail mitigasi lengkap terhadap temuan Strix (vuln-0001 s.d. vuln-0008) tercantum di file [`SECURITY.md`](./SECURITY.md).

---

## 🛠️ Pengembangan Lokal & Deployment

```bash
# 1. Install dependencies
npm install

# 2. Jalankan unit test
npm test

# 3. Jalankan server lokal
npx wrangler dev

# 4. Deploy ke Cloudflare Workers
npx wrangler deploy
```
