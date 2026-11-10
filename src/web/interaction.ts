// Lapisan interaksi global: hapus tap-highlight bawaan browser, beri press halus & konsisten.
// Di-injeksi ke SEMUA halaman HTML (neo & krem) lewat middleware index.ts.
// ponytail: satu sumber kebenaran, bukan edit 25 file halaman.

export const INTERACTION_CSS = `<style id="bb-interaction">
  /* Token yang dipakai lintas halaman tapi belum pernah didefinisikan: tanpa ini
     var() gagal dan deklarasinya DIBUANG (badge love jadi transparan, titik lonceng hilang). */
  :root { --accent-red: #E11D48; }
*{-webkit-tap-highlight-color:transparent}
html{touch-action:manipulation}
button,a,[role=button],input[type=submit],input[type=button],select,label{cursor:pointer}
button,a,[role=button],input[type=submit],input[type=button],
.act-btn,.t-btn,.tab-reddit-item,.mode-tab,.follow-action,.follow-remove,
.btn,.btn-tulis,.btn-publish-pill,.bnav-item,.nav-btn,.si{
  -webkit-user-select:none;user-select:none;
  transition:transform .08s ease,box-shadow .08s ease,filter .12s ease,opacity .08s ease,background-color .12s ease;
}
:where(button,[role=button],input[type=submit],input[type=button],.act-btn,.t-btn,
.follow-action,.follow-remove,.tab-reddit-item,.mode-tab,.btn,.btn-tulis,.btn-publish-pill):active{
  filter:brightness(.94);
}
a:active{opacity:.8}
:focus-visible{outline:2px solid currentColor;outline-offset:2px;border-radius:0}
@media (prefers-reduced-motion:reduce){*{transition:none!important;animation:none!important}}
</style>`;
