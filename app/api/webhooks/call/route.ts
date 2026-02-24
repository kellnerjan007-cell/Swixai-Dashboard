/**
 * POST /api/webhooks/call
 *
 * Generic webhook handler for Voice Providers (Twilio, Vapi, Retell, etc.)
 * Expected payload (adapt per provider):
 * {
 *   event: "call-started" | "call-ended" | "call-failed",
 *   provider: "vapi" | "twilio" | "retell",
 *   providerCallId: string,
 *   assistantId?: string,      // your assistant ID or provider's
 *   fromNumber?: string,
 *   toNumber?: string,
 *   startedAt?: string,
 *   endedAt?: string,
 *   durationSec?: number,
 *   outcome?: string,
 *   recordingUrl?: string,
 *   transcriptText?: string,
 *   costTotal?: number,
 *   costBreakdown?: object,
 *   workspaceId?: string,      // if provider sends it back via metadata
 * }
 */

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function POST(req: NextRequest) {
  let payload: Record<string, unknown>;

  try {
    payload = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const provider = (payload.provider as string) ?? "unknown";
  const event = (payload.event as string) ?? "unknown";
  const providerCallId = payload.providerCallId as string | undefined;

  // Find workspace via assistantId or workspaceId metadata
  let workspaceId: string | undefined = payload.workspaceId as string | undefined;
  let assistantId: string | undefined;

  // Try to find the assistant by phone number or provider's assistant reference
  if (!workspaceId && payload.assistantId) {
    const assistant = await db.assistant.findFirst({
      where: { id: payload.assistantId as string },
      select: { id: true, workspaceId: true },
    });
    if (assistant) {
      assistantId = assistant.id;
      workspaceId = assistant.workspaceId;
    }
  }

  // Log the webhook
  const log = await db.webhookLog.create({
    data: {
      workspaceId: workspaceId ?? null,
      provider,
      event,
      payloadJson: payload as Parameters<typeof db.webhookLog.create>[0]["data"]["payloadJson"],
      status: "received",
    },
  });

  try {
    if (event === "call-ended" || event === "call-started") {
      if (workspaceId) {
        // Create or update call record
        const callData = {
          workspaceId,
          assistantId: assistantId ?? null,
          providerCallId: providerCallId ?? `wh-${log.id}`,
          startedAt: payload.startedAt ? new Date(payload.startedAt as string) : new Date(),
          endedAt: payload.endedAt ? new Date(payload.endedAt as string) : undefined,
          durationSec: payload.durationSec as number | undefined,
          fromNumber: payload.fromNumber as string | undefined,
          toNumber: payload.toNumber as string | undefined,
          outcome: payload.outcome as string | undefined,
          costTotal: payload.costTotal as number | undefined,
          recordingUrl: payload.recordingUrl as string | undefined,
          transcriptText: payload.transcriptText as string | undefined,
        };
        const existingCall = providerCallId
          ? await db.call.findFirst({ where: { providerCallId } })
          : null;
        if (existingCall) {
          await db.call.update({ where: { id: existingCall.id }, data: callData });
        } else {
          await db.call.create({ data: callData });
        }

        // Deduct credits from workspace billing if cost provided
        if (payload.costTotal && typeof payload.costTotal === "number") {
          await db.billing.upsert({
            where: { workspaceId },
            update: {
              creditsBalance: { decrement: payload.costTotal as number },
              totalSpent: { increment: payload.costTotal as number },
            },
            create: {
              workspaceId,
              creditsBalance: -(payload.costTotal as number),
              totalSpent: payload.costTotal as number,
              currency: "EUR",
            },
          });
        }
      }
    }

    // Mark log as processed
    await db.webhookLog.update({
      where: { id: log.id },
      data: { status: "processed" },
    });

    return NextResponse.json({ received: true });
  } catch (err) {
    const errMsg = err instanceof Error ? err.message : String(err);
    await db.webhookLog.update({
      where: { id: log.id },
      data: { status: "failed", error: errMsg },
    });
    console.error("[WEBHOOK]", errMsg);
    return NextResponse.json({ error: "Processing failed" }, { status: 500 });
  }
}
