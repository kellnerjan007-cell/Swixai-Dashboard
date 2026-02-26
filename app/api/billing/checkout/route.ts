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

export const dynamic = "force-dynamic";

const ALLOWED_AMOUNTS = [10, 25, 50, 100];

export async function POST(req: NextRequest) {
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  // Parse the form POST (amount comes from <input type="hidden" name="amount">)
  const formData = await req.formData();
  const amount = Number(formData.get("amount"));

  if (!ALLOWED_AMOUNTS.includes(amount)) {
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

  // 303 See Other: browser follows redirect after POST
  return NextResponse.redirect(checkoutSession.url!, 303);
}
