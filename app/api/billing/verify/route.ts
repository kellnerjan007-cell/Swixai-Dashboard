/**
 * POST /api/billing/verify
 *
 * Wird aufgerufen wenn der User nach einer Stripe Zahlung zurückkommt.
 * Prüft die Session direkt bei Stripe und schreibt das Guthaben in die DB
 * – als Fallback falls der Webhook localhost nicht erreichen kann.
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import Stripe from "stripe";
import { db } from "@/lib/db";
import { authOptions } from "@/lib/auth";
import { getUserWorkspace } from "@/lib/workspace";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { sessionId } = await req.json() as { sessionId: string };
  if (!sessionId) return NextResponse.json({ error: "sessionId fehlt" }, { status: 400 });

  const workspace = await getUserWorkspace(session.user.id);
  if (!workspace) return NextResponse.json({ error: "Workspace nicht gefunden" }, { status: 404 });

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
  const checkoutSession = await stripe.checkout.sessions.retrieve(sessionId);

  // Sicherheitscheck: Session muss zu diesem Workspace gehören
  if (checkoutSession.metadata?.workspaceId !== workspace.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  if (checkoutSession.payment_status !== "paid") {
    return NextResponse.json({ error: "Zahlung noch nicht abgeschlossen" }, { status: 402 });
  }

  // Idempotenz: Wurde diese Session schon verarbeitet?
  const alreadyLogged = await db.webhookLog.findFirst({
    where: { provider: "stripe", status: "processed", event: "checkout.session.completed",
      payloadJson: { path: ["id"], equals: sessionId } },
  });
  if (alreadyLogged) {
    return NextResponse.json({ ok: true, alreadyCredited: true });
  }

  const amount = Number(checkoutSession.metadata?.amount);
  if (!amount) return NextResponse.json({ error: "Betrag fehlt in Metadata" }, { status: 400 });

  // Guthaben in DB aktualisieren
  await db.billing.upsert({
    where: { workspaceId: workspace.id },
    update: { creditsBalance: { increment: amount } },
    create: { workspaceId: workspace.id, creditsBalance: amount, totalSpent: 0, currency: "EUR" },
  });

  // Als verarbeitet markieren damit es nicht doppelt gutgeschrieben wird
  await db.webhookLog.create({
    data: {
      workspaceId: workspace.id,
      provider: "stripe",
      event: "checkout.session.completed",
      payloadJson: { id: sessionId, amount, source: "verify-route" },
      status: "processed",
    },
  });

  return NextResponse.json({ ok: true, credited: amount });
}
