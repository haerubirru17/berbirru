-- Satu pengajuan pencairan aktif per user (audit run-2 R2-10).
-- Race check-then-insert tidak lagi menghasilkan dua 'requested';
-- runner-up kena UNIQUE → handler menormalkan menjadi 409.
--
-- RUNBOOK PRODUKSI (review B): guard lama check-then-insert bisa meninggalkan
-- dua 'requested' per user pada data eksisting → CREATE UNIQUE INDEX akan GAGAL.
-- Precheck WAJIB sebelum apply:
--   SELECT user_id, COUNT(*) n FROM withdrawals WHERE status='requested'
--    GROUP BY user_id HAVING COUNT(*)>1;
-- Jika ada: normalisasi manual (keep requested_at terlama, sisanya → 'rejected'
-- + review_note 'dedup pramigrasi') setelah konfirmasi owner, BARU apply.
CREATE UNIQUE INDEX IF NOT EXISTS idx_wd_one_requested_user
  ON withdrawals(user_id) WHERE status = 'requested';
