/**
 * POST /api/team/accept  → Accept a team invite (requires auth)
 * Body: { token: string }
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { token } = await req.json() as { token?: string };
  if (!token) return NextResponse.json({ error: "Token fehlt" }, { status: 400 });

  const invite = await db.teamInvite.findUnique({ where: { token } });

  if (!invite || invite.expiresAt < new Date()) {
    return NextResponse.json(
      { error: "Einladung ungültig oder abgelaufen" },
      { status: 400 }
    );
  }

  // Check email matches the logged-in user
  const user = await db.user.findUnique({ where: { id: session.user.id } });
  if (!user || user.email.toLowerCase() !== invite.email.toLowerCase()) {
    return NextResponse.json(
      { error: "Diese Einladung ist für eine andere E-Mail-Adresse" },
      { status: 403 }
    );
  }

  // Check not already a member
  const existing = await db.membership.findUnique({
    where: { userId_workspaceId: { userId: user.id, workspaceId: invite.workspaceId } },
  });
  if (existing) {
    await db.teamInvite.delete({ where: { token } });
    return NextResponse.json({ success: true, workspaceId: invite.workspaceId });
  }

  await db.$transaction([
    db.membership.create({
      data: {
        userId: user.id,
        workspaceId: invite.workspaceId,
        role: invite.role,
      },
    }),
    db.teamInvite.delete({ where: { token } }),
  ]);

  return NextResponse.json({ success: true, workspaceId: invite.workspaceId });
}
