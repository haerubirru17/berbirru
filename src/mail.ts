export async function sendMagicEmail(toEmail: string, magicUrl: string, env: any = null): Promise<boolean> {
  const apiKey = (env && env.RESEND_API_KEY) || '';
  const fromEmail = (env && env.RESEND_FROM) || 'BERBIRRU <onboarding@resend.dev>';

  if (!apiKey) {
    console.warn('RESEND_API_KEY is not configured in environment');
    return false;
  }

  const htmlContent = `
    <div style="font-family:'Plus Jakarta Sans',sans-serif;max-width:440px;margin:0 auto;padding:24px;border:3px solid #0B192C;border-radius:16px;background:#F0F6FE;">
      <h2 style="font-family:'Space Grotesk',sans-serif;color:#1D61E7;margin-bottom:8px;">BERBIRRU.COM</h2>
      <p style="font-size:14px;color:#334155;margin-bottom:16px;">Gunakan tautan di bawah ini untuk masuk ke akun pustaka Anda secara instan tanpa kata sandi:</p>
      <div style="text-align:center;margin:24px 0;">
        <a href="${magicUrl}" style="display:inline-block;padding:12px 24px;background:#1D61E7;color:#FFFFFF;text-decoration:none;font-weight:bold;border-radius:8px;border:2px solid #0B192C;box-shadow:3px 3px 0 #0B192C;">Masuk ke Berbirru</a>
      </div>
      <p style="font-size:12px;color:#64748B;margin-top:20px;">Tautan ini hanya berlaku selama 1 jam. Jika Anda tidak meminta tautan ini, abaikan surel ini.</p>
    </div>
  `;

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: fromEmail,
        to: [toEmail],
        subject: 'Tautan Masuk Instan — BERBIRRU.COM',
        html: htmlContent
      })
    });

    if (!res.ok) {
      const errData = await res.text();
      console.error('Resend API Error:', errData);
      return false;
    }
    return true;
  } catch (err) {
    console.error('Resend fetch exception:', err);
    return false;
  }
}
