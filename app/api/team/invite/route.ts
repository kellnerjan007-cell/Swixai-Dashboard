import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { db } from "@/lib/db";
import { requireAuth, getCurrentWorkspace } from "@/lib/session";
import { sendInviteEmail } from "@/lib/email";

export async function POST(req: NextRequest) {
  let session;
  try {
    session = await requireAuth();
  } catch {
    return NextResponse.json({ error: "Nicht angemeldet." }, { status: 401 });
  }

  const { email, role } = await req.json();

  if (!email || typeof email !== "string") {
    return NextResponse.json({ error: "E-Mail erforderlich." }, { status: 400 });
  }

  const workspace = await getCurrentWorkspace(session.user.id);
  if (!workspace) {
    return NextResponse.json({ error: "Kein Workspace gefunden." }, { status: 404 });
  }

  // Prüfen ob der einladende Nutzer OWNER oder ADMIN ist
  const membership = await db.membership.findUnique({
    where: { userId_workspaceId: { userId: session.user.id, workspaceId: workspace.id } },
  });
  if (!membership || (membership.role !== "OWNER" && membership.role !== "ADMIN")) {
    return NextResponse.json({ error: "Keine Berechtigung." }, { status: 403 });
  }

  // Prüfen ob Nutzer bereits Mitglied ist
  const existingUser = await db.user.findUnique({ where: { email: email.toLowerCase() } });
  if (existingUser) {
    const existingMembership = await db.membership.findUnique({
      where: { userId_workspaceId: { userId: existingUser.id, workspaceId: workspace.id } },
    });
    if (existingMembership) {
      return NextResponse.json({ error: "Diese Person ist bereits Mitglied." }, { status: 409 });
    }
  }

  // Alten Invite-Token löschen
  await db.inviteToken.deleteMany({
    where: { workspaceId: workspace.id, email: email.toLowerCase() },
  });

  const token = crypto.randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 Tage

  await db.inviteToken.create({
    data: {
      workspaceId: workspace.id,
      email: email.toLowerCase(),
      token,
      role: role ?? "MEMBER",
      invitedById: session.user.id,
      expiresAt,
    },
  });

  await sendInviteEmail(
    email,
    token,
    workspace.name,
    session.user.name ?? session.user.email ?? "Jemand"
  );

  return NextResponse.json({ ok: true });
}
