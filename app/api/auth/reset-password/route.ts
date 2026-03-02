import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";

export async function POST(req: NextRequest) {
  const { token, password } = await req.json();

  if (!token || !password || password.length < 8) {
    return NextResponse.json(
      { error: "Token und Passwort (min. 8 Zeichen) erforderlich." },
      { status: 400 }
    );
  }

  const resetToken = await db.passwordResetToken.findUnique({ where: { token } });

  if (!resetToken || resetToken.expiresAt < new Date()) {
    return NextResponse.json(
      { error: "Dieser Link ist ungültig oder abgelaufen." },
      { status: 400 }
    );
  }

  const passwordHash = await bcrypt.hash(password, 12);

  await db.user.update({
    where: { id: resetToken.userId },
    data: { passwordHash },
  });

  await db.passwordResetToken.delete({ where: { id: resetToken.id } });

  return NextResponse.json({ ok: true });
}
