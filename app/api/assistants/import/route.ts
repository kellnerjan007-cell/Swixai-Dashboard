/**
 * POST /api/assistants/import
 * Fetches all assistants from Vapi and creates DB records for any not yet linked.
 */
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getOrCreateWorkspace } from "@/lib/workspace";
import { db } from "@/lib/db";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const workspace = await getOrCreateWorkspace(session.user.id);
  if (!workspace) return NextResponse.json({ error: "No workspace" }, { status: 400 });

  const vapiKey = process.env.VAPI_API_KEY;
  if (!vapiKey) return NextResponse.json({ error: "VAPI_API_KEY nicht konfiguriert" }, { status: 400 });

  // Fetch all assistants from Vapi
  const res = await fetch("https://api.vapi.ai/assistant?limit=100", {
    headers: { Authorization: `Bearer ${vapiKey}` },
  });

  if (!res.ok) {
    return NextResponse.json({ error: "Vapi API Fehler" }, { status: 502 });
  }

  const vapiAssistants: Array<{
    id: string;
    name?: string;
    voice?: { provider?: string; voiceId?: string };
    model?: { provider?: string };
    transcriber?: { language?: string };
  }> = await res.json();

  // Find which vapiAssistantIds are already in DB
  const existing = await db.assistant.findMany({
    where: { workspaceId: workspace.id, vapiAssistantId: { not: null } },
    select: { vapiAssistantId: true },
  });
  const existingIds = new Set(existing.map((a) => a.vapiAssistantId));

  const toImport = vapiAssistants.filter((a) => !existingIds.has(a.id));

  if (toImport.length === 0) {
    return NextResponse.json({ imported: 0, message: "Alle Assistenten bereits importiert" });
  }

  // Create DB records for each new assistant
  await db.assistant.createMany({
    data: toImport.map((a) => ({
      workspaceId: workspace.id,
      name: a.name ?? "Importierter Assistent",
      vapiAssistantId: a.id,
      voice: a.voice?.voiceId ?? "alloy",
      language: a.transcriber?.language ?? "de",
      status: "ACTIVE" as const,
    })),
  });

  return NextResponse.json({ imported: toImport.length });
}
