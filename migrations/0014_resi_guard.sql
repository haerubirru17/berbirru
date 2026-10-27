-- Anti-resi-palsu: resi diverifikasi ke kurir saat penjual input, bukan menunggu 24 jam.
ALTER TABLE orders ADD COLUMN resi_verified INTEGER NOT NULL DEFAULT 0;
ALTER TABLE orders ADD COLUMN resi_checked_at TEXT;
ALTER TABLE orders ADD COLUMN resi_tries INTEGER NOT NULL DEFAULT 0;
ALTER TABLE orders ADD COLUMN resi_try_at TEXT;

-- Satu nomor resi tidak boleh dipakai dua pesanan hidup.
-- ponytail: partial index — resi dari order expired/batal boleh dipakai ulang (mis. penjual salah order kurir).
CREATE UNIQUE INDEX IF NOT EXISTS idx_orders_resi_unik
  ON orders(kurir, resi)
  WHERE resi IS NOT NULL AND status NOT IN ('expired', 'cancelled');
