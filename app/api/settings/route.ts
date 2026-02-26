/**
 * GET  /api/settings  → Workspace settings (vapiApiKey masked)
 * POST /api/settings  → Save vapiApiKey for workspace
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getUserWorkspace } from "@/lib/workspace";
import { listVapiAssistants } from "@/lib/vapi";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const workspace = await getUserWorkspace(session.user.id);
  if (!workspace) return NextResponse.json({ error: "No workspace" }, { status: 400 });

  // Mask key: show first 12 chars only
  const key = workspace.vapiApiKey;
  const maskedKey = key ? `${key.slice(0, 12)}${"•".repeat(20)}` : null;

  return NextResponse.json({
    vapiApiKeySet: !!key,
    vapiApiKeyMasked: maskedKey,
  });
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const workspace = await getUserWorkspace(session.user.id);
  if (!workspace) return NextResponse.json({ error: "No workspace" }, { status: 400 });

  const { vapiApiKey } = await req.json() as { vapiApiKey?: string };

  if (vapiApiKey !== undefined && vapiApiKey !== "") {
    // Validate the key by fetching assistants from Vapi
    try {
      await listVapiAssistants(vapiApiKey);
    } catch {
      return NextResponse.json(
        { error: "Ungültiger Vapi API Key — Verbindung fehlgeschlagen" },
        { status: 400 }
      );
    }
  }

  const { db } = await import("@/lib/db");
  await db.workspace.update({
    where: { id: workspace.id },
    data: { vapiApiKey: vapiApiKey || null },
  });

  return NextResponse.json({ ok: true });
}
