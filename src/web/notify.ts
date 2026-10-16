// Notifikasi Berbirru — pembungkus SweetAlert2 (vendor: /vendor/sweetalert2.js).
// bbToast = pengganti alert(); bbConfirm = pengganti confirm() (return Promise<boolean>).
// Gaya neobrutalism: border tinta 2px, radius 10px, shadow offset, font sistem app.

export const NOTIFY_HTML = `
<link rel="stylesheet" href="/vendor/sweetalert2.css">
<script src="/vendor/sweetalert2.js" defer></script>
<style>
  /* ==== SweetAlert2 :: neobrutalism Berbirru ==== */
  .swal2-popup { border: 2px solid #0B192C !important; border-radius: 10px !important; box-shadow: 4px 4px 0 rgba(11,25,44,0.9) !important; font-family: 'Poppins', system-ui, sans-serif !important; }
  .swal2-title { font-family: 'Space Grotesk', sans-serif !important; font-size: 16px !important; font-weight: 800 !important; color: #0B192C !important; }
  .swal2-html-container { font-size: 13px !important; font-weight: 600 !important; color: #334155 !important; }
  .swal2-styled.swal2-confirm, .swal2-styled.swal2-deny, .swal2-styled.swal2-cancel { border: 2px solid #0B192C !important; border-radius: 8px !important; font-weight: 800 !important; font-size: 13px !important; box-shadow: 2px 2px 0 #0B192C !important; transition: transform 0.06s, box-shadow 0.06s; }
  .swal2-styled.swal2-confirm:active, .swal2-styled.swal2-deny:active, .swal2-styled.swal2-cancel:active { transform: translate(2px,2px); box-shadow: 0 0 0 #0B192C !important; }
  .swal2-styled.swal2-confirm { background: #1D61E7 !important; color: #FFF !important; }
  .swal2-styled.swal2-confirm.swal-btn-danger { background: #DC2626 !important; }
  .swal2-styled.swal2-deny, .swal2-styled.swal2-cancel { background: #FFF !important; color: #0B192C !important; }
  .swal2-toast { border: 2px solid #0B192C !important; border-radius: 10px !important; box-shadow: 3px 3px 0 rgba(11,25,44,0.9) !important; background: #FFF !important; margin-bottom: 70px !important; }
  .swal2-timer-progress-bar { background: #1D61E7 !important; }
  .swal2-success-ring { border-color: #059669 !important; }
  .swal2-icon.swal2-warning { border-color: #D97706 !important; color: #D97706 !important; }
  .swal2-icon.swal2-error { border-color: #DC2626 !important; color: #DC2626 !important; }
  .swal2-icon.swal2-success { border-color: #059669 !important; color: #059669 !important; }
  .swal2-icon.swal2-info { border-color: #1D61E7 !important; color: #1D61E7 !important; }
</style>
<script>
  function _swalReady(fn) {
    if (window.Swal) return fn();
    window.addEventListener('load', fn);
  }
  function bbToast(msg, type) {
    _swalReady(function () {
      window.Swal.fire({
        toast: true, position: 'bottom', showConfirmButton: false,
        timer: 2600, timerProgressBar: true,
        icon: type || 'success', title: msg,
        stopKeydownPropagation: false
      });
    });
  }
  function bbConfirm(text, opts) {
    opts = opts || {};
    return new Promise(function (resolve) {
      _swalReady(function () {
        window.Swal.fire({
          title: opts.title || 'Yakin?',
          html: text || '',
          icon: opts.icon || 'warning',
          showCancelButton: true,
          confirmButtonText: opts.confirmText || 'Ya, lanjutkan',
          cancelButtonText: opts.cancelText || 'Batal',
          confirmButtonColor: opts.danger ? '#DC2626' : '#1D61E7',
          customClass: { confirmButton: opts.danger ? 'swal-btn-danger' : '' },
          focusCancel: true,
          reverseButtons: true
        }).then(function (r) { resolve(!!r.isConfirmed); });
      });
    });
  }
  window.bbToast = bbToast; window.bbConfirm = bbConfirm;
</script>`;

// Catatan a11y: Swal punya role=dialog + aria-live bawaan; toast timers auto-dismiss.
