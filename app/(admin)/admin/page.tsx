import { db } from "@/lib/db";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { StatCard } from "@/components/customer/StatCard";
import { ChartCard } from "@/components/customer/ChartCard";
import { formatCurrency } from "@/lib/utils";
import { Users, PhoneCall, TrendingUp, Euro, Activity } from "lucide-react";

export default async function AdminOverviewPage() {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);

  const [workspaces, callsThisMonth, callsLastMonth, paymentsAll] = await Promise.all([
    db.workspace.findMany({
      where: { status: { not: "SUSPENDED" } },
      include: {
        billing: true,
        calls: {
          where: { startedAt: { gte: startOfMonth } },
          select: { costTotal: true },
        },
        _count: { select: { members: true, assistants: true } },
      },
      orderBy: { createdAt: "desc" },
    }),
    db.call.findMany({
      where: { startedAt: { gte: startOfMonth } },
      select: { costTotal: true },
    }),
    db.call.findMany({
      where: { startedAt: { gte: startOfLastMonth, lt: startOfMonth } },
      select: { costTotal: true },
    }),
    // Real revenue from Stripe payments stored in webhookLogs
    db.webhookLog.findMany({
      where: { provider: "stripe", status: "processed", event: "checkout.session.completed" },
      select: { payloadJson: true, createdAt: true },
    }),
  ]);

  // ── Revenue from actual Stripe payments ──────────────────────────────────
  function getAmount(log: { payloadJson: unknown }): number {
    const p = log.payloadJson as Record<string, unknown> | null;
    return typeof p?.amount === "number" ? p.amount : 0;
  }

  const revenueThisMonth = paymentsAll
    .filter((p) => p.createdAt >= startOfMonth)
    .reduce((s, p) => s + getAmount(p), 0);

  const revenueLastMonth = paymentsAll
    .filter((p) => p.createdAt >= startOfLastMonth && p.createdAt < startOfMonth)
    .reduce((s, p) => s + getAmount(p), 0);

  const costThisMonth = callsThisMonth.reduce((s, c) => s + (c.costTotal ?? 0), 0);

  const grossMargin = revenueThisMonth - costThisMonth;
  const marginPct = revenueThisMonth > 0
    ? `${((grossMargin / revenueThisMonth) * 100).toFixed(0)}%`
    : "–";

  // Month-over-month trends
  function momTrend(curr: number, prev: number): { label: string; dir: "up" | "down" | "neutral" } {
    if (prev === 0) return { label: curr > 0 ? "Neu" : "–", dir: "neutral" };
    const pct = ((curr - prev) / prev) * 100;
    return {
      label: `${pct >= 0 ? "+" : ""}${pct.toFixed(0)}%`,
      dir: pct > 0 ? "up" : pct < 0 ? "down" : "neutral",
    };
  }

  const revTrend = momTrend(revenueThisMonth, revenueLastMonth);
  const callTrend = momTrend(callsThisMonth.length, callsLastMonth.length);

  const totalCustomers = workspaces.length;
  const activeWorkspaces = workspaces.filter((w) => w.calls.length > 0).length;
  const churnRisk = workspaces.filter((w) => w.calls.length === 0).length;

  // ── MRR Trend: last 6 months from real Stripe payments ───────────────────
  const revenueTrend = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
    const next = new Date(d.getFullYear(), d.getMonth() + 1, 1);
    const mrr = paymentsAll
      .filter((p) => p.createdAt >= d && p.createdAt < next)
      .reduce((s, p) => s + getAmount(p), 0);
    return {
      month: d.toLocaleString("de-DE", { month: "short" }),
      mrr,
    };
  });

  return (
    <div className="flex flex-col">
      <div className="bg-white border-b border-gray-100 px-8 py-4">
        <h1 className="text-xl font-bold text-gray-900">Admin Übersicht</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          {now.toLocaleString("de-DE", { month: "long", year: "numeric" })}
        </p>
      </div>

      <main className="flex-1 px-8 py-8 space-y-8">
        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
          <StatCard
            title="Kunden"
            value={totalCustomers.toString()}
            subtext="Workspaces"
            icon={<Users className="w-4 h-4" />}
          />
          <StatCard
            title="Anrufe (Monat)"
            value={callsThisMonth.length.toString()}
            trend={callTrend.label}
            trendDir={callTrend.dir}
            subtext="vs. Vormonat"
            icon={<PhoneCall className="w-4 h-4" />}
          />
          <StatCard
            title="Revenue (Monat)"
            value={formatCurrency(revenueThisMonth)}
            trend={revTrend.label}
            trendDir={revTrend.dir}
            subtext="Stripe-Zahlungen"
            icon={<Euro className="w-4 h-4" />}
          />
          <StatCard
            title="Gross Margin"
            value={marginPct}
            subtext={revenueThisMonth > 0 ? formatCurrency(grossMargin) : "Noch keine Einnahmen"}
            icon={<TrendingUp className="w-4 h-4" />}
          />
          <StatCard
            title="Aktive Kunden"
            value={`${activeWorkspaces}/${totalCustomers}`}
            subtext={`${churnRisk} ohne Anrufe`}
            trendDir={churnRisk > 0 ? "down" : "neutral"}
            trend={churnRisk > 0 ? `${churnRisk} Risiko` : undefined}
            icon={<Activity className="w-4 h-4" />}
          />
        </div>

        <ChartCard
          title="Revenue Entwicklung"
          subtitle="Letzten 6 Monate (Stripe-Zahlungen)"
          data={revenueTrend}
          type="bar"
          dataKey="mrr"
          xKey="month"
          color="#6366f1"
          format="currency"
        />

        <Card>
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-base font-semibold text-gray-900">Alle Kunden</h2>
            <a href="/admin/customers" className="text-sm text-indigo-600 hover:underline">
              Alle anzeigen →
            </a>
          </div>
          <div className="space-y-2">
            {workspaces.slice(0, 8).map((ws) => {
              const wsMonthCost = ws.calls.reduce((s, c) => s + (c.costTotal ?? 0), 0);
              const wsRevenue = paymentsAll
                .filter((p) => {
                  const pj = p.payloadJson as Record<string, unknown> | null;
                  return pj?.workspaceId === ws.id && p.createdAt >= startOfMonth;
                })
                .reduce((s, p) => s + getAmount(p), 0);

              return (
                <a key={ws.id} href={`/admin/customers/${ws.id}`}>
                  <div className="flex items-center gap-4 px-4 py-3 rounded-xl hover:bg-gray-50 transition cursor-pointer">
                    <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center text-xs font-bold text-gray-500 flex-shrink-0">
                      {ws.name.slice(0, 2).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-900 truncate">{ws.name}</p>
                      <p className="text-xs text-gray-400">
                        {ws._count.members} User · {ws._count.assistants} Assistenten
                      </p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-sm font-semibold text-gray-900">
                        {wsRevenue > 0 ? formatCurrency(wsRevenue) : formatCurrency(ws.billing?.creditsBalance ?? 0) + " Guthaben"}
                      </p>
                      <p className="text-xs text-gray-400">{ws.calls.length} Anrufe · {formatCurrency(wsMonthCost)} Kosten</p>
                    </div>
                    <Badge
                      variant={
                        ws.status === "ACTIVE"
                          ? ws.calls.length > 0 ? "green" : "yellow"
                          : "gray"
                      }
                    >
                      {ws.calls.length > 0 ? "Aktiv" : "Inaktiv"}
                    </Badge>
                  </div>
                </a>
              );
            })}
          </div>
        </Card>
      </main>
    </div>
  );
}
