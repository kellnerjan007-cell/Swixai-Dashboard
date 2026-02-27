import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { Topbar } from "@/components/customer/Topbar";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { formatCurrency } from "@/lib/utils";
import { Zap, TrendingUp, AlertTriangle, CheckCircle, XCircle } from "lucide-react";
import { TopUpCard } from "@/components/customer/TopUpCard";

export default async function BillingPage({
  searchParams,
}: {
  searchParams: Promise<{ success?: string; canceled?: string; session_id?: string }>;
}) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const params = await searchParams;
  const paymentSuccess = params.success === "1";
  const paymentCanceled = params.canceled === "1";
  const stripeSessionId = params.session_id;

  // Guthaben direkt verifizieren wenn User nach Stripe-Checkout zurückkommt
  // (Webhook kann localhost nicht erreichen – das ist der Fallback)
  if (paymentSuccess && stripeSessionId) {
    try {
      const Stripe = (await import("stripe")).default;
      const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
      const checkout = await stripe.checkout.sessions.retrieve(stripeSessionId);

      if (checkout.payment_status === "paid") {
        const membership = await db.membership.findFirst({
          where: { userId: session.user.id },
          include: { workspace: true },
          orderBy: { createdAt: "asc" },
        });
        const workspaceId = membership?.workspace?.id;
        if (workspaceId && checkout.metadata?.workspaceId === workspaceId) {
          const amount = Number(checkout.metadata?.amount);
          const alreadyDone = await db.webhookLog.findFirst({
            where: {
              provider: "stripe",
              status: "processed",
              event: "checkout.session.completed",
              payloadJson: { path: ["id"], equals: stripeSessionId },
            },
          });
          if (!alreadyDone && amount) {
            await db.billing.upsert({
              where: { workspaceId },
              update: { creditsBalance: { increment: amount } },
              create: { workspaceId, creditsBalance: amount, totalSpent: 0, currency: "EUR" },
            });
            await db.webhookLog.create({
              data: {
                workspaceId,
                provider: "stripe",
                event: "checkout.session.completed",
                payloadJson: { id: stripeSessionId, amount, source: "billing-page" },
                status: "processed",
              },
            });
          }
        }
      }
    } catch {
      // Stille Fehler – Webhook kann es ggf. noch nachtragen
    }
  }

  const membership = await db.membership.findFirst({
    where: { userId: session.user.id },
    include: {
      workspace: {
        include: {
          billing: true,
          calls: {
            where: {
              startedAt: {
                gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
              },
            },
            select: { costTotal: true },
          },
        },
      },
    },
    orderBy: { createdAt: "asc" },
  });

  const workspace = membership?.workspace;
  const billing = workspace?.billing;
  const creditsBalance = billing?.creditsBalance ?? 0;
  const totalSpent = billing?.totalSpent ?? 0;
  const monthSpent = workspace?.calls.reduce((s, c) => s + (c.costTotal ?? 0), 0) ?? 0;
  const currency = billing?.currency ?? "EUR";
  const lowBalance = creditsBalance < 5;

  return (
    <>
      <Topbar title="Billing & Credits" subtitle="Kontostand & Verbrauch" />
      <main className="flex-1 px-8 py-8 space-y-6">
        {/* Payment success */}
        {paymentSuccess && (
          <div className="flex items-start gap-3 bg-emerald-50 border border-emerald-200 rounded-2xl px-5 py-4">
            <CheckCircle className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-emerald-800">Zahlung erfolgreich</p>
              <p className="text-sm text-emerald-700">
                Dein Guthaben wurde aufgeladen. Es kann einige Sekunden dauern, bis es sichtbar ist.
              </p>
            </div>
          </div>
        )}

        {/* Payment canceled */}
        {paymentCanceled && (
          <div className="flex items-start gap-3 bg-red-50 border border-red-200 rounded-2xl px-5 py-4">
            <XCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-red-800">Zahlung abgebrochen</p>
              <p className="text-sm text-red-700">
                Der Zahlungsvorgang wurde abgebrochen. Dein Guthaben wurde nicht verändert.
              </p>
            </div>
          </div>
        )}

        {/* Low balance warning */}
        {lowBalance && (
          <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-2xl px-5 py-4">
            <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-amber-800">Guthaben niedrig</p>
              <p className="text-sm text-amber-700">
                Dein Guthaben ist unter € 5,00. Lade es auf, um den Dienst nicht zu unterbrechen.
              </p>
            </div>
          </div>
        )}

        {/* Balance Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="md:col-span-1">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-gray-900 rounded-xl flex items-center justify-center flex-shrink-0">
                <Zap className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-sm text-gray-500 mb-1">Guthaben</p>
                <p className={`text-3xl font-bold ${creditsBalance < 5 ? "text-red-600" : "text-emerald-600"}`}>
                  {formatCurrency(creditsBalance, currency)}
                </p>
                <Badge variant={workspace?.plan === "pro" ? "blue" : "gray"} className="mt-2">
                  {workspace?.plan ?? "starter"} Plan
                </Badge>
              </div>
            </div>
          </Card>

          <Card>
            <p className="text-sm text-gray-500 mb-1">Verbraucht diesen Monat</p>
            <p className="text-2xl font-bold text-gray-900">{formatCurrency(monthSpent, currency)}</p>
            <p className="text-xs text-gray-400 mt-2">
              Gesamt bisher: {formatCurrency(totalSpent, currency)}
            </p>
          </Card>

          <Card className="flex flex-col justify-between">
            <div>
              <p className="text-sm text-gray-500 mb-1">Guthaben aufladen</p>
              <p className="text-sm text-gray-600">Wähle einen Betrag</p>
            </div>
            <TopUpCard currency={currency} />
          </Card>
        </div>

        {/* Usage Breakdown */}
        <Card>
          <h2 className="text-base font-semibold text-gray-900 mb-4">
            Verbrauch nach Kategorie
          </h2>
          <p className="text-sm text-gray-400 text-center py-6">
            Detaillierte Aufschlüsselung nach Kategorie (STT, LLM, TTS, Telefonie) wird in einer zukünftigen Version verfügbar sein.
          </p>
        </Card>

      </main>
    </>
  );
}
