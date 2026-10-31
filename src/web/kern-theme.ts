// Global Kern editorial preset, injected only by the sandbox worker.
export const KERN_THEME_HTML = `<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin><link href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght,SOFT,WONK@9..144,100..900,0..100,0..1&family=Recursive:slnt,wght,CASL,CRSV,MONO@-15..0,300..1000,0..1,0..1,0..1&family=Roboto+Flex:opsz,slnt,wdth,wght,GRAD@8..144,-10..0,25..151,100..1000,-200..150&display=swap" rel="stylesheet"><style id="kern-theme">
:root{--kern-paper:#EFEBE3;--kern-card:#F6F3EB;--kern-ink:#0E0E0E;--kern-muted:#6E6A63;--kern-line:#D8D2C4;--kern-accent:#FF3B1A;--ink:var(--kern-ink);--ink-soft:#3A3733;--muted:var(--kern-muted);--line-soft:var(--kern-line);--blue:var(--kern-accent);--blue-deep:var(--kern-ink);--accent:var(--kern-accent);--paper:var(--kern-paper);--white:var(--kern-card);--bg-main:var(--kern-paper);--bg-card:var(--kern-card);--bg-blue-subtle:#E6E1D5;--shadow-offset:0 0 0;--radius:0;--radius-sm:0;--border-w:1px;--font-ui:'Roboto Flex',Arial,sans-serif;color-scheme:light}
html,body{background:var(--kern-paper)!important;color:var(--kern-ink)!important;font-family:'Roboto Flex',Arial,sans-serif!important}
body *{box-shadow:none!important;border-radius:0!important}
body :is(h1,h2,h3,.title,.page-title,.thread-title){font-family:'Fraunces',Georgia,serif!important;color:var(--kern-ink)}
body :is(p,label,.muted,.subtitle,.description){color:inherit}
body :is(header,.top-nav,.bnav,nav,.feed-sticky){background:var(--kern-paper)!important;border-color:var(--kern-ink)!important}
body :is(.bnav,.top-nav){box-shadow:none!important}
body :is(.card,.panel,article,.thread-card,.ak-card,.notif-card,.st-card,.product-card,.order-card,.form-card,.checkout-card,.listing-card){background:var(--kern-card)!important;border-color:var(--kern-ink)!important}
body :is(button,.btn,a.button,input[type=submit],input[type=button]){border-radius:0!important;box-shadow:none!important;font-family:'Recursive',monospace!important}
body :is(input,select,textarea){background:var(--kern-card)!important;color:var(--kern-ink)!important;border-color:var(--kern-ink)!important;border-radius:0!important;box-shadow:none!important}
body :is(.bnav-item.is-on,.mode-tab.active,.tab.active){color:var(--kern-ink)!important}
body :is(.bnav-item.is-on .bnav-lbl,.mode-tab.active,.tab.active){background:var(--kern-ink)!important;color:var(--kern-paper)!important;border-color:var(--kern-ink)!important;box-shadow:none!important}
body :is(.btn-primary,.button-primary,.btn-submit,.pf-go,.btn-buy){background:var(--kern-ink)!important;color:var(--kern-paper)!important;border-color:var(--kern-ink)!important}
body .bnav-plus .p{background:var(--kern-accent)!important;color:var(--kern-ink)!important;border:1px solid var(--kern-ink)!important;box-shadow:none!important}
body .bnav-plus .p svg{stroke:var(--kern-ink)!important}
body :is(.badge,.count-badge,.notif-dot){border-color:var(--kern-accent)!important}
/* Existing marketplace and account components inherit the same editorial skin. */
body :is(.book-card,.sell-card,.detail-card,.buy-row,.rekber-note,.empty-state,.admstrip,.lap,.card,.panel,.form-card,.order-card,.listing-card){background:var(--kern-card)!important;border:1px solid var(--kern-ink)!important;color:var(--kern-ink)!important}
body :is(.card-img,.card-img-empty){background:#E6E1D5!important;border-bottom:1px solid var(--kern-ink)!important}
body :is(.card-price,.nav-item.active,.nav-item.is-on,.price,.price-value){color:var(--kern-ink)!important}
body :is(.cond-badge,.btn-yellow,.chip.on){background:var(--kern-ink)!important;color:var(--kern-paper)!important;border:1px solid var(--kern-ink)!important}
body :is(.form-input,.pf-q,.pf-max,.pf-sel,.pf-go,.pager a,.pager .off,.btn-jual,.chip,.btn-buy){border-width:1px!important;box-shadow:none!important;border-radius:0!important}
body :is(.bottom-navbar,.navbar-inner){background:var(--kern-paper)!important;border-color:var(--kern-ink)!important;box-shadow:none!important}
body .bnav{border-top:1px solid var(--kern-ink)!important}
body .bnav .bnav-item.is-on,body .bnav .bnav-item.is-on svg{color:var(--kern-ink)!important;stroke:var(--kern-ink)!important}
body .bnav .bnav-item.is-on .bnav-lbl{background:transparent!important;color:var(--kern-ink)!important;border-color:transparent!important;box-shadow:none!important}
body :is(.btn-primary,.pf-go,.btn-buy){background:var(--kern-ink)!important;color:var(--kern-paper)!important;border-color:var(--kern-ink)!important}
body :is(.brand-badge,.pasar-top,.market-header){box-shadow:none!important}
body .brand-badge{background:transparent!important;border:0!important;border-radius:0!important;transform:none!important;padding:0!important;color:var(--kern-ink)!important}
body .brand-badge h1{font:800 19px 'Roboto Flex',Arial,sans-serif!important;color:var(--kern-ink)!important}
body .brand-badge svg{stroke:var(--kern-ink)!important}
body .brand-com-tag{background:transparent!important;color:var(--kern-accent)!important;transform:none!important}
body .brand-com-tag::after{display:none!important}
body .act-btn.active svg,.act-btn.saved svg{fill:var(--kern-accent)!important;stroke:var(--kern-accent)!important}
body .act-btn.active,body .act-btn.saved{background:transparent!important;border-color:transparent!important}
/* Feed page: kontrol khas beranda diasah mengikuti skin aktif. */
body:has(#feedContainer) :is(.feed-search input,.feed-search button,.mode-tab,.trigger-create-card,.trigger-pen-btn){border:1px solid var(--kern-ink)!important;border-radius:0!important;box-shadow:none!important;transform:none!important}
body:has(#feedContainer) .feed-search input{background:var(--kern-card)!important;color:var(--kern-ink)!important}
body:has(#feedContainer) :is(.feed-search button,.mode-tab.active){background:var(--kern-ink)!important;color:var(--kern-paper)!important}
body:has(#feedContainer) .mode-tabs{border-bottom:1px solid var(--kern-ink)!important}
body:has(#feedContainer) .trigger-create-card{background:var(--kern-card)!important;padding:12px 14px 12px 70px!important;margin-bottom:12px!important}
body:has(#feedContainer) .trigger-avatar-clip{background:var(--kern-card)!important;color:var(--kern-ink)!important;border:1px solid var(--kern-ink)!important;border-radius:0!important;box-shadow:none!important;transform:none!important}
body:has(#feedContainer) .trigger-pen-btn{background:var(--kern-accent)!important;color:var(--kern-ink)!important}
/* Skeleton editorial hanya saat skin Kern aktif. */
body .skeleton-card{background:transparent!important;border:0!important;border-bottom:1px solid var(--kern-ink)!important;box-shadow:none!important;margin:0!important}
body .sk-row{border-top:1px solid var(--kern-ink)!important;border-bottom:1px solid var(--kern-ink)!important}
body :is(.sk-avatar,.sk-line,.sk-pill){background:#D8D2C7!important;border-radius:0!important}
body .sk-footer{border-top:1px solid var(--kern-ink)!important}
body :is(hr,.divider){border-color:var(--kern-ink)!important}
/* Sisa komponen neobrutal lain: dipipihkan mengikuti skin aktif (layout tetap). */
body :is(.mcard.lift,.quote,.step.lift,.tava,DETAILS,.st-card,.verif.gate,.state,.al-tambah,.ak-ic){border-width:1px!important;border-color:var(--kern-ink)!important;box-shadow:none!important}
body :is(.mcard,.st-card){background:var(--kern-card)!important}
body .quote{background:transparent!important}
body :is(.verif.gate,.state,.al-tambah){background:var(--kern-ink)!important;color:var(--kern-paper)!important}
body :is(.verif.gate *,.state *){color:inherit!important}
body :is(.inp,.fld){border-width:1px!important;border-color:var(--kern-ink)!important;background:var(--kern-card)!important;color:var(--kern-ink)!important;box-shadow:none!important}
body .empty{background:transparent!important;border:0!important;border-top:1px solid var(--kern-ink)!important;box-shadow:none!important}
body .fld input,.fld select,.fld textarea{border-width:1px!important;background:var(--kern-paper)!important}
/* Landing: elemen marketing diasah ke editorial; bezel .phone tetap sebagai ilustrasi perangkat. */
body :is(.pill,.marquee,.lembar-wrap,.tcard,.step .foot>div){border-width:1px!important;border-color:var(--kern-ink)!important}
body .marquee{background:var(--kern-card)!important;color:var(--kern-ink)!important}
body .pill{background:var(--kern-card)!important;color:var(--kern-ink)!important}
body :is(.lembar-wrap,.tcard,.step .foot>div){background:var(--kern-card)!important;color:var(--kern-ink)!important}
/* Notifications: editorial rules, not framed neobrutal cards (including the JS empty state). */
body:has(#notifListContainer) .top-header{margin:0 -14px 16px;padding:0 14px 12px;border-bottom:1px solid var(--kern-ink)}
body:has(#notifListContainer) .brand-badge{background:transparent!important;border:0!important;padding:0!important;color:var(--kern-ink)!important;transform:none!important}
body:has(#notifListContainer) .brand-badge h1{font:800 19px 'Roboto Flex',Arial,sans-serif!important;color:var(--kern-ink)!important}
body:has(#notifListContainer) .brand-badge svg{stroke:var(--kern-ink)!important}
body:has(#notifListContainer) .brand-com-tag{transform:none!important;font:700 18px 'Roboto Flex',Arial,sans-serif!important;color:var(--kern-accent)!important;margin-left:3px!important}
body:has(#notifListContainer) .brand-com-tag::after{display:none!important}
body:has(#notifListContainer) .notif-section-row{padding-bottom:9px;border-bottom:1px solid var(--kern-ink);margin-bottom:0}
body:has(#notifListContainer) .notif-section-label{font:500 10px 'Recursive',monospace!important;letter-spacing:.06em;color:var(--kern-muted)!important}
body:has(#notifListContainer) .btn-mark-read-small{font:500 10px 'Recursive',monospace!important;color:var(--kern-ink)!important}
body:has(#notifListContainer) .notif-list{gap:0}
body:has(#notifListContainer) #notifListContainer>div:not(.notif-card){background:transparent!important;border:0!important;border-bottom:1px solid var(--kern-ink)!important;border-radius:0!important;box-shadow:none!important;padding:24px 12px!important;text-align:left!important;font:400 16px/1.4 'Fraunces',Georgia,serif!important;color:var(--kern-ink)!important}
body:has(#notifListContainer) .notif-card{background:transparent!important;border:0!important;border-bottom:1px solid var(--kern-ink)!important;border-radius:0!important;box-shadow:none!important;margin:0 -14px;padding:14px!important;color:var(--kern-ink)!important}
body:has(#notifListContainer) .notif-card.unread{border-left:2px solid var(--kern-accent)!important;background:var(--kern-card)!important}
body:has(#notifListContainer) .notif-avatar{background:var(--kern-card)!important;border:1px solid var(--kern-ink)!important;color:var(--kern-ink)!important;font-family:'Fraunces',Georgia,serif!important}
body:has(#notifListContainer) .notif-text{color:var(--kern-ink)!important;font-weight:500!important}
body:has(#notifListContainer) .notif-quote-preview{background:transparent!important;border-left:1px solid var(--kern-ink)!important;color:var(--kern-muted)!important}
body:has(#notifListContainer) .hub-link{background:transparent!important;border:1px solid var(--kern-ink)!important;color:var(--kern-ink)!important;box-shadow:none!important}
    /* ===== Kern profile skin (mockup kern-profile-final, markup/handler tetap) ===== */
    :root{--kpaper:#EFEBE3;--ksurface:#F6F3EB;--kink:#0E0E0E;--kmuted:#6E6A63;--ksignal:#FF3B1A;--kmono:'Recursive',Consolas,monospace;--kserif:'Fraunces',Georgia,serif}
    .profile-card{margin-bottom:0 !important;background:transparent !important;border:0 !important;box-shadow:none !important;border-radius:0 !important}
    .cover-banner{height:63px !important;background:var(--kpaper) !important;border-bottom:1px solid var(--kink) !important;cursor:default !important}
    .kern-profile-brand{display:flex;align-items:center;gap:7px;position:absolute;top:15px;left:16px;text-decoration:none;color:var(--kink);font:700 14px 'Roboto Flex',Arial,sans-serif;z-index:11}
    .kern-brand-mark{font:900 24px 'Roboto Flex',Arial,sans-serif;letter-spacing:-.14em}
    .kern-brand-mark::before{content:'●';color:var(--ksignal);font-size:8px;vertical-align:top;margin-right:2px}
    .banner-floating-nav{justify-content:flex-end !important}
    .banner-floating-nav .nav-btn-glass{display:none !important}
    .profile-eyebrow{display:block;text-align:right;font:500 9px var(--kmono);letter-spacing:.07em;text-transform:uppercase;color:var(--kmuted);margin-top:13px}
    .profile-cover-photo{height:68px;margin-top:12px;background-position:center;background-repeat:no-repeat;background-size:contain}
    .profile-cover-photo.has-cover{height:auto;aspect-ratio:16/9}
    .profile-meta-wrap .profile-eyebrow{text-align:left}
    .profile-meta-wrap .profile-since{display:none}
    .profile-meta-wrap .profile-right-actions{top:0;right:0}
    .profile-meta-wrap .city-badge-top{padding:0 !important}
    .profile-meta-wrap:has(.profile-cover-photo.has-cover) .avatar-action-row{margin-top:0 !important}
    .profile-meta-wrap:has(.profile-cover-photo.has-cover) .pen-name-group{margin-top:0 !important}
    .profile-meta-wrap:has(.profile-cover-photo.has-cover) .bio-box{min-height:0 !important;margin-bottom:8px !important}
    .profile-meta-wrap:has(.profile-cover-photo.has-cover) .stats-inline{margin-top:8px !important}
    .profile-cover-photo[role=button]{cursor:pointer}
    .profile-tab-total{margin-left:auto;align-self:center;white-space:nowrap;color:var(--kmuted);font:500 9px var(--kmono);text-transform:uppercase}
    .feed-list .profile-empty{background:transparent!important;border:0!important;border-top:1px solid var(--kink)!important;border-radius:0!important;box-shadow:none!important;margin:0;padding:24px 16px!important;text-align:left!important;color:var(--kmuted);font:500 13px/1.5 'Roboto Flex',Arial,sans-serif!important}
    .profile-since{display:block;text-align:right;min-height:12px;font:500 9px var(--kmono);letter-spacing:.07em;text-transform:uppercase;color:var(--ksignal);margin-top:81px}
    .profile-liked-count{display:block;position:absolute;right:0;bottom:-15px;text-align:right;min-height:15px;font:500 9px var(--kmono);text-transform:uppercase;letter-spacing:.05em;color:var(--kmuted);margin-top:0}
    .banner-floating-nav{top:12px !important;left:12px !important;right:12px !important}
    .nav-btn-glass,.nav-menu-glass{background:transparent !important;border:1px solid var(--kink) !important;border-radius:0 !important;box-shadow:none !important;color:var(--kink) !important;font:600 9px var(--kmono) !important;text-transform:uppercase !important;letter-spacing:.06em !important;padding:6px 10px !important}
    .nav-menu-glass{width:30px !important;height:30px !important;padding:0 !important}
    .cover-edit-badge{display:none !important}
    .settings-popover{background:var(--ksurface) !important;border:1px solid var(--kink) !important;border-radius:0 !important;box-shadow:none !important}
    .settings-item{border-radius:0 !important;color:var(--kink) !important;font:600 11px var(--kmono) !important;text-transform:uppercase !important}
    .settings-item:hover,.settings-item:active{background:var(--kpaper) !important;color:var(--kink) !important}
    .profile-meta-wrap{position:relative;padding-bottom:0 !important}
    .avatar-action-row{display:block !important;margin:14px 0 0 !important;height:0 !important;overflow:visible}
    .profile-right-actions{position:absolute;top:0;right:0;margin:0 !important}
    .city-badge-top{background:transparent !important;border:0 !important;box-shadow:none !important;color:var(--kmuted) !important;padding:0 !important;font:500 10px var(--kmono) !important;text-transform:uppercase !important;letter-spacing:.06em !important;border-radius:0 !important}
    .avatar-wrapper{position:absolute !important;right:16px !important;bottom:12px !important;z-index:3}
    .avatar-box{width:84px !important;height:84px !important;background-color:var(--ksurface) !important;color:var(--kink) !important;border:1px solid var(--kink) !important;border-radius:0 !important;box-shadow:none !important;font-family:var(--kserif) !important;font-size:34px !important}
    .media-edit-badge{border-radius:0 !important;box-shadow:none !important;background:var(--kpaper) !important;border:1px solid var(--kink) !important}
    .btn-follow-badge{position:absolute !important;left:-14px !important;right:auto !important;top:50% !important;bottom:auto !important;transform:translateY(-50%) !important;width:27px !important;height:27px !important;background:var(--ksignal) !important;color:var(--kink) !important;border:1px solid var(--kink) !important;border-radius:0 !important;box-shadow:none !important}
    .btn-follow-badge.is-following{background:var(--kink) !important;color:var(--kpaper) !important}
    .btn-follow-badge.is-following svg{stroke:var(--kpaper) !important}
    .pen-name-group{margin:12px 0 2px !important}
    .pen-name{font-family:var(--kserif) !important;font-size:40px !important;font-weight:550 !important;letter-spacing:-.05em !important;line-height:.95 !important;color:var(--kink) !important;font-variation-settings:'opsz' 60,'wght' 550,'SOFT' 40,'WONK' 1}
    .display-name-main{display:none !important}
    .bio-box{font-family:var(--kserif) !important;font-size:19px !important;line-height:1.4 !important;color:var(--kink) !important;font-weight:430 !important;min-height:54px !important;margin-bottom:36px !important;max-width:430px !important}
    .stats-inline{display:flex !important;justify-content:flex-start !important;gap:40px !important;margin:14px -14px 0 !important;padding:10px 16px !important;padding-right:112px !important;border-top:1px solid var(--kink) !important;border-bottom:1px solid var(--kink) !important;position:relative;z-index:1}
    .si{display:flex !important;flex-direction:column !important;align-items:flex-start !important;gap:3px !important}
    .si svg{display:none !important}
    .si b{font-family:var(--kserif) !important;font-size:20px !important;font-weight:560 !important;letter-spacing:-.03em !important}
    .si::after{content:attr(title);font:500 8.5px var(--kmono) !important;text-transform:uppercase !important;letter-spacing:.05em !important;color:var(--kmuted) !important}
    .profile-tabs-reddit{border-bottom:1px solid var(--kink) !important;margin:0 -14px 0 !important;padding:10px 16px !important;justify-content:flex-start !important;gap:6px !important}
    .tab-reddit-item{border:1px solid var(--kink) !important;padding:6px 9px !important;font:500 9px var(--kmono) !important;text-transform:uppercase !important;letter-spacing:.04em !important;color:var(--kink) !important;background:transparent !important}
    .tab-reddit-item.active{background:var(--kink) !important;color:var(--kpaper) !important}
    .tab-reddit-item.active::after{display:none !important}
    .thread-card{background:transparent !important;border:0 !important;border-bottom:1px solid var(--kink) !important;border-radius:0 !important;box-shadow:none !important;margin:0 -14px !important;padding-left:14px !important;padding-right:14px !important;margin-top:0 !important}
    .feed-list{gap:10px !important}
    .feed-list .thread-card{background:var(--ksurface) !important}
    .thread-card:last-child{border-bottom:0 !important}
    .thread-header-soft{background:transparent !important;border-top:1px solid var(--kink) !important;border-bottom:1px solid var(--kink) !important;border-radius:0 !important;margin:0 -14px !important;padding:7px 12px !important}
    .paperclip-svg{display:none !important}
    .thread-avatar-clip{position:static !important;flex:none !important;width:40px !important;height:40px !important;margin-right:8px !important;background-color:var(--ksurface) !important;color:var(--kink) !important;border:1px solid var(--kink) !important;border-radius:0 !important;box-shadow:none !important;transform:none !important;font-family:var(--kserif) !important}
    .thread-avatar-clip[style*="background-image"]{color:transparent !important}
    .thread-author-wrap{margin-right:auto !important}
    .thread-title{font-family:var(--kserif) !important;color:var(--kink) !important;font-size:30px !important;line-height:1 !important;letter-spacing:-.05em !important;font-variation-settings:'opsz' 50,'wght' 550,'SOFT' 40,'WONK' 1}
    .thread-text{color:var(--kink) !important}
    .thread-footer{background:transparent !important;border-top:1px solid var(--kink) !important;border-radius:0 !important}
    .act-btn,.chain-btn{background:transparent !important;border:0 !important;border-radius:0 !important;box-shadow:none !important;color:var(--kink) !important;font:500 9px var(--kmono) !important;text-transform:uppercase !important}
    .act-btn.active,.act-btn.saved{color:var(--ksignal) !important}
    .chain-split{background:transparent !important;border:0 !important;box-shadow:none !important}
    .follow-sheet{background:var(--kpaper) !important;border:1px solid var(--kink) !important;border-bottom:0 !important;box-shadow:none !important}
    .follow-sheet-head{border-bottom:1px solid var(--kink) !important}
    .follow-sheet-title{font-family:var(--kserif) !important}
    .follow-sheet-close{border:1px solid var(--kink) !important;background:transparent !important;box-shadow:none !important;border-radius:0 !important}
    .follow-switch{border:1px solid var(--kink) !important;background:transparent !important}
    .follow-switch button{background:transparent !important;color:var(--kmuted) !important;font:500 10px var(--kmono) !important;text-transform:uppercase !important}
    .follow-switch button.active{background:var(--kink) !important;color:var(--kpaper) !important}
    .follow-avatar{border:1px solid var(--kink) !important;background:var(--ksurface) !important;color:var(--kink) !important;border-radius:0 !important;font-family:var(--kserif) !important}
    .follow-row{border-bottom:1px solid var(--kink) !important}
    .follow-action{border:1px solid var(--kink) !important;background:var(--kink) !important;color:var(--kpaper) !important;box-shadow:none !important;border-radius:0 !important;font:600 10px var(--kmono) !important;text-transform:uppercase !important}
    .edit-modal h3{font-family:var(--kserif) !important}
    .edit-modal input{font:700 13px var(--kmono) !important;border:1px solid var(--kink) !important;border-radius:0 !important;background:var(--ksurface) !important}
    .bnav-plus .p{background:var(--ksignal) !important;border:1px solid var(--kink) !important;box-shadow:none !important}
    .pen-name::first-letter{color:var(--ksignal)}
    .thread-body{padding-top:12px !important;padding-bottom:10px !important}
    .thread-title{font-size:27px !important}
    .thread-footer{padding-top:8px !important;padding-bottom:8px !important}
    body:has(.profile-card){padding:0 0 90px !important}
    body:has(.profile-card) .container{width:100% !important;max-width:540px !important}
    .profile-card .stats-inline{margin-left:-16px !important;margin-right:-16px !important}
    .profile-tabs-reddit,.feed-list .thread-card{margin-left:0 !important;margin-right:0 !important}
    .feed-list .thread-header-soft{margin-left:-14px !important;margin-right:-14px !important}
@media(prefers-reduced-motion:reduce){*,*::before,*::after{scroll-behavior:auto!important;animation-duration:.01ms!important;animation-iteration-count:1!important;transition-duration:.01ms!important}}
</style>`;

export function applyKernTheme(html: string): string {
  if (!/<html\b/i.test(html) || !/<head\b/i.test(html)) return html;
  return html.replace(/<\/head\s*>/i, `${KERN_THEME_HTML}</head>`);
}

// Skin pilihan user (cookie) > preset env (showroom sandbox). Cookie hanya 'kern'/'neo' —
// nilai lain diabaikan. Default produksi = neo (tanpa injeksi apa pun).
export const SKIN_COOKIE = 'bb_skin';
export function wantsKern(cookieHeader: string | undefined, envPreset: string | undefined): boolean {
  const m = /(?:^|;\s*)bb_skin=(kern|neo)(?:;|$)/.exec(cookieHeader || '');
  if (m) return m[1] === 'kern';
  return envPreset === 'kern';
}
