/**
 * POST /api/billing/checkout
 *
 * Creates a Stripe Checkout Session and redirects the user to Stripe's
 * hosted payment page. After payment, Stripe redirects back to /app/billing.
 *
 * The actual credit top-up happens via the Stripe webhook:
 *   POST /api/billing/webhook → checkout.session.completed
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import Stripe from "stripe";
import { authOptions } from "@/lib/auth";
import { getUserWorkspace } from "@/lib/workspace";
import { rateLimit, getClientIp } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const { success } = rateLimit(getClientIp(req), 10, 60 * 60 * 1000); // 10 per hour
  if (!success) {
    return NextResponse.json(
      { error: "Zu viele Anfragen. Bitte in einer Stunde erneut versuchen." },
      { status: 429 }
    );
  }

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Nicht eingeloggt" }, { status: 401 });
  }

  const body = await req.json();
  const amount = Math.floor(Number(body.amount));

  if (!amount || amount < 1 || amount > 10000) {
    return NextResponse.json({ error: "Ungültiger Betrag" }, { status: 400 });
  }

  const workspace = await getUserWorkspace(session.user.id);
  if (!workspace) {
    return NextResponse.json({ error: "Workspace nicht gefunden" }, { status: 404 });
  }

  const baseUrl = process.env.NEXTAUTH_URL ?? "http://localhost:3000";

  const checkoutSession = await stripe.checkout.sessions.create({
    mode: "payment",
    payment_method_types: ["card"],
    line_items: [
      {
        price_data: {
          currency: "eur",
          product_data: {
            name: `VoxAI Credits – €${amount}`,
            description: `€${amount} Guthaben für VoxAI Voice AI`,
          },
          unit_amount: amount * 100, // Stripe rechnet in Cent
        },
        quantity: 1,
      },
    ],
    metadata: {
      workspaceId: workspace.id,
      amount: amount.toString(),
    },
    success_url: `${baseUrl}/app/billing?success=1&session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${baseUrl}/app/billing?canceled=1`,
  });

  return NextResponse.json({ url: checkoutSession.url });
}
