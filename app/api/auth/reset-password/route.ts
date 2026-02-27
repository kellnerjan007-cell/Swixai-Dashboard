import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { rateLimit, getClientIp } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const { success } = rateLimit(getClientIp(req), 5, 60 * 60 * 1000);
  if (!success) {
    return NextResponse.json(
      { error: "Zu viele Versuche. Bitte warte eine Stunde." },
      { status: 429 }
    );
  }

  const body = await req.json();
  const { token, password } = body;

  if (!token || typeof token !== "string") {
    return NextResponse.json({ error: "Token fehlt" }, { status: 400 });
  }
  if (!password || typeof password !== "string" || password.length < 8) {
    return NextResponse.json(
      { error: "Passwort muss mindestens 8 Zeichen haben" },
      { status: 400 }
    );
  }

  const resetToken = await db.passwordResetToken.findUnique({ where: { token } });

  if (!resetToken || resetToken.expiresAt < new Date()) {
    return NextResponse.json(
      { error: "Link ungültig oder abgelaufen. Bitte erneut anfordern." },
      { status: 400 }
    );
  }

  const passwordHash = await bcrypt.hash(password, 12);

  await db.$transaction([
    db.user.update({
      where: { id: resetToken.userId },
      data: { passwordHash },
    }),
    db.passwordResetToken.delete({ where: { token } }),
  ]);

  return NextResponse.json({ success: true });
}
