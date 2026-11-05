import { escapeHtml } from '../lib/sanitize';
import type { AdminAuditModel } from '../lib/admin-social';

const fmtDate = (value: string) => {
  const d = new Date(value.includes('T') ? value : value.replace(' ', 'T') + 'Z');
  return Number.isNaN(d.getTime()) ? value : new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Jakarta' }).format(d) + ' WIB';
};

const label = (a: string) => a === 'post_quarantine' ? 'Karantina' : a === 'post_restore' ? 'Pulihkan' : a === 'user_suspend' ? 'Suspend' : a === 'user_reinstate' ? 'Pulihkan Akun' : a;

function row(cells: string[]): string {
  return `<tr><td>${cells.map((c) => `<span>${c}</span>`).join('')}</td></tr>`;
}

export function renderAdminAuditPage(m: AdminAuditModel): string {
  const warkahRows = m.warkah.map((a) => row([
    fmtDate(a.createdAt), label(a.action),
    `${escapeHtml(a.title)} <small>@${escapeHtml(a.author)}</small>`,
    escapeHtml(a.reason),
  ])).join('');
  const akunRows = m.akun.map((a) => row([
    fmtDate(a.createdAt), label(a.action),
    `@${escapeHtml(a.targetPen)} <small>oleh @${escapeHtml(a.actorPen)}</small>`,
    escapeHtml(a.reason),
  ])).join('');
  return `<!doctype html><html lang="id"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Jejak Tindakan | BERBIRRU</title><style>
*{box-sizing:border-box}body{margin:0;background:#f4f6fa;color:#182433;font:14px/1.45 system-ui}.top{display:flex;justify-content:space-between;align-items:center;padding:16px 24px;background:#fff;border-bottom:1px solid #dfe4ec}.top nav{display:flex;gap:8px;flex-wrap:wrap}a{color:inherit;text-decoration:none}.top a{padding:9px 12px;border:1px solid #ccd5e2;border-radius:6px;background:#fff}.main{max-width:900px;margin:auto;padding:28px 18px}h1{margin:0 0 4px}.sub{color:#667085;margin:0 0 22px}section{background:#fff;border:1px solid #dfe4ec;border-radius:9px;padding:18px;margin:14px 0}h2{font-size:16px;margin:0 0 12px}table{width:100%;border-collapse:collapse}td{padding:11px 0;border-top:1px solid #eef1f6;display:grid;gap:4px}td span:nth-child(1){font-size:12px;color:#667085}td span:nth-child(2){font-weight:750}td span:nth-child(4){font-size:12.5px;color:#344054}small{color:#667085;font-weight:400}.empty{color:#667085;padding:14px 0}.foot{color:#667085;font-size:11px;padding:10px 0 30px;text-align:center}
</style></head><body><header class="top"><b>BERBIRRU · SUPERADMIN SOSIAL</b><nav><a href="/admin">Dashboard</a><a href="/admin/posts">Warkah</a><a href="/admin/users">Akun</a><a href="/admin/audit">Jejak</a><a href="/owner">Buka Rekber</a></nav></header><main class="main"><h1>Jejak Tindakan</h1><p class="sub">Catatan moderasi sosial — hanya bisa bertambah, tidak bisa dihapus dari antarmuka.</p>
<section><h2>Warkah (maks. 20 terbaru)</h2>${warkahRows ? `<table><tbody>${warkahRows}</tbody></table>` : '<p class="empty">Belum ada tindakan moderasi warkah.</p>'}</section>
<section><h2>Akun (maks. 20 terbaru)</h2>${akunRows ? `<table><tbody>${akunRows}</tbody></table>` : '<p class="empty">Belum ada tindakan suspend/pulihkan akun.</p>'}</section>
<p class="foot">Read-only · Append-only · Tanpa tombol hapus/edit</p></main></body></html>`;
}
