import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { getUserWorkspace } from "@/lib/workspace";
import { assistantSchema } from "@/lib/validations";
import { createVapiAssistant } from "@/lib/vapi";
import type { ToolsConfig } from "@/lib/vapi";

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

  const workspace = await getUserWorkspace(session.user.id);
  if (!workspace) return NextResponse.json({ error: "No workspace" }, { status: 400 });

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
  const vapiKey = workspace.vapiApiKey || process.env.VAPI_API_KEY;
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
    }
  }

  return NextResponse.json(assistant, { status: 201 });
}
