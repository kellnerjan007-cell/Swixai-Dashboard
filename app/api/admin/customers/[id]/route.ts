import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

async function adminGuard() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") return null;
  return session;
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  if (!(await adminGuard())) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const workspace = await db.workspace.findUnique({
    where: { id },
    include: {
      billing: true,
      members: {
        include: { user: { select: { id: true, name: true, email: true } } },
      },
      assistants: {
        select: { id: true, name: true, status: true, phoneNumber: true },
      },
      calls: {
        orderBy: { startedAt: "desc" },
        take: 20,
        include: { assistant: { select: { name: true } } },
      },
    },
  });

  if (!workspace) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json(workspace);
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  if (!(await adminGuard())) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const allowed = ["status", "plan", "name"];
  const data = Object.fromEntries(
    Object.entries(body).filter(([k]) => allowed.includes(k))
  );

  const workspace = await db.workspace.update({ where: { id }, data });
  return NextResponse.json(workspace);
}
