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

## 🚀 Rencana Fase Implementasi
- [x] **Fase 1:** Planning Arsitektur Backend, Skema Database D1, dan Git Init.
- [ ] **Fase 2:** Implementasi Otentikasi Better-Auth + D1 & Adaptif OTP.
- [ ] **Fase 3:** Implementasi Engine Feed Viral (HackerNews Decay Formula) & Estafet Bait.
- [ ] **Fase 4:** Implementasi Profil Paspor, Bookmark, dan Suka 1-Tap.
- [ ] **Fase 5:** Integrasi Antarmuka Frontend Neobrutalisme Biru & Deployment ke `berbirru.com`.
