import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { getUserWorkspace } from "@/lib/workspace";
import { fetchVapiCalls } from "@/lib/vapi";

export async function POST() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const workspace = await getUserWorkspace(session.user.id);
  if (!workspace) return NextResponse.json({ error: "No workspace" }, { status: 400 });

  const vapiKey = workspace.vapiApiKey || process.env.VAPI_API_KEY;
  if (!vapiKey) {
    return NextResponse.json({ error: "Kein Vapi API Key konfiguriert" }, { status: 400 });
  }

  // Get all assistants in this workspace that have a vapiAssistantId
  const assistants = await db.assistant.findMany({
    where: { workspaceId: workspace.id, vapiAssistantId: { not: null } },
    select: { id: true, vapiAssistantId: true },
  });

  const vapiIdToAssistantId = new Map(
    assistants.map((a) => [a.vapiAssistantId!, a.id])
  );

  // Fetch calls from Vapi
  let vapiCalls;
  try {
    vapiCalls = await fetchVapiCalls(vapiKey, 100);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }

  let synced = 0;

  for (const vc of vapiCalls) {
    // Match to local assistant if possible, otherwise still import the call
    const assistantId = vc.assistantId ? (vapiIdToAssistantId.get(vc.assistantId) ?? null) : null;

    const structured = vc.analysis?.structuredData as Record<string, unknown> | undefined;
    const intent = (structured?.intent as string | undefined) ?? null;
    const successEval = vc.analysis?.successEvaluation;
    const bookingStatus =
      (structured?.bookingStatus as string | undefined) ??
      (successEval === "true" || successEval === "1" ? "booked" : null);

    const data = {
      workspaceId: workspace.id,
      assistantId,
      providerCallId: vc.id,
      startedAt: vc.startedAt ? new Date(vc.startedAt) : new Date(),
      endedAt: vc.endedAt ? new Date(vc.endedAt) : null,
      durationSec: vc.startedAt && vc.endedAt
        ? Math.round((new Date(vc.endedAt).getTime() - new Date(vc.startedAt).getTime()) / 1000)
        : null,
      fromNumber: vc.customer?.number ?? null,
      toNumber: vc.phoneNumber?.number ?? null,
      outcome: vc.endedReason ?? vc.status ?? "ended",
      costTotal: vc.cost ?? null,
      costBreakdownJson: (vc.costs ?? null) as Parameters<typeof db.call.create>[0]["data"]["costBreakdownJson"],
      recordingUrl: vc.recordingUrl ?? vc.stereoRecordingUrl ?? null,
      transcriptText: vc.transcript ?? null,
      intent,
      bookingStatus,
    };

    const existing = await db.call.findFirst({ where: { providerCallId: vc.id } });
    if (existing) {
      await db.call.update({ where: { id: existing.id }, data });
    } else {
      await db.call.create({ data });
    }
    synced++;
  }

  return NextResponse.json({ synced, total: vapiCalls.length });
}
