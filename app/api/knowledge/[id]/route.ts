import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { getUserWorkspace } from "@/lib/workspace";

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const workspace = await getUserWorkspace(session.user.id);
  if (!workspace) return NextResponse.json({ error: "No workspace" }, { status: 400 });

  const source = await db.knowledgeSource.findFirst({
    where: { id, workspaceId: workspace.id },
  });
  if (!source) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await db.knowledgeSource.delete({ where: { id } });

  return NextResponse.json({ ok: true });
}
