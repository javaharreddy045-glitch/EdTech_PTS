const RESEND_API_URL = 'https://api.resend.com/emails';

export async function sendPasswordResetEmail(toEmail, resetUrl) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.warn('[mailer] RESEND_API_KEY not set; skipping password reset email.');
    return { sent: false };
  }

  try {
    const response = await fetch(RESEND_API_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: process.env.MAIL_FROM || 'PathToSkill <onboarding@resend.dev>',
        to: [toEmail],
        subject: 'Reset your PathToSkill password',
        html: `
          <p>We received a request to reset your PathToSkill password.</p>
          <p><a href="${resetUrl}">Reset your password</a></p>
          <p>This link expires soon and can only be used once. If you didn't request this, you can safely ignore this email.</p>
        `,
      }),
    });

    if (!response.ok) {
      const errorBody = await response.text().catch(() => '');
      console.error('[mailer] Resend API error:', response.status, errorBody);
      return { sent: false };
    }

    return { sent: true };
  } catch (err) {
    console.error('[mailer] Failed to send password reset email:', err.message);
    return { sent: false };
  }
}
