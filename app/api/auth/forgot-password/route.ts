import { NextRequest, NextResponse } from "next/server";
import { randomBytes } from "crypto";
import { db } from "@/lib/db";
import { sendPasswordResetEmail } from "@/lib/email";
import { rateLimit, getClientIp } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const { success } = rateLimit(getClientIp(req), 3, 60 * 60 * 1000); // 3 per hour
  if (!success) {
    return NextResponse.json(
      { error: "Zu viele Anfragen. Bitte in einer Stunde erneut versuchen." },
      { status: 429 }
    );
  }

  const body = await req.json();
  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";

  if (!email) {
    return NextResponse.json({ error: "E-Mail fehlt" }, { status: 400 });
  }

  // Always respond with success to prevent email enumeration
  const user = await db.user.findUnique({ where: { email } });
  if (!user) {
    return NextResponse.json({ success: true });
  }

  // Invalidate any existing tokens for this user
  await db.passwordResetToken.deleteMany({ where: { userId: user.id } });

  const token = randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

  await db.passwordResetToken.create({
    data: { userId: user.id, token, expiresAt },
  });

  const baseUrl = process.env.NEXTAUTH_URL ?? "http://localhost:3000";
  const resetUrl = `${baseUrl}/reset-password?token=${token}`;

  try {
    await sendPasswordResetEmail(user.email, resetUrl);
  } catch (err) {
    console.error("[FORGOT-PASSWORD] Email send failed:", err);
    // Don't leak the error to the client
  }

  return NextResponse.json({ success: true });
}
