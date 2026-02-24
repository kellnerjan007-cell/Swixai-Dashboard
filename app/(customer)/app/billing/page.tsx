import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { Topbar } from "@/components/customer/Topbar";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { formatCurrency } from "@/lib/utils";
import { Zap, TrendingUp, CreditCard, AlertTriangle } from "lucide-react";

const usageItems = [
  { key: "STT", label: "Speech-to-Text", color: "bg-indigo-400", pct: 35 },
  { key: "LLM", label: "KI-Modell (LLM)", color: "bg-violet-400", pct: 40 },
  { key: "TTS", label: "Text-to-Speech", color: "bg-blue-400", pct: 15 },
  { key: "Telephony", label: "Telefonie", color: "bg-emerald-400", pct: 10 },
];

export default async function BillingPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

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
            <div className="mt-4 space-y-2">
              {[10, 25, 50, 100].map((amount) => (
                <form key={amount} action="/api/billing/checkout" method="POST">
                  <input type="hidden" name="amount" value={amount} />
                  <Button variant="secondary" size="sm" className="w-full">
                    + {formatCurrency(amount, currency)}
                  </Button>
                </form>
              ))}
              <p className="text-xs text-gray-400 text-center pt-1">
                Powered by Stripe
                {/* TODO: Implement Stripe Checkout in /api/billing/checkout */}
              </p>
            </div>
          </Card>
        </div>

        {/* Usage Breakdown */}
        <Card>
          <h2 className="text-base font-semibold text-gray-900 mb-5">
            Verbrauch nach Kategorie
          </h2>

          {/* Bar */}
          <div className="h-3 bg-gray-100 rounded-full overflow-hidden flex mb-5">
            {usageItems.map((item) => (
              <div
                key={item.key}
                className={`h-full ${item.color}`}
                style={{ width: `${item.pct}%` }}
              />
            ))}
          </div>

          {/* Legend */}
          <div className="grid grid-cols-2 gap-3">
            {usageItems.map((item) => (
              <div key={item.key} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className={`w-2.5 h-2.5 rounded-full ${item.color}`} />
                  <span className="text-sm text-gray-700">{item.label}</span>
                </div>
                <div className="text-right">
                  <span className="text-sm font-semibold text-gray-900">
                    {formatCurrency((monthSpent * item.pct) / 100, currency)}
                  </span>
                  <span className="text-xs text-gray-400 ml-1">({item.pct}%)</span>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Stripe TODO Notice */}
        <div className="flex items-start gap-3 bg-gray-50 border border-gray-200 rounded-2xl px-5 py-4">
          <CreditCard className="w-4 h-4 text-gray-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-gray-700">Stripe Integration</p>
            <p className="text-sm text-gray-500 mt-0.5">
              TODO: Implementiere <code className="bg-gray-100 px-1 rounded text-xs">/api/billing/checkout</code> mit
              Stripe Checkout Session. Setze <code className="bg-gray-100 px-1 rounded text-xs">STRIPE_SECRET_KEY</code> und{" "}
              <code className="bg-gray-100 px-1 rounded text-xs">STRIPE_WEBHOOK_SECRET</code> in .env.
              Webhook-Handler: <code className="bg-gray-100 px-1 rounded text-xs">/api/billing/webhook</code> → update creditsBalance.
            </p>
          </div>
        </div>
      </main>
    </>
  );
}
