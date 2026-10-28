// Kartu warkah — markup & CSS disalin dari feed produksi (src/web/feed.ts)
// supaya tampilan warkah di landing identik dengan linimasa asli.
// Interaksi (like/simpan/sambung) tidak diduplikasi; kartu di landing adalah pratinjau.

export const WARKAH_CARD_CSS = `
  .wf{color:#0B192C;--wf-ink:#0B192C;--wf-blue:#1D61E7;--wf-card:#FFFFFF;--wf-soft:#EFF6FF;--wf-yellow:#FFD43B;--wf-shadow:#1E293B}
  .wf .thread-card{background:var(--wf-card);border:3px solid var(--wf-ink);border-radius:0;box-shadow:4px 4px 0 var(--wf-shadow);overflow:visible;position:relative;height:100%;min-width:0;display:flex;flex-direction:column}
  .wf .thread-header-soft{background:var(--wf-soft);padding:8px 12px 8px 68px;display:flex;justify-content:space-between;align-items:center;border-bottom:2px solid var(--wf-ink);position:relative;min-height:44px;gap:8px;min-width:0}
  .wf .thread-avatar-clip{position:absolute;left:10px;top:-14px;width:48px;height:50px;background:var(--wf-blue);color:#fff;border:3px solid var(--wf-ink);border-radius:0;display:grid;place-items:center;font-family:'Newsreader',serif;font-size:24px;font-weight:700;transform:rotate(-2deg);z-index:5}
  .wf .paperclip-svg{position:absolute;top:-10px;right:-7px;width:18px;height:28px;z-index:6;transform:rotate(18deg);filter:drop-shadow(1px 1px 0 rgba(0,0,0,.25))}
  .wf .thread-author-info{display:flex;flex-direction:column;line-height:1.25}
  .wf .thread-pen-name{font-size:13px;font-weight:800;color:var(--wf-ink);text-decoration:none}
  .wf .thread-city{font-size:10px;font-weight:700;color:#64748B}
  .wf .thread-timestamp-stack{display:flex;flex-direction:column;align-items:flex-end;line-height:1.25}
  .wf .time-main{font-size:11px;font-weight:800;color:var(--wf-ink)}
  .wf .date-sub{font-size:9.5px;font-weight:700;color:#64748B}
  .wf .thread-body{padding:14px 14px 12px;flex:1;display:flex;flex-direction:column}
  .wf .thread-title{font-family:'Newsreader',serif;font-size:17px;font-weight:600;color:var(--wf-ink);margin-bottom:6px;line-height:1.3}
  .wf .thread-text{font-size:14px;font-weight:600;line-height:1.6;color:#0F172A;flex:1}
  .wf .thread-footer{padding:8px 10px;background:#fff;display:flex;justify-content:space-between;align-items:center;border-top:2px solid var(--wf-ink);gap:6px;flex-wrap:nowrap;overflow:hidden;margin-top:auto}
  .wf .actions-left{display:flex;gap:4px;flex-shrink:1;min-width:0}
  .wf .act-btn{cursor:pointer;touch-action:manipulation;color:var(--wf-ink);background:#FAFAFA;border:2px solid var(--wf-ink);border-radius:8px;padding:0 8px;height:30px;font-size:11px;font-weight:800;display:inline-flex;align-items:center;justify-content:center;gap:4px;min-width:0;overflow:hidden;white-space:nowrap}
  .wf .act-btn{position:relative}
  .wf .act-in{position:absolute;inset:0;width:100%;height:100%;margin:0;opacity:0;cursor:pointer;z-index:2;-webkit-tap-highlight-color:transparent}
  .wf .act-btn:active{transform:translate(1px,1px);box-shadow:none}
  .wf .act-btn:has(.act-in:checked),.wf .act-btn[data-on]{background:#EF4444;color:#fff;border-color:var(--wf-ink)}
  .wf .act-btn:has(.act-in:checked) .ico,.wf .act-btn[data-on] .ico{fill:#fff;stroke:#fff}
  .wf .act-btn[data-act=save]:has(.act-in:checked),.wf .act-btn[data-act=save][data-on]{background:var(--wf-blue)}
  .wf .act-btn.active{background:#EF4444;color:#fff;border-color:var(--wf-ink)}
  .wf .act-btn.active .ico{fill:#fff;stroke:#fff}
  .wf .act-btn.saved{background:var(--wf-blue);color:#fff;border-color:var(--wf-ink)}
  .wf .act-btn.saved .ico{fill:#fff;stroke:#fff}
  .wf .act-btn .ico{width:13px;height:13px;stroke:var(--wf-ink);fill:none;stroke-width:2;flex:0 0 auto}
  .wf .chain-btn{background:var(--wf-yellow);border:2px solid var(--wf-ink);border-radius:8px;padding:0 10px;height:30px;font-size:11px;font-weight:900;color:var(--wf-ink);text-decoration:none;display:inline-flex;align-items:center;justify-content:center;gap:4px;box-shadow:1.5px 1.5px 0 var(--wf-shadow);flex:0 0 auto;white-space:nowrap}
  .wf .wf-empty{background:#fff;border:3px solid var(--wf-ink);border-radius:16px;padding:24px;text-align:center;font-weight:700;box-shadow:4px 4px 0 var(--wf-shadow)}
`;

