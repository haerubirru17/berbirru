export async function sendMagicEmail(toEmail: string, magicUrl: string, env: any = null): Promise<boolean> {
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
      <title>Tautan Masuk Instan — BERBIRRU.COM</title>
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
            <h3 style="margin:0 0 12px;font-size:20px;font-weight:800;color:#0B192C;line-height:1.3;">Tautan Masuk Instan</h3>
            <p style="margin:0 0 16px;font-size:14px;color:#334155;line-height:1.6;">
              Halo Sahabat Pena! Anda menerima surel ini karena meminta tautan masuk langsung tanpa kata sandi ke akun <strong>BERBIRRU.COM</strong>.
            </p>

            <!-- Call to Action Button -->
            <table border="0" cellpadding="0" cellspacing="0" width="100%" style="margin:24px 0;">
              <tr>
                <td align="center">
                  <a href="${magicUrl}" style="display:inline-block;background:#1D61E7;color:#FFFFFF;font-size:14px;font-weight:800;text-decoration:none;padding:14px 28px;border-radius:10px;border:2.5px solid #0B192C;box-shadow:3px 3px 0 #0B192C;">
                    Masuk ke Bilik Warkah &rarr;
                  </a>
                </td>
              </tr>
            </table>

            <!-- Notice Box -->
            <div style="background:#F8FAFC;border-left:4px solid #FDE047;border:1.5px solid #0B192C;border-left-width:4px;border-radius:8px;padding:12px 14px;margin-top:20px;">
              <p style="margin:0;font-size:12px;font-weight:600;color:#475569;line-height:1.5;">
                ⏱ <strong>Masa Berlaku:</strong> Tautan ini hanya dapat digunakan satu kali dalam kurun waktu <strong>1 jam</strong>. Jika bukan Anda yang meminta, abaikan surel ini.
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
