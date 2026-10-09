export async function sendOtpEmail(toEmail: string, otpCode: string, env: any = null): Promise<boolean> {
  const apiKey = (env && env.RESEND_API_KEY) || '';
  const fromEmail = (env && env.RESEND_FROM) || 'BERBIRRU.COM <noreply@berbirru.com>';

  if (!apiKey) {
    console.warn('RESEND_API_KEY is not configured in environment');
    return false;
  }

  const htmlContent = `
    <!DOCTYPE html>
    <html lang="id">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Kode Masuk OTP — BERBIRRU.COM</title>
    </head>
    <body style="margin:0;padding:24px 12px;background-color:#F0F6FE;font-family:-apple-system,BlinkMacSystemFont,'Plus Jakarta Sans','Segoe UI',Roboto,Helvetica,sans-serif;color:#0B192C;">
      <table align="center" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width:480px;background:#FFFFFF;border:3px solid #0B192C;border-radius:16px;box-shadow:5px 5px 0 #1E293B;overflow:hidden;">
        <!-- Header Brand -->
        <tr>
          <td style="background:#E0EEFD;padding:20px 24px;border-bottom:2px solid #0B192C;">
            <table border="0" cellpadding="0" cellspacing="0">
              <tr>
                <td style="background:#1D61E7;border:2px solid #0B192C;border-radius:10px;padding:6px 12px;">
                  <span style="font-family:'Space Grotesk',sans-serif;font-size:16px;font-weight:900;color:#FFFFFF;letter-spacing:0.5px;">BERBIRRU</span>
                </td>
                <td style="padding-left:6px;">
                  <span style="font-family:'Space Grotesk',sans-serif;font-size:20px;font-weight:900;color:#1D61E7;text-decoration:underline;text-decoration-color:#FDE047;">.com</span>
                </td>
              </tr>
            </table>
            <div style="font-size:11px;font-weight:700;color:#64748B;margin-top:6px;text-transform:uppercase;letter-spacing:0.5px;">Pustaka Tulisan &amp; Kolaborasi Kata</div>
          </td>
        </tr>

        <!-- Body Content -->
        <tr>
          <td style="padding:28px 24px;">
            <h3 style="margin:0 0 12px;font-size:20px;font-weight:800;color:#0B192C;line-height:1.3;">Kode Masuk Verifikasi</h3>
            <p style="margin:0 0 18px;font-size:14px;color:#334155;line-height:1.6;">
              Gunakan 6 digit kode OTP di bawah ini untuk masuk atau mengatur ulang akun <strong>BERBIRRU.COM</strong> Anda:
            </p>

            <!-- OTP Code Badge -->
            <table border="0" cellpadding="0" cellspacing="0" width="100%" style="margin:20px 0;">
              <tr>
                <td align="center">
                  <div style="display:inline-block;background:#FDE047;border:3px solid #0B192C;border-radius:12px;padding:14px 32px;box-shadow:4px 4px 0 #0B192C;letter-spacing:8px;font-family:'Space Grotesk',monospace;font-size:32px;font-weight:900;color:#0B192C;">
                    ${otpCode}
                  </div>
                </td>
              </tr>
            </table>

            <!-- Notice Box -->
            <div style="background:#F8FAFC;border-left:4px solid #1D61E7;border:1.5px solid #0B192C;border-left-width:4px;border-radius:8px;padding:12px 14px;margin-top:20px;">
              <p style="margin:0;font-size:12px;font-weight:600;color:#475569;line-height:1.5;">
                ⏱ <strong>Masa Berlaku:</strong> Kode ini hanya aktif selama <strong>10 menit</strong>. Jangan berikan kode ini kepada siapa pun demi keamanan karya Anda.
              </p>
            </div>
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="background:#0F172A;padding:18px 24px;border-top:2px solid #0B192C;text-align:center;">
            <p style="margin:0 0 4px;font-size:11.5px;font-weight:700;color:#CBD5E1;">
              © 2026 BERBIRRU.COM · Dirawat dengan rasa dan integritas karya.
            </p>
            <p style="margin:0;font-size:10.5px;color:#64748B;">
              Layanan Sastra Serverless &amp; Bebas Pelacak Pihak Ketiga
            </p>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;

  try {
    console.log(`[resend] Sending email from=${fromEmail} to=${toEmail} using key_len=${apiKey ? apiKey.length : 0}`);
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'User-Agent': 'Mozilla/5.0'
      },
      body: JSON.stringify({
        from: fromEmail,
        to: [toEmail],
        subject: `Kode Masuk OTP: ${otpCode} — BERBIRRU.COM`,
        html: htmlContent
      })
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error('[resend error]', res.status, errText);
    }
    return res.ok;
  } catch (err) {
    console.error('Resend OTP error:', err);
    return false;
  }
}
