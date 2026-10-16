// Vendor statis ter-commit (bukan CDN — CSP ketat + deterministik).
// Sumber: sweetalert2 v11.26.25 dist minified (MIT). Update = timpa file txt.
// ponytail: di-serve apa adanya; kalau nanti butuh vendor lain, generalisasi jadi map {nama: isi}.
import sweetalert2Min from './web/vendor/sweetalert2.min.js.txt';
import sweetalert2Css from './web/vendor/sweetalert2.min.css.txt';

export const VENDOR_SWEETALERT2_JS: string = sweetalert2Min;
export const VENDOR_SWEETALERT2_CSS: string = sweetalert2Css;
