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
import { SetupGuide } from "@/components/customer/SetupGuide";

export default async function CustomerHomePage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const membership = await db.membership.findFirst({
    where: { userId: session.user.id },
    include: {
      workspace: {
        include: {
          billing: true,
          assistants: { select: { id: true, status: true } },
          calendarConnections: { select: { id: true } },
        },
      },
    },
    orderBy: { createdAt: "asc" },
  });

  const workspace = membership?.workspace;
  const billing = workspace?.billing;
  const assistants = workspace?.assistants ?? [];
  const calendarConnected = (workspace?.calendarConnections?.length ?? 0) > 0;

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  // Calls this month for KPIs
  const monthCalls = workspace
    ? await db.call.findMany({
        where: { workspaceId: workspace.id, startedAt: { gte: monthStart } },
        select: { durationSec: true, costTotal: true, outcome: true },
      })
    : [];

  // Calls last 14 days for charts — grouped by day
  const chartStart = new Date(now);
  chartStart.setDate(now.getDate() - 13);
  chartStart.setHours(0, 0, 0, 0);

  const recentCalls = workspace
    ? await db.call.findMany({
        where: { workspaceId: workspace.id, startedAt: { gte: chartStart } },
        select: { startedAt: true, costTotal: true },
        orderBy: { startedAt: "asc" },
      })
    : [];

  // Build per-day buckets for last 14 days
  const callsPerDay = Array.from({ length: 14 }, (_, i) => {
    const d = new Date(chartStart);
    d.setDate(chartStart.getDate() + i);
    const dayStr = d.toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit" });

    const dayStart = new Date(d);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(d);
    dayEnd.setHours(23, 59, 59, 999);

    const dayCalls = recentCalls.filter(
      (c) => new Date(c.startedAt) >= dayStart && new Date(c.startedAt) <= dayEnd
    );

    return {
      day: dayStr,
      calls: dayCalls.length,
      cost: parseFloat(dayCalls.reduce((s, c) => s + (c.costTotal ?? 0), 0).toFixed(4)),
    };
  });

  // KPI calculations from this month
  const totalCalls = monthCalls.length;
  const totalMinutes = Math.round(
    monthCalls.reduce((s, c) => s + (c.durationSec ?? 0), 0) / 60
  );
  const totalCost = monthCalls.reduce((s, c) => s + (c.costTotal ?? 0), 0);
  const successRate =
    totalCalls > 0
      ? Math.round(
          (monthCalls.filter((c) => c.outcome === "answered").length / totalCalls) * 100
        )
      : 0;
  const avgDuration =
    totalCalls > 0
      ? Math.round(monthCalls.reduce((s, c) => s + (c.durationSec ?? 0), 0) / totalCalls)
      : 0;
  const activeAssistants = assistants.filter((a) => a.status === "ACTIVE").length;
  const creditsBalance = billing?.creditsBalance ?? 0;

  // Setup guide state
  const vapiKeySet = !!workspace?.vapiApiKey;
  const hasAssistant = assistants.length > 0;
  const hasCredits = creditsBalance > 0;
  const showSetupGuide = !vapiKeySet || !hasAssistant || !hasCredits;

  return (
    <>
      <Topbar
        title="Übersicht"
        subtitle={`${now.toLocaleString("de-DE", { month: "long", year: "numeric" })}`}
      />
      <main className="flex-1 px-8 py-8 space-y-8">
        {/* Onboarding guide — shown until all critical steps are done */}
        {showSetupGuide && (
          <SetupGuide
            steps={[
              {
                title: "Vapi API Key hinterlegen",
                description:
                  "Verbinde deinen Vapi-Account, damit Anrufe, Kosten und Transkripte automatisch synchronisiert werden.",
                href: "/app/settings",
                done: vapiKeySet,
              },
              {
                title: "Ersten Assistenten anlegen",
                description:
                  "Erstelle deinen ersten KI-Assistenten – gib ihm einen Namen, eine Sprache und einen System-Prompt.",
                href: "/app/assistants/new",
                done: hasAssistant,
              },
              {
                title: "Guthaben aufladen",
                description:
                  "Lade Guthaben auf, damit Anrufe abgerechnet werden können.",
                href: "/app/billing",
                done: hasCredits,
              },
              {
                title: "Kalender verbinden",
                description:
                  "Verbinde Google Calendar für automatische Terminbuchungen durch den Assistenten.",
                href: "/app/calendar",
                done: calendarConnected,
                optional: true,
              },
            ]}
          />
        )}

        {/* KPI Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          <StatCard
            title="Anrufe"
            value={totalCalls.toString()}
            subtext="diesen Monat"
            icon={<PhoneCall className="w-4 h-4" />}
          />
          <StatCard
            title="Minuten"
            value={totalMinutes.toString()}
            subtext="diesen Monat"
            icon={<Clock className="w-4 h-4" />}
          />
          <StatCard
            title="Kosten"
            value={formatCurrency(totalCost)}
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
            value={totalCalls > 0 ? `${successRate}%` : "–"}
            subtext="Anrufe beantwortet"
            icon={<CheckCircle2 className="w-4 h-4" />}
          />
          <StatCard
            title="Ø Dauer"
            value={
              avgDuration > 0
                ? `${Math.floor(avgDuration / 60)}:${String(avgDuration % 60).padStart(2, "0")}`
                : "–"
            }
            subtext="Minuten pro Anruf"
            icon={<Activity className="w-4 h-4" />}
          />
        </div>

        {/* Charts — real data from last 14 days */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ChartCard
            title="Anrufe pro Tag"
            subtitle="Letzte 14 Tage"
            data={callsPerDay}
            dataKey="calls"
            xKey="day"
            color="#6366f1"
          />
          <ChartCard
            title="Kosten pro Tag"
            subtitle="in EUR, letzte 14 Tage"
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
          <Card>
            <h2 className="text-base font-semibold text-gray-900 mb-4">System Status</h2>
            <div className="space-y-3">
              {[
                { label: "Telefonie", ok: true },
                { label: "Webhook Endpoint", ok: true },
                { label: "KI Engine", ok: true },
                {
                  label: "Kalender-Sync",
                  ok: calendarConnected,
                  hint: calendarConnected ? undefined : "Nicht verbunden",
                },
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
