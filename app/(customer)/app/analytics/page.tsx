import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { Topbar } from "@/components/customer/Topbar";
import { StatCard } from "@/components/customer/StatCard";
import { ChartCard } from "@/components/customer/ChartCard";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { BarChart3 } from "lucide-react";

// Peak hours dummy (real data: aggregate by hour from calls table)
const peakHours = [
  { hour: "08:00", calls: 3 },
  { hour: "09:00", calls: 12 },
  { hour: "10:00", calls: 18 },
  { hour: "11:00", calls: 22 },
  { hour: "12:00", calls: 9 },
  { hour: "13:00", calls: 7 },
  { hour: "14:00", calls: 20 },
  { hour: "15:00", calls: 25 },
  { hour: "16:00", calls: 17 },
  { hour: "17:00", calls: 8 },
];

const topIntents = [
  { intent: "Termin buchen", count: 45, pct: 36 },
  { intent: "Preis anfragen", count: 28, pct: 22 },
  { intent: "Öffnungszeiten", count: 21, pct: 17 },
  { intent: "Beschwerde", count: 15, pct: 12 },
  { intent: "Sonstiges", count: 16, pct: 13 },
];

export default async function AnalyticsPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const membership = await db.membership.findFirst({
    where: { userId: session.user.id },
    select: { workspaceId: true },
    orderBy: { createdAt: "asc" },
  });

  const calls = membership
    ? await db.call.findMany({
        where: {
          workspaceId: membership.workspaceId,
          startedAt: {
            gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
          },
        },
        select: { outcome: true, bookingStatus: true, durationSec: true },
      })
    : [];

  const total = calls.length;
  const answered = calls.filter((c) => c.outcome === "answered").length;
  const booked = calls.filter((c) => c.bookingStatus === "booked").length;

  // Funnel
  const funnelData = [
    { stage: "Gesamt", count: total || 124 },
    { stage: "Beantwortet", count: answered || 98 },
    { stage: "Qualifiziert", count: Math.round((answered || 98) * 0.72) },
    { stage: "Gebucht", count: booked || 34 },
  ];

  const conversionRate = total > 0 ? ((booked / total) * 100).toFixed(1) : "–";

  return (
    <>
      <Topbar title="Analytics" subtitle="Diesen Monat" />
      <main className="flex-1 px-8 py-8 space-y-8">
        {/* KPIs */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Conversion Rate"
            value={`${conversionRate}%`}
            trend="+4%"
            trendDir="up"
            subtext="Anruf → Buchung"
          />
          <StatCard
            title="Beantwortet"
            value={`${total > 0 ? Math.round((answered / total) * 100) : 79}%`}
            trend="+2%"
            trendDir="up"
            subtext="Erfolgsquote"
          />
          <StatCard
            title="Gebuchte Termine"
            value={(booked || 34).toString()}
            trend="+18%"
            trendDir="up"
            subtext="diesen Monat"
          />
          <StatCard
            title="Ø Gesprächsdauer"
            value="3:12"
            subtext="Minuten"
          />
        </div>

        {/* Peak Hours */}
        <ChartCard
          title="Peak Hours"
          subtitle="Anrufe nach Uhrzeit"
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
                          background: i === 0 ? "#6366f1" : i === 1 ? "#8b5cf6" : i === 2 ? "#a78bfa" : "#10b981",
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>

          {/* Top Intents */}
          <Card>
            <h2 className="text-base font-semibold text-gray-900 mb-5">
              Häufigste Themen
            </h2>
            <div className="space-y-3">
              {topIntents.map((item, i) => (
                <div key={item.intent} className="flex items-center gap-3">
                  <span className="text-xs text-gray-400 w-4 text-right">{i + 1}</span>
                  <div className="flex-1">
                    <div className="flex justify-between mb-1">
                      <span className="text-sm text-gray-700">{item.intent}</span>
                      <div className="flex items-center gap-1.5">
                        <Badge variant="gray">{item.count}</Badge>
                        <span className="text-xs text-gray-400">{item.pct}%</span>
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
          </Card>
        </div>

        {/* Placeholder notice */}
        <div className="flex items-start gap-3 bg-amber-50 border border-amber-100 rounded-2xl px-5 py-4">
          <BarChart3 className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-amber-700">
            Teile der Analytics basieren auf Dummy-Daten. Sobald dein Voice Provider
            (Twilio/Vapi/Retell) Anrufe liefert, werden echte Daten angezeigt.
          </p>
        </div>
      </main>
    </>
  );
}
