/**
 * POST /api/webhooks/vapi
 *
 * Vapi Webhook Handler — receives real-time call events from Vapi.
 *
 * Configure in Vapi Dashboard → Settings → Webhooks:
 *   URL: https://yourdomain.com/api/webhooks/vapi
 *
 * For local dev use ngrok:
 *   npx ngrok http 3000
 *   → https://xxxx.ngrok.io/api/webhooks/vapi
 *
 * Events handled:
 *   - call-started  → creates a pending Call record
 *   - end-of-call-report → updates Call with transcript, cost, duration, recording
 */

import { NextRequest, NextResponse } from "next/server";
import { timingSafeEqual } from "crypto";
import { db } from "@/lib/db";

// ─── Vapi Payload Types ────────────────────────────────────────────────────────

interface VapiCall {
  id: string;
  assistantId?: string;
  type?: string;
  startedAt?: string;
  endedAt?: string;
  cost?: number;
  costs?: unknown[];
  status?: string;
  endedReason?: string;
  customer?: { number?: string };
  phoneNumber?: { number?: string };
}

interface VapiMessage {
  type: string;
  call?: VapiCall;
  endedReason?: string;
  transcript?: string;
  summary?: string;
  recordingUrl?: string;
  stereoRecordingUrl?: string;
  durationSeconds?: number;
  cost?: number;
  costs?: unknown[];
  analysis?: {
    summary?: string;
    successEvaluation?: string;
    structuredData?: unknown;
  };
}

interface VapiPayload {
  message: VapiMessage;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Finds our assistant by Vapi's assistantId (stored in vapiAssistantId) */
async function findAssistantByVapiId(vapiAssistantId: string) {
  return db.assistant.findFirst({
    where: { vapiAssistantId },
    select: { id: true, workspaceId: true },
  });
}

// ─── Handler ──────────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  // ── Signature verification ──────────────────────────────────────────────────
  // Vapi sends the Server Secret (configured in Vapi Dashboard → Settings →
  // Webhooks → Server Secret) as the Authorization header: "Bearer <secret>".
  // Set VAPI_WEBHOOK_SECRET in your env to enable verification.
  const webhookSecret = process.env.VAPI_WEBHOOK_SECRET;
  if (webhookSecret) {
    const authHeader = req.headers.get("authorization") ?? "";
    const expected = `Bearer ${webhookSecret}`;
    let valid = false;
    try {
      const a = Buffer.from(authHeader);
      const b = Buffer.from(expected);
      valid = a.length === b.length && timingSafeEqual(a, b);
    } catch {
      valid = false;
    }
    if (!valid) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  let body: VapiPayload;

  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { message } = body;
  if (!message?.type) {
    return NextResponse.json({ error: "Missing message.type" }, { status: 400 });
  }

  const call = message.call;
  const vapiCallId = call?.id;
  const vapiAssistantId = call?.assistantId;

  // Find our assistant & workspace from Vapi's assistantId
  let workspaceId: string | null = null;
  let assistantId: string | null = null;

  if (vapiAssistantId) {
    const match = await findAssistantByVapiId(vapiAssistantId);
    if (match) {
      assistantId = match.id;
      workspaceId = match.workspaceId;
    }
  }

  // Log every webhook for debugging
  const log = await db.webhookLog.create({
    data: {
      workspaceId,
      provider: "vapi",
      event: message.type,
      payloadJson: body as unknown as Parameters<typeof db.webhookLog.create>[0]["data"]["payloadJson"],
      status: "received",
    },
  });

  try {
    // ── call-started ─────────────────────────────────────────────────────────
    if (message.type === "call-started" && vapiCallId && workspaceId) {
      // Block call if workspace has no credits
      const billing = await db.billing.findUnique({ where: { workspaceId } });
      if (billing && billing.creditsBalance <= 0) {
        // End the call immediately via Vapi API
        await fetch(`https://api.vapi.ai/call/${vapiCallId}`, {
          method: "DELETE",
          headers: { Authorization: `Bearer ${process.env.VAPI_API_KEY}` },
        });
        await db.call.upsert({
          where: { providerCallId: vapiCallId },
          update: { outcome: "blocked-no-credits" },
          create: {
            workspaceId,
            assistantId,
            providerCallId: vapiCallId,
            startedAt: call?.startedAt ? new Date(call.startedAt) : new Date(),
            fromNumber: call?.customer?.number,
            toNumber: call?.phoneNumber?.number,
            outcome: "blocked-no-credits",
          },
        });
      } else {
        const existing = await db.call.findFirst({ where: { providerCallId: vapiCallId } });
        if (!existing) {
          await db.call.create({
            data: {
              workspaceId,
              assistantId,
              providerCallId: vapiCallId,
              startedAt: call?.startedAt ? new Date(call.startedAt) : new Date(),
              fromNumber: call?.customer?.number,
              toNumber: call?.phoneNumber?.number,
              outcome: "in-progress",
            },
          });
        }
      }
    }

    // ── end-of-call-report ───────────────────────────────────────────────────
    if (message.type === "end-of-call-report" && vapiCallId && workspaceId) {
      const costTotal = message.cost ?? call?.cost;
      const durationSec = message.durationSeconds
        ? Math.round(message.durationSeconds)
        : undefined;

      // Extract intent & booking status from Vapi analysis
      const structured = message.analysis?.structuredData as Record<string, unknown> | undefined;
      const intent = (structured?.intent as string | undefined) ?? null;
      const successEval = message.analysis?.successEvaluation;
      const bookingStatus =
        (structured?.bookingStatus as string | undefined) ??
        (successEval === "true" || successEval === "1" ? "booked" : null);

      const callData = {
        workspaceId,
        assistantId,
        providerCallId: vapiCallId,
        startedAt: call?.startedAt ? new Date(call.startedAt) : new Date(),
        endedAt: call?.endedAt ? new Date(call.endedAt) : new Date(),
        durationSec,
        fromNumber: call?.customer?.number,
        toNumber: call?.phoneNumber?.number,
        outcome: message.endedReason ?? call?.endedReason ?? "ended",
        costTotal,
        costBreakdownJson: (message.costs ?? call?.costs ?? null) as Parameters<typeof db.call.create>[0]["data"]["costBreakdownJson"],
        recordingUrl: message.recordingUrl ?? message.stereoRecordingUrl,
        transcriptText: message.transcript,
        intent,
        bookingStatus,
      };

      const existing = await db.call.findFirst({ where: { providerCallId: vapiCallId } });
      if (existing) {
        await db.call.update({ where: { id: existing.id }, data: callData });
      } else {
        await db.call.create({ data: callData });
      }

      // Deduct credits from workspace billing (floor at 0 to prevent negative balance)
      if (costTotal && workspaceId) {
        await db.billing.upsert({
          where: { workspaceId },
          update: {
            creditsBalance: { decrement: costTotal },
            totalSpent: { increment: costTotal },
          },
          create: {
            workspaceId,
            creditsBalance: 0,
            totalSpent: costTotal,
            currency: "EUR",
          },
        });
        // Ensure balance never goes negative (single-query clamp)
        await db.$executeRaw`
          UPDATE billing
          SET "creditsBalance" = GREATEST(0, "creditsBalance")
          WHERE "workspaceId" = ${workspaceId}
        `;
      }
    }

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
    console.error("[VAPI WEBHOOK]", errMsg);
    return NextResponse.json({ error: "Processing failed" }, { status: 500 });
  }
}
