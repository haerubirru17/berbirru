# 🛡️ Kebijakan Keamanan (Security Policy) — BERBIRRU.COM

> **Klasifikasi:** Dokumen Kebijakan Keamanan Tingkat Enterprise (Enterprise-Grade Security Baseline)  
> **Ruang Lingkup:** `https://berbirru.com`, Cloudflare Edge Workers, Cloudflare D1 Database, dan API Subdomain.  
> **Terakhir Diperbarui:** Oktober 2026

---

## 1. Komitmen Keamanan & Pelaporan Kerentanan (Vulnerability Disclosure)

Tim **Berbirru** berkomitmen menjaga integritas data pengguna, kerahasiaan identitas penulis, dan ketersediaan layanan dengan standar keamanan tinggi. Kami menyambut baik laporan riset keamanan dari komunitas *white-hat / ethical hacker*.

### 📬 Jalur Kontak Resmi:
- **Surel Pelaporan:** `security@berbirru.com` *(atau via Telegram Admin: `@haerubirru17`)*
- **PGP/Enkripsi:** Tersedia atas permintaan untuk pengungkapan laporan sensitif.

### ⏱️ SLA Respons Insiden:
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

## 2. Model Ancaman & Matriks Pertahanan (Threat Model & Defensive Controls)

Arsitektur Berbirru dirancang dengan prinsip **Zero-Trust & Fail-Closed** di atas edge network Cloudflare:

```
┌────────────────────────────────────────────────────────────────────────┐
│ 1. EDGE NETWORK (Cloudflare)                                           │
│    ├── DDoS Layer 3/4/7 Mitigation (Unmetered Edge Filtering)          │
│    ├── Cloudflare Turnstile (Anti-Bot Challenge on Write Endpoints)    │
│    └── Strict Dynamic CSP Nonce, HSTS (max-age=31536000), X-Frame: DENY│
├────────────────────────────────────────────────────────────────────────┤
│ 2. API & GATEWAY RUNTIME (Hono.js on Workers)                          │
│    ├── Rate Limiting (IP & Session bucketed in Cloudflare KV)          │
│    ├── Constant-time Hash Comparison (Timing-Attack Guard)             │
│    └── Fail-Closed Input Validation (Strict Zod/Schema Type Guards)    │
├────────────────────────────────────────────────────────────────────────┤
│ 3. PERSISTENCE LAYER (Cloudflare D1 SQLite)                            │
│    ├── 100% Parameterized Prepared Statements (Zero Raw SQL Injection) │
│    ├── Row-Level Authorization / Session Ownership Enforcement         │
│    └── Ephemeral OTP Purge (Auto-delete records older than 5 minutes)  │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Standar Kriptografi & Manajemen Sesi

1. **Hashing Kata Sandi:**
   - Menggunakan algoritma **Scrypt / Argon2id** yang dioptimalkan untuk runtime V8 Web Crypto API dengan *cost parameter* standar OWASP.
2. **Manajemen Sesi:**
   - Sesi diterbitkan dalam bentuk cryptographically random tokens (256-bit entropy).
   - Cookie disetel dengan atribut: `HttpOnly`, `Secure`, `SameSite=Strict`, dan `Path=/`.
3. **Adaptive 2FA OTP:**
   - Kode OTP 6-digit dihasilkan menggunakan CSPRNG (`crypto.getRandomValues`).
   - Hash OTP disimpan di D1 dengan batas masa berlaku 5 menit dan *maximum 5 attempts* sebelum *locked out*.

---

## 4. Perlindungan Data & Privasi (Data Minimization)

- **Pseudonymous by Design:** Alamat surel (email) dan kata sandi pengguna hanya digunakan untuk autentikasi dan **tidak pernah disertakan dalam payload query publik** (`/api/posts` atau `/api/users/:pen_name`).
- **Sanitasi XSS:** Konten warkah dan bait puisi disanitasi secara ketat di sisi server sebelum disimpan dan dirender sebagai teks murni (HTML Entity Encoding).
