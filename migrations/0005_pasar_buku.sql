-- Migration 0005: Pasar Buku (rekber) — listings, orders, ledger, withdrawals
-- Owner-approved design 2026-10-18. Fee rekber 5000/order ditanggung penjual; min withdraw 40000.

CREATE TABLE IF NOT EXISTS listings (
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
);
CREATE INDEX IF NOT EXISTS idx_listings_active ON listings(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_listings_seller ON listings(seller_id);

CREATE TABLE IF NOT EXISTS orders (
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
);
CREATE INDEX IF NOT EXISTS idx_orders_buyer ON orders(buyer_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_seller ON orders(seller_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status, created_at);

CREATE TABLE IF NOT EXISTS order_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  order_id TEXT NOT NULL,
  actor TEXT NOT NULL,                           -- buyer | seller | system | owner
  from_st TEXT,
  to_st TEXT NOT NULL,
  note TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_oe_order ON order_events(order_id, created_at DESC);

CREATE TABLE IF NOT EXISTS ledger (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL,
  order_id TEXT,
  delta INTEGER NOT NULL,                        -- +credit / -debit, rupiah
  kind TEXT NOT NULL,                            -- sale | fee | withdraw | refund
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_ledger_user ON ledger(user_id, created_at DESC);

CREATE TABLE IF NOT EXISTS withdrawals (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  amount INTEGER NOT NULL,                       -- yang dicairkan; min 40000
  status TEXT NOT NULL DEFAULT 'requested',      -- requested | paid | rejected
  requested_at TEXT NOT NULL DEFAULT (datetime('now')),
  paid_at TEXT
);
CREATE INDEX IF NOT EXISTS idx_wd_user ON withdrawals(user_id, requested_at DESC);