const AV_COLORS = ['#1D61E7', '#0F3E99', '#059669', '#D97706', '#7C3AED', '#DB2777', '#0891B2', '#4F46E5'];

function esc(v: any): string {
  return String(v ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function stripTags(v: any): string {
  return String(v ?? '').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
}

export function avatarColor(name: any): string {
  const str = String(name || '');
  let sum = 0;
  for (let i = 0; i < str.length; i++) sum += str.charCodeAt(i) * (i + 1);
  return AV_COLORS[sum % AV_COLORS.length];
}

function stamp(created: any): { time: string; date: string } {
  const d = new Date(String(created ?? '').replace(' ', 'T') + 'Z');
  if (isNaN(d.getTime())) return { time: '--.--', date: '—' };
  const time = new Intl.DateTimeFormat('id-ID', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    timeZone: 'Asia/Jakarta',
  }).format(d).replace(':', '.') + ' WIB';
  const date = new Intl.DateTimeFormat('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: 'Asia/Jakarta',
  }).format(d);
  return { time, date };
}

export function renderWarkahCard(p: any, opts: { hideStats?: boolean; timeLabel?: string; dateLabel?: string } = {}): string {
  const t = opts.timeLabel || opts.dateLabel ? { time: opts.timeLabel || '', date: opts.dateLabel || '' } : stamp(p.created_at);
  const body = esc(stripTags(p.content));
  return `<div class="thread-card">
            <div class="thread-header-soft">
              <div class="thread-avatar-clip" style="background:${avatarColor(p.pen_name)}">
                ${esc(String(p.pen_name || 'D').slice(0, 1).toUpperCase())}
                <svg class="paperclip-svg" viewBox="0 0 24 24" fill="none" stroke="#CBD5E1" stroke-width="2.5" aria-hidden="true"><path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/></svg>
              </div>
              <div class="thread-author-wrap">
                <div class="thread-author-info">
                  <a href="/u/${esc(p.pen_name)}" class="thread-pen-name">@${esc(p.pen_name)}</a>
                  <span class="thread-city">${esc(p.city || 'Nusantara')}</span>
                </div>
              </div>
              <div class="thread-timestamp-stack"><span class="time-main">${t.time}</span><span class="date-sub">${t.date}</span></div>
            </div>
            <div class="thread-body">
              ${p.title ? `<h3 class="thread-title">${esc(p.title)}</h3>` : ''}
              <div class="thread-text">${body}</div>
            </div>
            <div class="thread-footer">
              <div class="actions-left">
                <label class="act-btn" data-act="like"${p.is_liked ? ' data-on' : ''}><input type="checkbox" class="act-in" aria-label="Sukai warkah"${p.is_liked ? ' checked' : ''}><svg class="ico" viewBox="0 0 24 24" aria-hidden="true"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg><span>${opts.hideStats ? '' : Number(p.likes_count || 0)}</span></label>
                <label class="act-btn" data-act="save"${p.is_saved ? ' data-on' : ''}><input type="checkbox" class="act-in" aria-label="Simpan warkah"${p.is_saved ? ' checked' : ''}><svg class="ico" viewBox="0 0 24 24" aria-hidden="true"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg><span>${opts.hideStats ? '' : Number(p.saves_count || 0)}</span></label>
              </div>
              <a class="chain-btn" href="${p.id ? `/chain/${esc(p.id)}` : `/u/${esc(p.pen_name)}`}"><svg class="ico" viewBox="0 0 24 24" aria-hidden="true" style="width:12px;height:12px;stroke:#0B192C;fill:none;stroke-width:2.4"><path d="M12 5v14M5 12h14"/></svg>${opts.hideStats ? 'Sambung Bait' : `${Number(p.chains_count || 0)} Sambungan`}</a>
            </div>
          </div>`;
}

export const WARKAH_EMPTY = `<div class="wf-empty">Belum ada warkah publik. Jadilah yang pertama menggoreskan bait!</div>`;
