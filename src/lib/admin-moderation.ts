import { stripTags } from './sanitize';

export type ModerationActor = { id: string; email: string };
export type TransitionResult =
  | { kind: 'ok'; status: 'visible' | 'quarantined'; actionId: string }
  | { kind: 'missing' }
  | { kind: 'conflict' };

async function transitionPost(
  db: D1Database,
  actor: ModerationActor,
  postId: string,
  reason: string,
  from: 'visible' | 'quarantined',
  to: 'visible' | 'quarantined',
): Promise<TransitionResult> {
  const post: any = await db.prepare(
    'SELECT id, title, content, moderation_status FROM posts WHERE id = ?'
  ).bind(postId).first();
  if (!post) return { kind: 'missing' };
  if (post.moderation_status !== from) return { kind: 'conflict' };

  const actionId = crypto.randomUUID();
  const action = to === 'quarantined' ? 'post_quarantine' : 'post_restore';
  const statements: D1PreparedStatement[] = [
    db.prepare(`UPDATE posts SET moderation_status = ?, moderation_reason = ?,
      moderated_at = datetime('now'), moderated_by = ?, moderation_action_id = ?
      WHERE id = ? AND moderation_status = ?`)
      .bind(to, reason, actor.id, actionId, postId, from),
    db.prepare(`DELETE FROM posts_fts WHERE id = ? AND EXISTS
      (SELECT 1 FROM posts WHERE id = ? AND moderation_status = ? AND moderation_action_id = ?)`)
      .bind(postId, postId, to, actionId),
  ];

  if (to === 'visible') {
    statements.push(db.prepare(`INSERT INTO posts_fts (id, title, content_text)
      SELECT id, ?, ? FROM posts
      WHERE id = ? AND moderation_status = 'visible' AND moderation_action_id = ?`)
      .bind(post.title || '', stripTags(post.content || ''), postId, actionId));
  }

  statements.push(db.prepare(`INSERT INTO social_admin_actions
    (id, actor_user_id, actor_email, action, target_post_id, from_status, to_status, reason, created_at)
    SELECT p.moderation_action_id, p.moderated_by, u.email, ?, p.id, ?, ?, p.moderation_reason, p.moderated_at
    FROM posts p JOIN users u ON u.id = p.moderated_by
    WHERE p.id = ? AND p.moderation_status = ? AND p.moderation_action_id = ?`)
    .bind(action, from, to, postId, to, actionId));

  const result: any[] = await db.batch(statements);
  if (!result[0]?.meta?.changes) return { kind: 'conflict' };
  return { kind: 'ok', status: to, actionId };
}

export const quarantinePost = (db: D1Database, actor: ModerationActor, postId: string, reason: string) =>
  transitionPost(db, actor, postId, reason, 'visible', 'quarantined');

export const restorePost = (db: D1Database, actor: ModerationActor, postId: string, reason: string) =>
  transitionPost(db, actor, postId, reason, 'quarantined', 'visible');
