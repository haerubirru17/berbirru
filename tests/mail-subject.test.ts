// Guard regresi (vuln-0001 verify3): kode OTP JANGAN pernah bocor ke subject email.
// Kode hanya boleh ada di body HTML. Runnable: npm test
import { sendOtpEmail } from '../src/mail.ts';

let captured: any = null;
(globalThis as any).fetch = async (url: string, opts: any) => {
  captured = { url, body: JSON.parse(opts.body) };
  return { ok: true, status: 200, text: async () => '{"id":"test"}' };
};

const kode = '483920';
await sendOtpEmail('victim@example.com', kode, { RESEND_API_KEY: 're_test_dummy' });

const subject: string = captured.body.subject;
const html: string = captured.body.html;
if (subject.includes(kode)) throw new Error(`GAGAL: OTP bocor di subject "${subject}"`);
if (!html.includes(kode)) throw new Error('GAGAL: OTP hilang dari body email');
if (!captured.body.to.includes('victim@example.com')) throw new Error('GAGAL: penerima berubah');

console.log('OK — subject bersih dari OTP, body tetap kirim kode:', `"${subject}"`);
