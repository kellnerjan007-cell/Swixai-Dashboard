import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { Topbar } from "@/components/customer/Topbar";
import { StatCard } from "@/components/customer/StatCard";
import { ChartCard } from "@/components/customer/ChartCard";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { formatCurrency } from "@/lib/utils";
import { PhoneCall, Clock, Euro, Zap, CheckCircle2, Activity } from "lucide-react";

// ─── Dummy Data (used until real provider integration) ─────────────────────
const callsPerDay = [
  { day: "01.02", calls: 8, cost: 2.4 },
  { day: "02.02", calls: 14, cost: 4.2 },
  { day: "03.02", calls: 11, cost: 3.3 },
  { day: "04.02", calls: 19, cost: 5.7 },
  { day: "05.02", calls: 7, cost: 2.1 },
  { day: "06.02", calls: 22, cost: 6.6 },
  { day: "07.02", calls: 16, cost: 4.8 },
  { day: "08.02", calls: 18, cost: 5.4 },
  { day: "09.02", calls: 12, cost: 3.6 },
  { day: "10.02", calls: 24, cost: 7.2 },
];

export default async function CustomerHomePage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  // Fetch workspace
  const membership = await db.membership.findFirst({
    where: { userId: session.user.id },
    include: {
      workspace: {
        include: {
          billing: true,
          assistants: { select: { id: true, status: true } },
          calls: {
            where: {
              startedAt: {
                gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
              },
            },
            select: { durationSec: true, costTotal: true, outcome: true },
          },
        },
      },
    },
    orderBy: { createdAt: "asc" },
  });

  const workspace = membership?.workspace;
  const calls = workspace?.calls ?? [];
  const billing = workspace?.billing;
  const assistants = workspace?.assistants ?? [];

  // KPI calculations
  const totalCalls = calls.length;
  const totalMinutes = Math.round(
    calls.reduce((s, c) => s + (c.durationSec ?? 0), 0) / 60
  );
  const totalCost = calls.reduce((s, c) => s + (c.costTotal ?? 0), 0);
  const successRate =
    totalCalls > 0
      ? Math.round(
          (calls.filter((c) => c.outcome === "answered").length / totalCalls) * 100
        )
      : 0;
  const avgDuration =
    totalCalls > 0
      ? Math.round(calls.reduce((s, c) => s + (c.durationSec ?? 0), 0) / totalCalls)
      : 0;
  const activeAssistants = assistants.filter((a) => a.status === "ACTIVE").length;
  const creditsBalance = billing?.creditsBalance ?? 0;

  return (
    <>
      <Topbar
        title="Übersicht"
        subtitle={`${new Date().toLocaleString("de-DE", { month: "long", year: "numeric" })}`}
      />
      <main className="flex-1 px-8 py-8 space-y-8">
        {/* KPI Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          <StatCard
            title="Anrufe"
            value={totalCalls.toString()}
            trend="+12%"
            trendDir="up"
            subtext="diesen Monat"
            icon={<PhoneCall className="w-4 h-4" />}
          />
          <StatCard
            title="Minuten"
            value={totalMinutes.toString()}
            trend="+8%"
            trendDir="up"
            subtext="diesen Monat"
            icon={<Clock className="w-4 h-4" />}
          />
          <StatCard
            title="Kosten"
            value={formatCurrency(totalCost)}
            trend="+5%"
            trendDir="down"
            subtext="diesen Monat"
            icon={<Euro className="w-4 h-4" />}
          />
          <StatCard
            title="Guthaben"
            value={formatCurrency(creditsBalance)}
            subtext="verfügbar"
            valueColor={creditsBalance > 10 ? "text-emerald-600" : "text-red-600"}
            icon={<Zap className="w-4 h-4" />}
          />
          <StatCard
            title="Erfolgsrate"
            value={`${successRate}%`}
            trend="+3%"
            trendDir="up"
            subtext="Anrufe beantwortet"
            icon={<CheckCircle2 className="w-4 h-4" />}
          />
          <StatCard
            title="Ø Dauer"
            value={`${Math.floor(avgDuration / 60)}:${String(avgDuration % 60).padStart(2, "0")}`}
            subtext="Minuten pro Anruf"
            icon={<Activity className="w-4 h-4" />}
          />
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ChartCard
            title="Anrufe pro Tag"
            subtitle="Letzten 10 Tage"
            data={callsPerDay}
            dataKey="calls"
            xKey="day"
            color="#6366f1"
          />
          <ChartCard
            title="Kosten pro Tag"
            subtitle="in EUR, letzten 10 Tage"
            data={callsPerDay}
            type="bar"
            dataKey="cost"
            xKey="day"
            color="#10b981"
            format="currency"
          />
        </div>

        {/* System Health + Active Assistants */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Health */}
          <Card>
            <h2 className="text-base font-semibold text-gray-900 mb-4">System Status</h2>
            <div className="space-y-3">
              {[
                { label: "Telefonie", ok: true },
                { label: "Webhook Endpoint", ok: true },
                { label: "KI Engine", ok: true },
                { label: "Kalender-Sync", ok: false, hint: "Nicht verbunden" },
              ].map((item) => (
                <div key={item.label} className="flex items-center justify-between py-1">
                  <span className="text-sm text-gray-700">{item.label}</span>
                  <div className="flex items-center gap-2">
                    {item.hint && (
                      <span className="text-xs text-gray-400">{item.hint}</span>
                    )}
                    <Badge variant={item.ok ? "green" : "yellow"}>
                      {item.ok ? "Online" : "Inaktiv"}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Quick stats */}
          <Card>
            <h2 className="text-base font-semibold text-gray-900 mb-4">Assistenten</h2>
            <div className="space-y-3">
              <div className="flex items-center justify-between py-1">
                <span className="text-sm text-gray-700">Aktive Assistenten</span>
                <span className="font-semibold text-gray-900">{activeAssistants}</span>
              </div>
              <div className="flex items-center justify-between py-1">
                <span className="text-sm text-gray-700">Gesamt Assistenten</span>
                <span className="font-semibold text-gray-900">{assistants.length}</span>
              </div>
              <div className="flex items-center justify-between py-1">
                <span className="text-sm text-gray-700">Plan</span>
                <Badge variant="blue">{workspace?.plan ?? "starter"}</Badge>
              </div>
              <div className="flex items-center justify-between py-1">
                <span className="text-sm text-gray-700">Workspace Status</span>
                <Badge variant={workspace?.status === "ACTIVE" ? "green" : "yellow"}>
                  {workspace?.status ?? "–"}
                </Badge>
              </div>
            </div>
          </Card>
        </div>
      </main>
    </>
  );
}
