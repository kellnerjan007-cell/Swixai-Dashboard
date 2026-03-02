import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { getUserWorkspace, getOrCreateWorkspace } from "@/lib/workspace";
import { assistantSchema } from "@/lib/validations";
import { createVapiAssistant } from "@/lib/vapi";
import type { ToolsConfig } from "@/lib/vapi";
import { decryptIfEncrypted } from "@/lib/crypto";

// Max assistants per plan (-1 = unlimited)
const PLAN_LIMITS: Record<string, number> = {
  starter: 1,
  pro: 5,
  enterprise: -1,
};

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const workspace = await getUserWorkspace(session.user.id);
  if (!workspace) return NextResponse.json([], { status: 200 });

  const assistants = await db.assistant.findMany({
    where: { workspaceId: workspace.id },
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { calls: true } } },
  });

  return NextResponse.json(assistants);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const workspace = await getOrCreateWorkspace(session.user.id);
  if (!workspace) return NextResponse.json({ error: "Kein Benutzer gefunden" }, { status: 400 });

  // Enforce plan-based assistant limit
  const planLimit = PLAN_LIMITS[workspace.plan] ?? PLAN_LIMITS.starter;
  if (planLimit !== -1) {
    const count = await db.assistant.count({ where: { workspaceId: workspace.id } });
    if (count >= planLimit) {
      return NextResponse.json(
        { error: `Ihr Plan (${workspace.plan}) erlaubt maximal ${planLimit} Assistent${planLimit === 1 ? "" : "en"}. Bitte upgraden Sie Ihren Plan.` },
        { status: 403 }
      );
    }
  }

  const body = await req.json();
  const parsed = assistantSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message },
      { status: 400 }
    );
  }

  // 1. Create in DB first
  const assistant = await db.assistant.create({
    data: {
      workspaceId: workspace.id,
      ...parsed.data,
    },
  });

  // 2. Sync to Vapi — skip if user already provided a vapiAssistantId
  const vapiKey = (workspace.vapiApiKey ? decryptIfEncrypted(workspace.vapiApiKey) : null) || process.env.VAPI_API_KEY;
  let vapiSyncFailed = false;
  let vapiSyncError: string | undefined;

  if (vapiKey && !parsed.data.vapiAssistantId) {
    try {
      const vapiId = await createVapiAssistant({
        name: assistant.name,
        systemPrompt: assistant.systemPrompt,
        voice: assistant.voice,
        language: assistant.language,
        toolsConfig: assistant.toolsConfig as ToolsConfig | null,
      }, vapiKey);
      await db.assistant.update({
        where: { id: assistant.id },
        data: { vapiAssistantId: vapiId },
      });
      assistant.vapiAssistantId = vapiId;
    } catch (err) {
      console.error("[VAPI] Failed to create assistant in Vapi:", err);
      vapiSyncFailed = true;
      vapiSyncError = err instanceof Error ? err.message : "Vapi-Synchronisierung fehlgeschlagen";
    }
  }

  return NextResponse.json(
    { ...assistant, vapiSyncFailed, vapiSyncError },
    { status: 201 }
  );
}
