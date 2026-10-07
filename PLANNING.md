# 📜 Rencana Implementasi Arsitektur Backend Berbirru (BERBIRRU.COM)

## 1. Stack & Runtime
- **Edge Runtime:** Cloudflare Workers (TypeScript)
- **API Framework:** Hono.js (Ultra-fast, lightweight HTTP routing)
- **Database:** Cloudflare D1 (Serverless SQLite on Edge)
- **Autentikasi:** Better-Auth (D1 Adapter) + Email OTP & Password
- **Keamanan:** Cloudflare Turnstile, Signed Cookies, Rate Limiting

---

## 2. Skema Database D1 (`schema.sql`)
1. `users` (id, email, password_hash, pen_name, city, bio, created_at)
2. `sessions` (id, user_id, token, expires_at, created_at)
3. `otps` (id, email, code_hash, attempts, expires_at, created_at)
4. `posts` (id, author_id, content, parent_id, likes_count, saves_count, chains_count, created_at)
5. `likes` (user_id, post_id, created_at, PRIMARY KEY(user_id, post_id))
6. `bookmarks` (user_id, post_id, created_at, PRIMARY KEY(user_id, post_id))
7. `follows` (follower_id, following_id, created_at, PRIMARY KEY(follower_id, following_id))

---

## 3. Struktur Endpoint API Backend
- **Auth Routes (`/api/auth/*`):**
  - `POST /api/auth/register` (Email, password, pen_name, city)
  - `POST /api/auth/login` (Email, password -> Adaptive OTP jika IP/perangkat baru)
  - `POST /api/auth/verify-otp` (Email, 6-digit OTP -> Issue session cookie)
  - `POST /api/auth/logout` (Revoke session)
  - `GET /api/auth/me` (Profile auth state)

- **Post & Feed Routes (`/api/posts/*`):**
  - `GET /api/posts?mode=viral|latest|following&q=search` (Feed dengan HackerNews gravity decay)
  - `POST /api/posts` (Goreskan warkah baru / sambung bait estafet)
  - `GET /api/posts/:id` (Detail warkah + rantai bait lengkap)
  - `POST /api/posts/:id/like` (Toggle 1-tap suka)
  - `POST /api/posts/:id/bookmark` (Toggle simpan)

- **User Profile Routes (`/api/users/*`):**
  - `GET /api/users/:pen_name` (Profil paspor + metrik)
  - `GET /api/users/:pen_name/posts?tab=original|likes|saved|chains`
  - `POST /api/users/:pen_name/follow` (Toggle follow)
