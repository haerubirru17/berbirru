export interface Env {
  DB: D1Database;
  MEDIA: R2Bucket;
  APP_NAME: string;
  APP_DOMAIN: string;
  RESEND_API_KEY?: string;
  RESEND_FROM?: string;
  TURNSTILE_SITE_KEY?: string;
  TURNSTILE_SECRET_KEY?: string;
  KLIKQRIS_API_KEY?: string;
  KLIKQRIS_MERCHANT_ID?: string;
  KLIKQRIS_API_URL?: string;
  KLIKQRIS_CALLBACK_URL?: string;
  KLIKQRIS_MOCK?: string;
  // "1" = Pasar Buku ditutup (gate di index.ts) — hanya sandbox yang boleh "0".
  PASAR_TUTUP?: string;
  OWNER_EMAIL?: string;
  BINDERBYTE_KEY?: string;
  KURIR_MOCK?: string;
  KERN_THEME_PRESET?: string;
}
