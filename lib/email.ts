import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM = process.env.EMAIL_FROM ?? "noreply@swixai.com";
const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

export async function sendPasswordResetEmail(email: string, token: string) {
  const resetUrl = `${APP_URL}/reset-password?token=${token}`;

  await resend.emails.send({
    from: FROM,
    to: email,
    subject: "Passwort zurücksetzen – SwixAI",
    html: `
      <div style="font-family: -apple-system, sans-serif; max-width: 480px; margin: 0 auto; padding: 40px 24px; color: #111;">
        <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 32px;">
          <div style="width: 40px; height: 40px; background: #000; border-radius: 12px; display: flex; align-items: center; justify-content: center;">
            <span style="color: white; font-size: 18px;">🎙</span>
          </div>
          <span style="font-size: 22px; font-weight: 700;">SwixAI</span>
        </div>

        <h1 style="font-size: 22px; font-weight: 700; margin-bottom: 8px;">Passwort zurücksetzen</h1>
        <p style="color: #555; font-size: 15px; margin-bottom: 28px; line-height: 1.6;">
          Du hast eine Anfrage zum Zurücksetzen deines Passworts gestellt. Klicke auf den Button, um ein neues Passwort zu wählen.
        </p>

        <a href="${resetUrl}" style="display: inline-block; background: #000; color: #fff; text-decoration: none; padding: 12px 28px; border-radius: 10px; font-weight: 600; font-size: 15px; margin-bottom: 28px;">
          Passwort zurücksetzen
        </a>

        <p style="color: #888; font-size: 13px; margin-bottom: 8px;">
          Dieser Link ist <strong>1 Stunde</strong> gültig.
        </p>
        <p style="color: #888; font-size: 13px;">
          Falls du diese Anfrage nicht gestellt hast, kannst du diese E-Mail ignorieren.
        </p>

        <hr style="border: none; border-top: 1px solid #eee; margin: 32px 0;" />
        <p style="color: #bbb; font-size: 12px;">SwixAI – KI-gestützte Voice Agents</p>
      </div>
    `,
  });
}

export async function sendInviteEmail(
  email: string,
  token: string,
  workspaceName: string,
  inviterName: string
) {
  const inviteUrl = `${APP_URL}/accept-invite?token=${token}`;

  await resend.emails.send({
    from: FROM,
    to: email,
    subject: `${inviterName} hat dich zu ${workspaceName} eingeladen – SwixAI`,
    html: `
      <div style="font-family: -apple-system, sans-serif; max-width: 480px; margin: 0 auto; padding: 40px 24px; color: #111;">
        <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 32px;">
          <div style="width: 40px; height: 40px; background: #000; border-radius: 12px; display: flex; align-items: center; justify-content: center;">
            <span style="color: white; font-size: 18px;">🎙</span>
          </div>
          <span style="font-size: 22px; font-weight: 700;">SwixAI</span>
        </div>

        <h1 style="font-size: 22px; font-weight: 700; margin-bottom: 8px;">Du wurdest eingeladen!</h1>
        <p style="color: #555; font-size: 15px; margin-bottom: 28px; line-height: 1.6;">
          <strong>${inviterName}</strong> hat dich eingeladen, dem Workspace <strong>${workspaceName}</strong> auf SwixAI beizutreten.
        </p>

        <a href="${inviteUrl}" style="display: inline-block; background: #000; color: #fff; text-decoration: none; padding: 12px 28px; border-radius: 10px; font-weight: 600; font-size: 15px; margin-bottom: 28px;">
          Einladung annehmen
        </a>

        <p style="color: #888; font-size: 13px; margin-bottom: 8px;">
          Dieser Link ist <strong>7 Tage</strong> gültig.
        </p>
        <p style="color: #888; font-size: 13px;">
          Falls du diese Einladung nicht erwartet hast, kannst du diese E-Mail ignorieren.
        </p>

        <hr style="border: none; border-top: 1px solid #eee; margin: 32px 0;" />
        <p style="color: #bbb; font-size: 12px;">SwixAI – KI-gestützte Voice Agents</p>
      </div>
    `,
  });
}
