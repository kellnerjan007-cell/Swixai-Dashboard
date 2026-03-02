/**
 * DELETE /api/team/members?id=<membershipId>  → Remove a team member
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { getUserWorkspace } from "@/lib/workspace";

export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const workspace = await getUserWorkspace(session.user.id);
  if (!workspace) return NextResponse.json({ error: "No workspace" }, { status: 400 });

  // Only OWNER or ADMIN can remove members
  const myMembership = await db.membership.findUnique({
    where: { userId_workspaceId: { userId: session.user.id, workspaceId: workspace.id } },
  });
  if (!myMembership || myMembership.role === "MEMBER") {
    return NextResponse.json({ error: "Keine Berechtigung" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const membershipId = searchParams.get("id");
  if (!membershipId) return NextResponse.json({ error: "id fehlt" }, { status: 400 });

  const target = await db.membership.findFirst({
    where: { id: membershipId, workspaceId: workspace.id },
  });
  if (!target) return NextResponse.json({ error: "Mitglied nicht gefunden" }, { status: 404 });

  // Cannot remove the OWNER
  if (target.role === "OWNER") {
    return NextResponse.json({ error: "Der Workspace-Inhaber kann nicht entfernt werden" }, { status: 403 });
  }

  // Cannot remove yourself
  if (target.userId === session.user.id) {
    return NextResponse.json({ error: "Du kannst dich nicht selbst entfernen" }, { status: 400 });
  }

  await db.membership.delete({ where: { id: membershipId } });

  return NextResponse.json({ success: true });
}
