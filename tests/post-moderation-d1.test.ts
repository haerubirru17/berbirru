// Real D1 fault proof for moderation batches. Run with R4_D1_PERSIST pointing at disposable state.
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync, rmSync } from 'node:fs';
import { join } from 'node:path';

const persist = process.env.R4_D1_PERSIST;
if (!persist) {
  console.log('SKIP — R4_D1_PERSIST tidak diset; jalankan eksplisit untuk real-D1 fault proof');
  process.exit(0);
}
const wrangler = join(process.cwd(), 'node_modules/.bin/wrangler');
const base = ['d1','execute','DB','--config','wrangler.uji.toml','--local','--persist-to',persist,'--json'];
const run = (sql: string) => JSON.parse(execFileSync(wrangler,[...base,'--command',sql],{encoding:'utf8'}));
const file = (sql: string, ok = true) => {
  const p = join(process.env.TMPDIR || '/tmp','r4-fault.sql'); writeFileSync(p,sql);
  try { execFileSync(wrangler,[...base.slice(0,-1),'--file',p],{encoding:'utf8',stdio:'pipe'}); if (!ok) assert.fail('fault batch seharusnya gagal'); }
  catch (e) { if (ok) throw e; }
  finally { rmSync(p,{force:true}); }
};
const id='55555555-5555-4555-8555-555555555555';
run(`INSERT INTO users(id,email,password_hash,pen_name) VALUES('fu','fu@x.invalid','x','fu'); INSERT INTO posts(id,author_id,title,content,moderation_status) VALUES('${id}','fu','Fault','body','visible'); INSERT INTO posts_fts(id,title,content_text) VALUES('${id}','Fault','body'),('${id}','dup','body')`);
const snapshot = () => run(`SELECT moderation_status,moderation_reason,moderation_action_id FROM posts WHERE id='${id}'; SELECT COUNT(*) n FROM posts_fts WHERE id='${id}'; SELECT COUNT(*) n FROM social_admin_actions WHERE target_post_id='${id}'`).map((x:any)=>x.results);
const before = JSON.stringify(snapshot());
for (const pos of [1,2,3]) {
  const aid=`fault-${pos}`;
  const stmts=[
    `UPDATE posts SET moderation_status='quarantined',moderation_reason='fault reason',moderated_at=datetime('now'),moderated_by='fu',moderation_action_id='${aid}' WHERE id='${id}' AND moderation_status='visible'`,
    `DELETE FROM posts_fts WHERE id='${id}' AND EXISTS(SELECT 1 FROM posts WHERE id='${id}' AND moderation_action_id='${aid}')`,
    `INSERT INTO social_admin_actions(id,actor_user_id,actor_email,action,target_post_id,from_status,to_status,reason,created_at) SELECT moderation_action_id,moderated_by,'fu@x.invalid','post_quarantine',id,'visible','quarantined',moderation_reason,moderated_at FROM posts WHERE id='${id}' AND moderation_action_id='${aid}'`,
  ];
  stmts.splice(pos,0,'INSERT INTO guaranteed_missing_r4_table VALUES(1)');
  file(stmts.join(';')+';',false);
  assert.equal(JSON.stringify(snapshot()),before,`fault posisi ${pos} wajib rollback penuh`);
}
console.log('OK — R4 D1 fault injection rollback penuh pada 3 posisi');
