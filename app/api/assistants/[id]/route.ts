import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { getOrCreateWorkspace } from "@/lib/workspace";
import { assistantSchema } from "@/lib/validations";
import { updateVapiAssistant, deleteVapiAssistant } from "@/lib/vapi";
import type { ToolsConfig } from "@/lib/vapi";
import { decryptIfEncrypted } from "@/lib/crypto";

async function getAssistantWithAuth(
  assistantId: string,
  userId: string
): Promise<{ ok: boolean; assistant?: Awaited<ReturnType<typeof db.assistant.findFirst>>; vapiKey?: string | null; error?: string; status?: number }> {
  const workspace = await getOrCreateWorkspace(userId);
  if (!workspace) return { ok: false, error: "Kein Benutzer gefunden", status: 400 };

  const assistant = await db.assistant.findFirst({
    where: { id: assistantId, workspaceId: workspace.id },
  });
  if (!assistant) return { ok: false, error: "Not found", status: 404 };

  const vapiKey = (workspace.vapiApiKey ? decryptIfEncrypted(workspace.vapiApiKey) : null) || process.env.VAPI_API_KEY;
  return { ok: true, assistant, vapiKey };
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

  const { ok, assistant, vapiKey, error, status } = await getAssistantWithAuth(id, session.user.id);
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

  // Sync update to Vapi
  if (vapiKey && assistant?.vapiAssistantId) {
    try {
      await updateVapiAssistant(assistant.vapiAssistantId, {
        name: updated.name,
        systemPrompt: updated.systemPrompt,
        voice: updated.voice,
        language: updated.language,
        toolsConfig: updated.toolsConfig as ToolsConfig | null,
      }, vapiKey);
    } catch (err) {
      console.error("[VAPI] Failed to update assistant in Vapi:", err);
    }
  }

  return NextResponse.json(updated);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { ok, assistant, vapiKey, error, status } = await getAssistantWithAuth(id, session.user.id);
  if (!ok) return NextResponse.json({ error }, { status });

  // Delete from Vapi first (before DB so we still have the vapiAssistantId)
  if (vapiKey && assistant?.vapiAssistantId) {
    try {
      await deleteVapiAssistant(assistant.vapiAssistantId, vapiKey);
    } catch (err) {
      console.error("[VAPI] Failed to delete assistant in Vapi:", err);
    }
  }

  await db.assistant.delete({ where: { id } });

  return NextResponse.json({ ok: true });
}
