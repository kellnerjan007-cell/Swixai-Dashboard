import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";

// GET: Token validieren (für die Seite)
export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token");
  if (!token) {
    return NextResponse.json({ error: "Token fehlt." }, { status: 400 });
  }

  const invite = await db.teamInvite.findUnique({
    where: { token },
    include: { workspace: true },
  });

  if (!invite || invite.expiresAt < new Date()) {
    return NextResponse.json({ error: "Dieser Einladungslink ist ungültig oder abgelaufen." }, { status: 400 });
  }

  return NextResponse.json({
    email: invite.email,
    workspaceName: invite.workspace.name,
    role: invite.role,
  });
}

// POST: Einladung annehmen – Account erstellen oder bestehendem Account beitreten
export async function POST(req: NextRequest) {
  const { token, name, password } = await req.json();

  if (!token) {
    return NextResponse.json({ error: "Token fehlt." }, { status: 400 });
  }

  const invite = await db.teamInvite.findUnique({
    where: { token },
    include: { workspace: true },
  });

  if (!invite || invite.expiresAt < new Date()) {
    return NextResponse.json({ error: "Dieser Einladungslink ist ungültig oder abgelaufen." }, { status: 400 });
  }

  let user = await db.user.findUnique({ where: { email: invite.email } });

  if (!user) {
    // Neuen Account erstellen
    if (!name || !password || password.length < 8) {
      return NextResponse.json(
        { error: "Name und Passwort (min. 8 Zeichen) erforderlich." },
        { status: 400 }
      );
    }
    const passwordHash = await bcrypt.hash(password, 12);
    user = await db.user.create({
      data: { email: invite.email, name, passwordHash },
    });
  }

  // Membership erstellen (falls noch nicht vorhanden)
  await db.membership.upsert({
    where: { userId_workspaceId: { userId: user.id, workspaceId: invite.workspaceId } },
    update: {},
    create: { userId: user.id, workspaceId: invite.workspaceId, role: invite.role },
  });

  await db.teamInvite.delete({ where: { id: invite.id } });

  return NextResponse.json({ ok: true, email: user.email });
}
