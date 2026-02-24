import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { getUserWorkspace } from "@/lib/workspace";
import { assistantSchema } from "@/lib/validations";

async function getAssistantWithAuth(
  assistantId: string,
  userId: string
): Promise<{ ok: boolean; assistant?: Awaited<ReturnType<typeof db.assistant.findFirst>>; error?: string; status?: number }> {
  const workspace = await getUserWorkspace(userId);
  if (!workspace) return { ok: false, error: "No workspace", status: 400 };

  const assistant = await db.assistant.findFirst({
    where: { id: assistantId, workspaceId: workspace.id },
  });
  if (!assistant) return { ok: false, error: "Not found", status: 404 };

  return { ok: true, assistant };
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { ok, assistant, error, status } = await getAssistantWithAuth(id, session.user.id);
  if (!ok) return NextResponse.json({ error }, { status });

  return NextResponse.json(assistant);
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { ok, error, status } = await getAssistantWithAuth(id, session.user.id);
  if (!ok) return NextResponse.json({ error }, { status });

  const body = await req.json();
  const parsed = assistantSchema.partial().safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message }, { status: 400 });
  }

  const updated = await db.assistant.update({
    where: { id },
    data: parsed.data,
  });

  return NextResponse.json(updated);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { ok, error, status } = await getAssistantWithAuth(id, session.user.id);
  if (!ok) return NextResponse.json({ error }, { status });

  await db.assistant.delete({ where: { id } });

  return NextResponse.json({ ok: true });
}
