/**
 * POST /api/team/invite  → Send a team invite by email
 * DELETE /api/team/invite?id=  → Cancel a pending invite
 */

import { NextRequest, NextResponse } from "next/server";
import { randomBytes } from "crypto";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { getUserWorkspace } from "@/lib/workspace";
import { sendTeamInviteEmail } from "@/lib/email";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const workspace = await getUserWorkspace(session.user.id);
  if (!workspace) return NextResponse.json({ error: "No workspace" }, { status: 400 });

  // Only OWNER or ADMIN can invite
  const myMembership = await db.membership.findUnique({
    where: { userId_workspaceId: { userId: session.user.id, workspaceId: workspace.id } },
  });
  if (!myMembership || myMembership.role === "MEMBER") {
    return NextResponse.json({ error: "Keine Berechtigung zum Einladen" }, { status: 403 });
  }

  const { email, role = "MEMBER" } = await req.json() as { email?: string; role?: string };
  if (!email || typeof email !== "string") {
    return NextResponse.json({ error: "E-Mail fehlt" }, { status: 400 });
  }
  const normalizedEmail = email.trim().toLowerCase();

  // Check if already a member
  const existingMember = await db.membership.findFirst({
    where: { workspaceId: workspace.id, user: { email: normalizedEmail } },
  });
  if (existingMember) {
    return NextResponse.json({ error: "Diese Person ist bereits Mitglied" }, { status: 409 });
  }

  const token = randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

  await db.teamInvite.upsert({
    where: { workspaceId_email: { workspaceId: workspace.id, email: normalizedEmail } },
    update: { token, expiresAt, role: role as "OWNER" | "ADMIN" | "MEMBER", invitedById: session.user.id },
    create: {
      workspaceId: workspace.id,
      email: normalizedEmail,
      role: role as "OWNER" | "ADMIN" | "MEMBER",
      token,
      invitedById: session.user.id,
      expiresAt,
    },
  });

  const baseUrl = process.env.NEXTAUTH_URL ?? "http://localhost:3000";
  const inviteUrl = `${baseUrl}/join?token=${token}`;

  try {
    await sendTeamInviteEmail(
      normalizedEmail,
      session.user.name ?? session.user.email ?? "Jemand",
      workspace.name,
      inviteUrl
    );
  } catch (err) {
    console.error("[TEAM INVITE] Email send failed:", err);
    // Don't fail the request — invite is created, email just didn't send
  }

  return NextResponse.json({ success: true });
}

export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const workspace = await getUserWorkspace(session.user.id);
  if (!workspace) return NextResponse.json({ error: "No workspace" }, { status: 400 });

  const { searchParams } = new URL(req.url);
  const inviteId = searchParams.get("id");
  if (!inviteId) return NextResponse.json({ error: "id fehlt" }, { status: 400 });

  await db.teamInvite.deleteMany({
    where: { id: inviteId, workspaceId: workspace.id },
  });

  return NextResponse.json({ success: true });
}
