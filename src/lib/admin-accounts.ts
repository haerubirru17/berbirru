// Modul transisi akun — SATU batch atomic per aksi (plan §6.2–6.4).
// Interface HANYA suspendAccount/reinstateAccount; route (Task 6) memetakan
// 404/409/500. Moratorium: owner exclusion di SQL module, bukan hanya di route.

export async function suspendAccount(
  db: D1Database,
  targetId: string,
  reason: string,
  at: string,
  by: string,
  actorEmail: string,
  ownerEmail: string
): Promise<{ ok: boolean }> {
  const actionId = crypto.randomUUID();
  const result: any[] = await db.batch([
    // Hakim: transisi kondisional + owner exclusion di module (plan §6.2.1).
    db.prepare(
      `UPDATE users
       SET account_status='suspended', suspended_reason = ?, suspended_at = ?,
         suspended_by = ?, account_action_id = ?
       WHERE id = ? AND account_status = 'active'
         AND lower(email) <> lower(?)`
    ).bind(reason, at, by, actionId, targetId, ownerEmail),
    // Best-effort (0 sah): bersihkan seluruh sesi/artefak, guarded marker pemenang
    // — stale loser tidak bisa menyentuh sesi orang lain (plan §6.2.2, §6.4).
    db.prepare(
      `DELETE FROM sessions
       WHERE user_id = ?
         AND EXISTS (SELECT 1 FROM users u
           WHERE u.id = ? AND u.account_status = 'suspended' AND u.account_action_id = ?)`
    ).bind(targetId, targetId, actionId),
    // Audit guarded marker; error di sini = rollback penuh batch (D1 atomik).
    db.prepare(
      `INSERT INTO social_account_actions
         (id, action, target_user_id, actor_user_id, actor_email, reason, created_at)
       SELECT ?, 'user_suspend', u.id, ?, ?, ?, ?
       FROM users u
       WHERE u.id = ? AND u.account_status = 'suspended' AND u.account_action_id = ?`
    ).bind(actionId, by, actorEmail, reason, at, targetId, actionId),
  ]);
  // Otoritas = hakim + audit (guarded marker menjamin 1 bila hakim 1).
  // Tidak ada invariant-throw pasca commit (pelajaran R4 + review B W1).
  return { ok: result[0].meta.changes === 1 && result[2].meta.changes === 1 };
}

export async function reinstateAccount(
  db: D1Database,
  targetId: string,
  reason: string,
  at: string,
  by: string,
  actorEmail: string,
  ownerEmail: string
): Promise<{ ok: boolean }> {
  const actionId = crypto.randomUUID();
  const result: any[] = await db.batch([
    // Hakim: hanya suspended yang bisa dipulihkan; metadata suspend dibersihkan.
    db.prepare(
      `UPDATE users
       SET account_status='active', suspended_reason = NULL, suspended_at = NULL,
         suspended_by = NULL, account_action_id = ?
       WHERE id = ? AND account_status = 'suspended'
         AND lower(email) <> lower(?)`
    ).bind(actionId, targetId, ownerEmail),
    // Audit guarded; reinstate TIDAK menciptakan sesi/artefak (no revival).
    db.prepare(
      `INSERT INTO social_account_actions
         (id, action, target_user_id, actor_user_id, actor_email, reason, created_at)
       SELECT ?, 'user_reinstate', u.id, ?, ?, ?, ?
       FROM users u
       WHERE u.id = ? AND u.account_status = 'active' AND u.account_action_id = ?`
    ).bind(actionId, by, actorEmail, reason, at, targetId, actionId),
  ]);
  return { ok: result[0].meta.changes === 1 && result[1].meta.changes === 1 };
}
