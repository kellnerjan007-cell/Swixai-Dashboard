export const dynamic = "force-dynamic";

import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { Topbar } from "@/components/customer/Topbar";
import { StatCard } from "@/components/customer/StatCard";
import { ChartCard } from "@/components/customer/ChartCard";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";

export default async function AnalyticsPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const membership = await db.membership.findFirst({
    where: { userId: session.user.id },
    select: { workspaceId: true },
    orderBy: { createdAt: "asc" },
  });

  const workspaceId = membership?.workspaceId;

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  // All calls this month with full fields for analytics
  const calls = workspaceId
    ? await db.call.findMany({
        where: { workspaceId, startedAt: { gte: monthStart } },
        select: {
          outcome: true,
          bookingStatus: true,
          durationSec: true,
          intent: true,
          startedAt: true,
        },
      })
    : [];

  const total = calls.length;
  const answered = calls.filter((c) => c.outcome === "answered").length;
  const booked = calls.filter((c) => c.bookingStatus === "booked").length;

  // ── Average duration ────────────────────────────────────────────────────────
  const withDuration = calls.filter((c) => c.durationSec && c.durationSec > 0);
  const avgSec =
    withDuration.length > 0
      ? withDuration.reduce((s, c) => s + (c.durationSec ?? 0), 0) / withDuration.length
      : 0;
  const avgDurationLabel =
    avgSec > 0
      ? `${Math.floor(avgSec / 60)}:${String(Math.round(avgSec % 60)).padStart(2, "0")}`
      : "–";

  // ── Peak hours (08:00–17:00) ─────────────────────────────────────────────
  const hourMap = new Map<number, number>();
  for (const call of calls) {
    const hour = new Date(call.startedAt).getHours();
    hourMap.set(hour, (hourMap.get(hour) ?? 0) + 1);
  }
  const peakHours = Array.from({ length: 10 }, (_, i) => {
    const hour = i + 8;
    return {
      hour: `${String(hour).padStart(2, "0")}:00`,
      calls: hourMap.get(hour) ?? 0,
    };
  });

  // ── Top intents ─────────────────────────────────────────────────────────
  const intentMap = new Map<string, number>();
  for (const call of calls) {
    if (call.intent) {
      intentMap.set(call.intent, (intentMap.get(call.intent) ?? 0) + 1);
    }
  }
  const topIntents = Array.from(intentMap.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([intent, count]) => ({
      intent,
      count,
      pct: total > 0 ? Math.round((count / total) * 100) : 0,
    }));

  // ── Conversion funnel ────────────────────────────────────────────────────
  const funnelData = [
    { stage: "Gesamt", count: total },
    { stage: "Beantwortet", count: answered },
    { stage: "Gebucht", count: booked },
  ];

  const conversionRate =
    total > 0 ? ((booked / total) * 100).toFixed(1) : "–";
  const answerRate =
    total > 0 ? Math.round((answered / total) * 100) : 0;

  return (
    <>
      <Topbar title="Analytics" subtitle="Diesen Monat" />
      <main className="flex-1 px-8 py-8 space-y-8">
        {/* KPIs */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Conversion Rate"
            value={conversionRate === "–" ? "–" : `${conversionRate}%`}
            subtext="Anruf → Buchung"
          />
          <StatCard
            title="Beantwortet"
            value={total > 0 ? `${answerRate}%` : "–"}
            subtext="Erfolgsquote"
          />
          <StatCard
            title="Gebuchte Termine"
            value={booked.toString()}
            subtext="diesen Monat"
          />
          <StatCard
            title="Ø Gesprächsdauer"
            value={avgDurationLabel}
            subtext="Minuten"
          />
        </div>

        {/* Peak Hours */}
        <ChartCard
          title="Peak Hours"
          subtitle="Anrufe nach Uhrzeit (diesen Monat)"
          data={peakHours}
          type="bar"
          dataKey="calls"
          xKey="hour"
          color="#6366f1"
        />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Funnel */}
          <Card>
            <h2 className="text-base font-semibold text-gray-900 mb-5">
              Conversion Funnel
            </h2>
            {total === 0 ? (
              <p className="text-sm text-gray-400 py-8 text-center">
                Noch keine Anrufe diesen Monat.
              </p>
            ) : (
              <div className="space-y-3">
                {funnelData.map((step, i) => {
                  const pct =
                    funnelData[0].count > 0
                      ? (step.count / funnelData[0].count) * 100
                      : 0;
                  return (
                    <div key={step.stage}>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-gray-700">{step.stage}</span>
                        <span className="font-semibold text-gray-900">
                          {step.count}{" "}
                          <span className="text-gray-400 font-normal text-xs">
                            ({pct.toFixed(0)}%)
                          </span>
                        </span>
                      </div>
                      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all"
                          style={{
                            width: `${pct}%`,
                            background:
                              i === 0
                                ? "#6366f1"
                                : i === 1
                                ? "#8b5cf6"
                                : i === 2
                                ? "#a78bfa"
                                : "#10b981",
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>

          {/* Top Intents */}
          <Card>
            <h2 className="text-base font-semibold text-gray-900 mb-5">
              Häufigste Themen
            </h2>
            {topIntents.length === 0 ? (
              <p className="text-sm text-gray-400 py-8 text-center">
                Noch keine Intent-Daten verfügbar.
                <br />
                <span className="text-xs">
                  Konfiguriere strukturierte Daten in deinem Vapi-Assistenten.
                </span>
              </p>
            ) : (
              <div className="space-y-3">
                {topIntents.map((item, i) => (
                  <div key={item.intent} className="flex items-center gap-3">
                    <span className="text-xs text-gray-400 w-4 text-right">
                      {i + 1}
                    </span>
                    <div className="flex-1">
                      <div className="flex justify-between mb-1">
                        <span className="text-sm text-gray-700">
                          {item.intent}
                        </span>
                        <div className="flex items-center gap-1.5">
                          <Badge variant="gray">{item.count}</Badge>
                          <span className="text-xs text-gray-400">
                            {item.pct}%
                          </span>
                        </div>
                      </div>
                      <div className="h-1.5 bg-gray-100 rounded-full">
                        <div
                          className="h-full bg-indigo-400 rounded-full"
                          style={{ width: `${item.pct}%` }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      </main>
    </>
  );
}
