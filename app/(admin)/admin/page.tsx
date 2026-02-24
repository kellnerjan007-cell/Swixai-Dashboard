import { db } from "@/lib/db";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { StatCard } from "@/components/customer/StatCard";
import { ChartCard } from "@/components/customer/ChartCard";
import { formatCurrency } from "@/lib/utils";
import { Users, PhoneCall, TrendingUp, Euro, Activity } from "lucide-react";

// MRR/Revenue trend (dummy until billing history implemented)
const revenueTrend = [
  { month: "Sep", mrr: 420 },
  { month: "Okt", mrr: 680 },
  { month: "Nov", mrr: 850 },
  { month: "Dez", mrr: 1100 },
  { month: "Jan", mrr: 1380 },
  { month: "Feb", mrr: 1620 },
];

export default async function AdminOverviewPage() {
  const [workspaces, calls, assistants] = await Promise.all([
    db.workspace.findMany({
      where: { status: { not: "SUSPENDED" } },
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
        _count: { select: { members: true, assistants: true } },
      },
      orderBy: { createdAt: "desc" },
    }),
    db.call.findMany({
      where: {
        startedAt: {
          gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
        },
      },
      select: { costTotal: true },
    }),
    db.assistant.count({ where: { status: "ACTIVE" } }),
  ]);

  const totalCustomers = workspaces.length;
  const totalCallsMonth = calls.length;
  const totalCostMonth = calls.reduce((s, c) => s + (c.costTotal ?? 0), 0);

  // Revenue = cost + margin (assume 40% margin for demo)
  const totalRevenue = totalCostMonth * 1.4;
  const grossMargin = totalRevenue - totalCostMonth;
  const marginPct = totalRevenue > 0 ? ((grossMargin / totalRevenue) * 100).toFixed(0) : "–";

  // "Churn signals": workspaces with 0 calls this month
  const churnRisk = workspaces.filter((w) => w.calls.length === 0).length;

  const activeWorkspaces = workspaces.filter(
    (w) => w.calls.length > 0
  ).length;

  return (
    <div className="flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 px-8 py-4">
        <h1 className="text-xl font-bold text-gray-900">Admin Übersicht</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          {new Date().toLocaleString("de-DE", { month: "long", year: "numeric" })}
        </p>
      </div>

      <main className="flex-1 px-8 py-8 space-y-8">
        {/* KPI Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
          <StatCard
            title="Kunden"
            value={totalCustomers.toString()}
            trend="+3"
            trendDir="up"
            subtext="Workspaces"
            icon={<Users className="w-4 h-4" />}
          />
          <StatCard
            title="Anrufe (Monat)"
            value={totalCallsMonth.toString()}
            trend="+22%"
            trendDir="up"
            subtext="diesen Monat"
            icon={<PhoneCall className="w-4 h-4" />}
          />
          <StatCard
            title="Revenue"
            value={formatCurrency(totalRevenue)}
            trend="+18%"
            trendDir="up"
            subtext="diesen Monat"
            icon={<Euro className="w-4 h-4" />}
          />
          <StatCard
            title="Gross Margin"
            value={`${marginPct}%`}
            subtext={formatCurrency(grossMargin)}
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

        {/* Revenue Chart */}
        <ChartCard
          title="MRR Entwicklung"
          subtitle="Letzten 6 Monate"
          data={revenueTrend}
          type="bar"
          dataKey="mrr"
          xKey="month"
          color="#6366f1"
          format="currency"
        />

        {/* Customer Table */}
        <Card>
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-base font-semibold text-gray-900">Alle Kunden</h2>
            <a
              href="/admin/customers"
              className="text-sm text-indigo-600 hover:underline"
            >
              Alle anzeigen →
            </a>
          </div>
          <div className="space-y-2">
            {workspaces.slice(0, 8).map((ws) => {
              const wsRevenue =
                ws.calls.reduce((s, c) => s + (c.costTotal ?? 0), 0) * 1.4;
              return (
                <a key={ws.id} href={`/admin/customers/${ws.id}`}>
                  <div className="flex items-center gap-4 px-4 py-3 rounded-xl hover:bg-gray-50 transition cursor-pointer">
                    <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center text-xs font-bold text-gray-500 flex-shrink-0">
                      {ws.name.slice(0, 2).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-900 truncate">
                        {ws.name}
                      </p>
                      <p className="text-xs text-gray-400">
                        {ws._count.members} User · {ws._count.assistants} Assistenten
                      </p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-sm font-semibold text-gray-900">
                        {formatCurrency(wsRevenue)}
                      </p>
                      <p className="text-xs text-gray-400">{ws.calls.length} Anrufe</p>
                    </div>
                    <Badge
                      variant={
                        ws.status === "ACTIVE"
                          ? ws.calls.length > 0
                            ? "green"
                            : "yellow"
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
