-- Satu pengajuan pencairan aktif per user (audit run-2 R2-10).
-- Race check-then-insert tidak lagi menghasilkan dua 'requested';
-- runner-up kena UNIQUE → handler menormalkan menjadi 409.
CREATE UNIQUE INDEX IF NOT EXISTS idx_wd_one_requested_user
  ON withdrawals(user_id) WHERE status = 'requested';
