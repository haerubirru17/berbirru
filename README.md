# 🌊 BERBIRRU.COM — Pustaka Tulisan & Kolaborasi Kata

> **Platform Web Sastra & Kolaborasi Sastra Pemuda di Edge Cloudflare**
> Live Domain: [berbirru.com](https://berbirru.com)

---

## 🏛️ Arsitektur Teknologi (Backend First)
- **Edge Framework:** Hono.js di atas Cloudflare Workers
- **Database:** Cloudflare D1 (Serverless SQLite)
- **Autentikasi:** Better-Auth (Adaptive Email Password & 6-Digit OTP)
- **Routing:** Full REST API dengan subsecond edge latency

---

## 📁 Struktur Repositori
```
/
├── PLANNING.md         # Rencana Arsitektur & Spesifikasi Detail Backend
├── schema.sql          # Skema Database D1 (Users, Posts, Chains, Likes, Bookmarks)
├── wrangler.toml       # Konfigurasi Cloudflare Workers & Custom Domain
├── package.json        # Dependencies (Hono, TypeScript, Wrangler)
└── src/
    └── index.ts        # Entrypoint API Routing Hono
```

---

## 🚀 Status Fase Pengembangan
- [x] **Fase 1 (Pondasi):** Inisialisasi Arsitektur, Skema D1 SQLite, & Git Repository.
- [x] **Fase 2 (Autentikasi):** Login/Register Password Hashed, Sesi Cookie 30 Hari, & Magic Link.
- [x] **Fase 3 (Mesin Konten):** Feed Menggema (Gravity Decay), Estafet Bait, 1-Tap Terpaut/Simpan.
- [x] **Fase 4 (Profil & Personalisasi):** Paspor Penulis Dinamis, Edit Bio/Kota, & Menu Aksi Popover.
- [x] **Fase 5 (UI & Live Edge):** Antarmuka SSR Neobrutalisme Biru + Live di Cloudflare Workers.

---

## 🎯 Rencana Fase Lanjutan (Tahap 2: Polish & Scale)
1. **Custom Domain Binding:** Mengaitkan worker ke domain utama `https://berbirru.com`.
2. **Social Card Generator:** Auto-render warkah menjadi gambar SVG/PNG untuk share ke Instagram/X.
3. **Turnstile Bot Guard:** Proteksi anti-bot spam pada pendaftaran & penerbitan warkah.
