import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { Topbar } from "@/components/customer/Topbar";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { formatCurrency } from "@/lib/utils";
import { Zap, AlertTriangle, CheckCircle, XCircle, Check } from "lucide-react";
import { TopUpCard } from "@/components/customer/TopUpCard";

const PLANS = [
  {
    key: "starter",
    label: "Starter",
    price: "149",
    subtitle: "Geeignet für 1–20 Anrufe/Tag",
    features: [
      "500 Minuten inkl. · danach 0,39 CHF/Min",
      "1 KI-Agent mit eigener Stimme",
      "Terminbuchung & Kalender-Sync",
      "Basis-Analytics Dashboard",
      "E-Mail Support",
    ],
    popular: false,
  },
  {
    key: "pro",
    label: "Pro",
    price: "299",
    subtitle: "Geeignet für 20–80 Anrufe/Tag",
    features: [
      "1.000 Minuten inkl. · danach 0,29 CHF/Min",
      "1 Agent · 6 Stimmen wählbar",
      "Erweiterte Analytics & Transkripte",
      "Stimmungsanalyse (KI)",
      "SMS- & E-Mail-Bestätigungen",
      "Prioritäts-Support (Chat)",
      "Mehrsprachigkeit inklusive",
    ],
    popular: true,
  },
  {
    key: "business",
    label: "Business",
    price: "599",
    subtitle: "Geeignet für 80+ Anrufe/Tag",
    features: [
      "2.500 Minuten inkl. · danach 0,19 CHF/Min",
      "Bis zu 3 KI-Agenten",
      "CRM-Integration (HubSpot etc.)",
      "Individuelle Gesprächslogik",
      "Dedizierter Account Manager",
      "SLA & 99,9 % Uptime Garantie",
      "Custom Branding & Vanity Number",
    ],
    popular: false,
  },
] as const;

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

        {/* Plan Overview */}
        <div>
          <h2 className="text-base font-semibold text-gray-900 mb-4">Verfügbare Pläne</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {PLANS.map((plan) => {
              const isCurrent = (workspace?.plan ?? "starter") === plan.key;
              return (
                <div
                  key={plan.key}
                  className={`relative rounded-2xl border p-6 flex flex-col gap-4 ${
                    isCurrent
                      ? "border-gray-900 bg-gray-900 text-white"
                      : plan.popular
                      ? "border-amber-300 bg-white"
                      : "border-gray-200 bg-white"
                  }`}
                >
                  {plan.popular && !isCurrent && (
                    <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-amber-400 text-amber-900 text-xs font-semibold px-3 py-0.5 rounded-full">
                      Beliebt
                    </span>
                  )}
                  {isCurrent && (
                    <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-white text-gray-900 text-xs font-semibold px-3 py-0.5 rounded-full border border-gray-200">
                      Ihr Plan
                    </span>
                  )}
                  <div>
                    <p className={`text-xs font-semibold tracking-widest uppercase mb-1 ${isCurrent ? "text-gray-400" : "text-gray-500"}`}>
                      {plan.label}
                    </p>
                    <p className={`text-xs mb-3 ${isCurrent ? "text-gray-400" : "text-gray-400"}`}>{plan.subtitle}</p>
                    <div className="flex items-baseline gap-1">
                      <span className={`text-4xl font-bold ${isCurrent ? "text-white" : "text-gray-900"}`}>{plan.price}</span>
                      <span className={`text-sm ${isCurrent ? "text-gray-400" : "text-gray-500"}`}>CHF / Monat · zzgl. MwSt.</span>
                    </div>
                  </div>
                  <ul className="space-y-2 flex-1">
                    {plan.features.map((f) => (
                      <li key={f} className="flex items-start gap-2 text-sm">
                        <Check className={`w-4 h-4 flex-shrink-0 mt-0.5 ${isCurrent ? "text-emerald-400" : "text-emerald-600"}`} />
                        <span className={isCurrent ? "text-gray-300" : "text-gray-600"}>{f}</span>
                      </li>
                    ))}
                  </ul>
                  {isCurrent ? (
                    <div className="mt-2 text-center text-sm font-medium py-2.5 rounded-xl bg-white/10 text-white cursor-default">
                      Aktueller Plan
                    </div>
                  ) : (
                    <a
                      href={`mailto:office@swixai.info?subject=${encodeURIComponent(`Planwechsel zu ${plan.label}`)}&body=${encodeURIComponent(`Hallo,\n\nich möchte zu ${plan.label}-Plan (${plan.price} CHF/Monat) wechseln.\n\nWorkspace: ${workspace?.name ?? ""}\n\nBitte meldet euch bei mir.\n\nViele Grüße`)}`}
                      className="mt-2 block text-center text-sm font-medium py-2.5 rounded-xl bg-gray-900 text-white hover:bg-gray-700 transition-colors"
                    >
                      {`Zu ${plan.label} wechseln`}
                    </a>
                  )}
                </div>
              );
            })}
          </div>
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
