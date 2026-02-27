/**
 * Email utility using Resend (https://resend.com)
 * Set RESEND_API_KEY in your environment variables.
 * Without the key, emails are logged to console (dev fallback).
 */

const FROM = "SwixAI <noreply@swixai.com>";

async function sendEmail({
  to,
  subject,
  html,
}: {
  to: string;
  subject: string;
  html: string;
}) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.log("[EMAIL] No RESEND_API_KEY set — would have sent:", { to, subject });
    return;
  }

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ from: FROM, to, subject, html }),
  });

  if (!res.ok) {
    const err = await res.text();
    console.error("[EMAIL] Resend error:", err);
    throw new Error("E-Mail konnte nicht gesendet werden");
  }
}

export async function sendPasswordResetEmail(to: string, resetUrl: string) {
  await sendEmail({
    to,
    subject: "Passwort zurücksetzen – SwixAI",
    html: `
      <div style="font-family:sans-serif;max-width:560px;margin:0 auto;padding:32px">
        <h1 style="font-size:24px;font-weight:700;color:#111">Passwort zurücksetzen</h1>
        <p style="color:#555;margin:16px 0">
          Du hast eine Anfrage zum Zurücksetzen deines Passworts gestellt.
          Klicke auf den Button, um ein neues Passwort festzulegen:
        </p>
        <a href="${resetUrl}"
           style="display:inline-block;background:#000;color:#fff;padding:12px 24px;border-radius:10px;text-decoration:none;font-weight:600;margin:8px 0">
          Passwort zurücksetzen
        </a>
        <p style="color:#999;font-size:13px;margin-top:24px">
          Der Link ist 1 Stunde gültig. Falls du diese Anfrage nicht gestellt hast,
          kannst du diese E-Mail ignorieren.
        </p>
        <hr style="border:none;border-top:1px solid #eee;margin:24px 0"/>
        <p style="color:#bbb;font-size:12px">SwixAI · Voice AI Platform</p>
      </div>
    `,
  });
}
