/**
 * POST /api/billing/webhook
 *
 * Stripe Webhook Handler — empfängt Zahlungsereignisse von Stripe.
 *
 * Konfiguriere in Stripe Dashboard → Webhooks:
 *   URL: https://yourdomain.com/api/billing/webhook
 *   Events: checkout.session.completed
 *
 * Für lokale Tests:
 *   stripe listen --forward-to localhost:3000/api/billing/webhook
 *   → kopiere den "webhook signing secret" (whsec_...) in STRIPE_WEBHOOK_SECRET
 */

import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
  const body = await req.text();
  const sig = req.headers.get("stripe-signature");

  if (!sig) {
    return NextResponse.json({ error: "Fehlende stripe-signature" }, { status: 400 });
  }

  if (!process.env.STRIPE_WEBHOOK_SECRET) {
    console.error("[STRIPE WEBHOOK] STRIPE_WEBHOOK_SECRET nicht gesetzt");
    return NextResponse.json({ error: "Webhook secret nicht konfiguriert" }, { status: 500 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unbekannter Fehler";
    console.error("[STRIPE WEBHOOK] Signaturprüfung fehlgeschlagen:", msg);
    return NextResponse.json({ error: `Webhook Error: ${msg}` }, { status: 400 });
  }

  // Jedes Event loggen für Debugging
  const log = await db.webhookLog.create({
    data: {
      workspaceId: null,
      provider: "stripe",
      event: event.type,
      payloadJson: event as unknown as Parameters<typeof db.webhookLog.create>[0]["data"]["payloadJson"],
      status: "received",
    },
  });

  try {
    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;
      const workspaceId = session.metadata?.workspaceId;
      const amount = Number(session.metadata?.amount);

      if (!workspaceId || !amount) {
        throw new Error("workspaceId oder amount fehlt in session.metadata");
      }

      // Guthaben aufladen
      await db.billing.upsert({
        where: { workspaceId },
        update: {
          creditsBalance: { increment: amount },
        },
        create: {
          workspaceId,
          creditsBalance: amount,
          totalSpent: 0,
          currency: "EUR",
        },
      });

      // workspaceId im Log aktualisieren
      await db.webhookLog.update({
        where: { id: log.id },
        data: { workspaceId, status: "processed" },
      });
    } else {
      // Nicht behandeltes Event einfach bestätigen
      await db.webhookLog.update({
        where: { id: log.id },
        data: { status: "processed" },
      });
    }

    return NextResponse.json({ received: true });
  } catch (err) {
    const errMsg = err instanceof Error ? err.message : String(err);
    await db.webhookLog.update({
      where: { id: log.id },
      data: { status: "failed", error: errMsg },
    });
    console.error("[STRIPE WEBHOOK]", errMsg);
    return NextResponse.json({ error: "Verarbeitung fehlgeschlagen" }, { status: 500 });
  }
}
