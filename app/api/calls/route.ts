import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { getUserWorkspace } from "@/lib/workspace";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const workspace = await getUserWorkspace(session.user.id);
  if (!workspace) return NextResponse.json([], { status: 200 });

  const calls = await db.call.findMany({
    where: { workspaceId: workspace.id },
    orderBy: { startedAt: "desc" },
    take: 100,
    include: { assistant: { select: { name: true } } },
  });

  return NextResponse.json(calls);
}
