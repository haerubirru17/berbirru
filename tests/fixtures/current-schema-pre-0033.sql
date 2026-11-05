-- Schema-only snapshot dari sandbox pre-0033; tanpa data dan objek internal D1.
PRAGMA foreign_keys = ON;

CREATE TABLE addresses (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  label TEXT,
  receiver TEXT NOT NULL,
  phone TEXT NOT NULL,
  postal TEXT NOT NULL,
  text TEXT NOT NULL,
  province_id TEXT, province_name TEXT,
  city_id TEXT, city_name TEXT,
  district_id TEXT, district_name TEXT,
  is_default INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT
);

CREATE TABLE bookmarks (
  user_id TEXT NOT NULL,
  post_id TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id, post_id),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE
);

CREATE TABLE follows (
  follower_id TEXT NOT NULL,
  following_id TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (follower_id, following_id),
  FOREIGN KEY (follower_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (following_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE ledger (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL,
  order_id TEXT,
  delta INTEGER NOT NULL,                        -- +credit / -debit, rupiah
  kind TEXT NOT NULL,                            -- sale | fee | withdraw | refund
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE likes (
  user_id TEXT NOT NULL,
  post_id TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id, post_id),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE
);

CREATE TABLE listing_reports (
  id TEXT PRIMARY KEY,
  listing_id TEXT NOT NULL,
  reporter_id TEXT NOT NULL,
  reason TEXT NOT NULL,                 -- mismatch | fraud | misleading | price | other
  note TEXT,
  status TEXT NOT NULL DEFAULT 'open',  -- open | ignored | removed
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  reviewed_at TEXT,
  review_note TEXT,
  reviewer_email TEXT
);

CREATE TABLE listings (
  id TEXT PRIMARY KEY,
  seller_id TEXT NOT NULL,
  title TEXT NOT NULL,
  author TEXT,
  descr TEXT,
  cond TEXT NOT NULL DEFAULT 'bekas',           -- baru | bekas_bagus | bekas_layak
  price INTEGER NOT NULL,                        -- rupiah, tanpa fee; fee dipotong saat settled
  shipping_flat INTEGER NOT NULL DEFAULT 0,      -- ongkir flat per listing (pembeli bayar)
  status TEXT NOT NULL DEFAULT 'active',         -- active | sold | hidden
  photos TEXT NOT NULL DEFAULT '[]',             -- JSON array r2 keys, max 5
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
, weight_g INTEGER NOT NULL DEFAULT 1000, couriers TEXT NOT NULL DEFAULT '["jne","jnt","sicepat"]', stock INTEGER NOT NULL DEFAULT 1 CHECK (stock >= 0 AND stock <= 999));

CREATE TABLE notifications (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  actor_id TEXT NOT NULL,
  type TEXT NOT NULL,
  post_id TEXT,
  is_read INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP, order_id TEXT,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (actor_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE
);

CREATE TABLE order_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  order_id TEXT NOT NULL,
  actor TEXT NOT NULL,                           -- buyer | seller | system | owner
  from_st TEXT,
  to_st TEXT NOT NULL,
  note TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE order_evidence (
  id TEXT PRIMARY KEY,
  order_id TEXT NOT NULL,
  uploader_id TEXT NOT NULL,
  role TEXT NOT NULL,              -- buyer | seller
  r2_key TEXT NOT NULL,
  note TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE orders (
  id TEXT PRIMARY KEY,
  listing_id TEXT NOT NULL,
  buyer_id TEXT NOT NULL,
  seller_id TEXT NOT NULL,
  price INTEGER NOT NULL,
  shipping INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'created',
  -- created → paid → shipped → completed | expired | canceled | disputed
  kesepakatan TEXT NOT NULL,                     -- kwitansi: kesepakatan serah terima (COD/antar/ekspedisi/ongkir), terkunci sejak dibayar
  handed_at TEXT,                                -- saat penjual tandai serah (basis auto-complete D+5)
  kurir TEXT,                                    -- nama kurir (-- hanya bila ekspedisi)
  resi TEXT,                                     -- nomor resi ekspedisi = bukti trackable pembeli + admin
  qris_order_id TEXT UNIQUE,                     -- order id utk klikqris
  qris_signature TEXT,
  qris_url TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
, qris_final_amount INTEGER, qris_expired_at TEXT, courier_code TEXT, courier_name TEXT, service TEXT, eta TEXT, dest_district_id TEXT, dest_district_name TEXT, dest_address TEXT, resi_verified INTEGER NOT NULL DEFAULT 0, resi_checked_at TEXT, resi_tries INTEGER NOT NULL DEFAULT 0, resi_try_at TEXT, receiver_name TEXT, receiver_phone TEXT, postal_code TEXT, resolution_note TEXT, resolved_at TEXT, refund_ref TEXT, refund_amount INTEGER, refunded_at TEXT, paid_with TEXT);

CREATE TABLE otps (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL,
  code_hash TEXT NOT NULL,
  attempts INTEGER DEFAULT 0,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE owner_actions (
  id TEXT PRIMARY KEY,
  owner_email TEXT NOT NULL,
  action TEXT NOT NULL,          -- seller_approve | seller_reject | dispute_refund | dispute_release | withdrawal_pay | withdrawal_reject | sweep
  target_type TEXT,              -- user | order | withdrawal | system
  target_id TEXT,
  note TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE posts (
  id TEXT PRIMARY KEY,
  author_id TEXT NOT NULL,
  content TEXT NOT NULL,
  title TEXT,
  parent_id TEXT, -- NULL for original warkah, or post_id for estafet chains
  likes_count INTEGER DEFAULT 0,
  saves_count INTEGER DEFAULT 0,
  chains_count INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, visibility TEXT NOT NULL DEFAULT 'public',
  FOREIGN KEY (author_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE VIRTUAL TABLE posts_fts USING fts5(
  id UNINDEXED,
  title,
  content_text,
  tokenize = 'trigram'
);

CREATE TABLE rate_limits (
  key TEXT PRIMARY KEY,
  count INTEGER NOT NULL DEFAULT 0,
  expires_at TIMESTAMP NOT NULL
);

CREATE TABLE reviews (
  id TEXT PRIMARY KEY,
  order_id TEXT NOT NULL UNIQUE,
  listing_id TEXT NOT NULL,
  seller_id TEXT NOT NULL,
  buyer_id TEXT NOT NULL,
  stars INTEGER NOT NULL,          -- 1..5
  body TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE seller_docs (
  user_id TEXT NOT NULL,
  kind TEXT NOT NULL,              -- ktp | bank
  r2_key TEXT NOT NULL,
  uploaded_at TEXT NOT NULL DEFAULT (datetime('now')),
  PRIMARY KEY (user_id, kind)
);

CREATE TABLE "sessions" (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  token TEXT,
  token_hash TEXT,
  ip_address TEXT,
  user_agent TEXT,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE sweep_meta (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  pen_name TEXT UNIQUE NOT NULL,
  city TEXT DEFAULT 'Nusantara',
  bio TEXT DEFAULT 'Goresan perenungan rasa dan bait kata.',
  -- 0 = menunggu bukti kepemilikan email (OTP). User lama = 1 (default migrasi 0002).
  email_verified INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
, avatar_key TEXT, cover_key TEXT, display_name TEXT, district_id TEXT, district_name TEXT, seller_status TEXT NOT NULL DEFAULT 'none', seller_full_name TEXT, seller_phone TEXT, seller_note TEXT, seller_applied_at TEXT, seller_reviewed_at TEXT, seller_reject_reason TEXT, shop_name TEXT, addr_receiver TEXT, addr_phone TEXT, addr_province_id TEXT, addr_province_name TEXT, addr_city_id TEXT, addr_city_name TEXT, addr_district_id TEXT, addr_district_name TEXT, addr_postal TEXT, addr_text TEXT, seller_review_note TEXT, seller_bank_name TEXT, seller_bank_account TEXT, shop_slug TEXT);

CREATE TABLE withdrawals (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  amount INTEGER NOT NULL,                       -- yang dicairkan; min 40000
  status TEXT NOT NULL DEFAULT 'requested',      -- requested | paid | rejected
  requested_at TEXT NOT NULL DEFAULT (datetime('now')),
  paid_at TEXT
, method TEXT NOT NULL DEFAULT 'qris', account TEXT NOT NULL DEFAULT '', review_note TEXT, transfer_ref TEXT, reviewed_at TEXT, fee INTEGER NOT NULL DEFAULT 0, kind TEXT NOT NULL DEFAULT 'seller', kode TEXT);

CREATE INDEX idx_addresses_default ON addresses(user_id, is_default);

CREATE INDEX idx_addresses_user ON addresses(user_id);

CREATE INDEX idx_evidence_order ON order_evidence(order_id, created_at);

CREATE UNIQUE INDEX idx_ledger_order_kind ON ledger(order_id, kind);

CREATE INDEX idx_ledger_user ON ledger(user_id, created_at DESC);

CREATE INDEX idx_listings_active ON listings(status, created_at DESC);

CREATE INDEX idx_listings_seller ON listings(seller_id);

CREATE INDEX idx_notif_order ON notifications(order_id);

CREATE INDEX idx_oe_order ON order_events(order_id, created_at DESC);

CREATE INDEX idx_orders_buyer ON orders(buyer_id, created_at DESC);

CREATE INDEX idx_orders_live_listing
  ON orders(listing_id, status) WHERE status IN ('created','paid','handed','disputed');

CREATE UNIQUE INDEX idx_orders_one_live_listing ON orders(listing_id) WHERE status IN ('created','paid','handed');

CREATE UNIQUE INDEX idx_orders_resi_unik
  ON orders(kurir, resi)
  WHERE resi IS NOT NULL AND status NOT IN ('expired', 'cancelled');

CREATE INDEX idx_orders_seller ON orders(seller_id, created_at DESC);

CREATE INDEX idx_orders_status ON orders(status, created_at);

CREATE INDEX idx_owner_actions_time ON owner_actions(created_at DESC);

CREATE INDEX idx_posts_author ON posts(author_id);

CREATE INDEX idx_posts_created ON posts(created_at DESC);

CREATE INDEX idx_posts_parent ON posts(parent_id);

CREATE INDEX idx_reports_open ON listing_reports(status, created_at DESC);

CREATE UNIQUE INDEX idx_reports_unik ON listing_reports(listing_id, reporter_id);

CREATE INDEX idx_reviews_seller ON reviews(seller_id, created_at DESC);

CREATE INDEX idx_sessions_token_hash ON sessions(token_hash);

CREATE INDEX idx_users_pen_name ON users(pen_name);

CREATE UNIQUE INDEX idx_users_shop_name
  ON users(shop_name COLLATE NOCASE) WHERE shop_name IS NOT NULL;

CREATE UNIQUE INDEX idx_users_shop_slug ON users(shop_slug) WHERE shop_slug IS NOT NULL;

CREATE UNIQUE INDEX idx_wd_kode ON withdrawals(kode);

CREATE UNIQUE INDEX idx_wd_one_requested_user
  ON withdrawals(user_id) WHERE status = 'requested';

CREATE INDEX idx_wd_user ON withdrawals(user_id, requested_at DESC);

CREATE TRIGGER addresses_max_five BEFORE INSERT ON addresses WHEN (SELECT COUNT(*) FROM addresses WHERE user_id = NEW.user_id) >= 5 BEGIN SELECT RAISE(ABORT, 'address_cap_exceeded'); END;
