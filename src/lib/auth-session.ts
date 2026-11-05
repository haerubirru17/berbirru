// Helper sesi login — dipakai password login dan verify-OTP (dua caller).
// TTL selalu 30 hari DI DALAM SQL; tidak ada parameter TTL (Task 2 plan akun).

export async function insertActiveLoginSession(db: D1Database, userId: string, tokenHash: string): Promise<D1Result> {
  return await db.prepare(
    `INSERT INTO sessions (id, user_id, token_hash, expires_at)
     SELECT ?, u.id, ?, datetime('now', '+30 days')
     FROM users u
     WHERE u.id = ? AND u.account_status = 'active'`
  ).bind(crypto.randomUUID(), tokenHash, userId).run();
}

// Batas sesi login paralel: simpan 4 terbaru. Baris artefak reset (rst_) dan
// OTP-flow (otpf_) TIDAK ikut dihitung/dihapus — cap hanya menyasar sesi login.
// Guard active: akun yang tepat disuspend tidak boleh "dipangkas" dua kali.
// Bentuk stmt (marker opsional) dipakai batch verify-OTP; helper .run() dipakai login.
export function capLoginSessionsStmt(db: D1Database, userId: string, marker?: string): D1PreparedStatement {
  const markerGuard = marker ? ' AND EXISTS (SELECT 1 FROM sessions mk WHERE mk.token = ? AND mk.user_id = ?)' : '';
  const binds: any[] = marker ? [userId, userId, userId, marker, userId] : [userId, userId, userId];
  return db.prepare(
    `DELETE FROM sessions
     WHERE user_id = ?
       AND token_hash IS NOT NULL
       AND token_hash NOT LIKE 'rst\\_%' ESCAPE '\\'
       AND token_hash NOT LIKE 'otpf\\_%' ESCAPE '\\'
       AND id NOT IN (
         SELECT id FROM sessions
         WHERE user_id = ?
           AND token_hash IS NOT NULL
           AND token_hash NOT LIKE 'rst\\_%' ESCAPE '\\'
           AND token_hash NOT LIKE 'otpf\\_%' ESCAPE '\\'
         ORDER BY created_at DESC LIMIT 4
       )
       AND EXISTS (SELECT 1 FROM users u WHERE u.id = ? AND u.account_status = 'active')${markerGuard}`
  ).bind(...binds);
}

export async function capLoginSessions(db: D1Database, userId: string): Promise<D1Result> {
  return await capLoginSessionsStmt(db, userId).run();
}
