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

1. **Hashing Kata Sandi:**
   - Menggunakan algoritma **Scrypt / Argon2id** dengan *cost parameter* standar OWASP via Web Crypto API.
2. **Manajemen Sesi:**
   - Diterbitkan dalam bentuk cryptographically random tokens (256-bit entropy).
   - Cookie disetel dengan atribut: `HttpOnly`, `Secure`, `SameSite=Strict`, `Path=/`.
3. **Adaptive Step-Up OTP:**
   - Kode OTP 6-digit dihasilkan menggunakan CSPRNG (`crypto.getRandomValues`).
   - Hash OTP disimpan di D1 dengan batas masa berlaku 5 menit dan *maximum 5 attempts* sebelum *locked out*.

---

## 4. Validasi Keamanan Otomatis (Pre-Deploy Security Gate)

Setiap rilis kode ke produksi `https://berbirru.com` wajib melewati uji validasi keamanan otomatis:
```bash
# Uji kepatuhan skema & sanitasi kode
node ~/.hermes/skills/security/security-audit/validate-findings.cjs
```
