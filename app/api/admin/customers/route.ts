import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const workspaces = await db.workspace.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      billing: true,
      _count: { select: { members: true, assistants: true, calls: true } },
    },
  });

  return NextResponse.json(workspaces);
}
