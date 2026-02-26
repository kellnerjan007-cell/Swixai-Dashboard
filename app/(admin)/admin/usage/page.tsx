import { db } from "@/lib/db";
import { Card } from "@/components/ui/Card";
import { Table, Thead, Th, Tbody, Tr, Td } from "@/components/ui/Table";
import { ChartCard } from "@/components/customer/ChartCard";
import { formatCurrency } from "@/lib/utils";

export default async function AdminUsagePage() {
  const now = new Date();

  const [workspaces, paymentsAll] = await Promise.all([
    db.workspace.findMany({
      include: {
        billing: true,
        calls: { select: { costTotal: true, durationSec: true } },
        assistants: { select: { id: true } },
      },
      orderBy: { createdAt: "desc" },
    }),
    db.webhookLog.findMany({
      where: { provider: "stripe", status: "processed", event: "checkout.session.completed" },
      select: { payloadJson: true, createdAt: true },
    }),
  ]);

  function getPayment(log: { payloadJson: unknown }) {
    const p = log.payloadJson as Record<string, unknown> | null;
    return {
      amount: typeof p?.amount === "number" ? p.amount : 0,
      workspaceId: p?.workspaceId as string | undefined,
    };
  }

  // Per-workspace revenue = total Stripe payments ever made
  const revenueByWorkspace = new Map<string, number>();
  for (const log of paymentsAll) {
    const { amount, workspaceId } = getPayment(log);
    if (workspaceId) {
      revenueByWorkspace.set(workspaceId, (revenueByWorkspace.get(workspaceId) ?? 0) + amount);
    }
  }

  const rows = workspaces.map((ws) => {
    const totalCost = ws.calls.reduce((s, c) => s + (c.costTotal ?? 0), 0);
    const revenue = revenueByWorkspace.get(ws.id) ?? 0;
    const margin = revenue - totalCost;
    const totalMinutes = Math.round(ws.calls.reduce((s, c) => s + (c.durationSec ?? 0), 0) / 60);
    return { id: ws.id, name: ws.name, plan: ws.plan, calls: ws.calls.length, minutes: totalMinutes, cost: totalCost, revenue, margin, credits: ws.billing?.creditsBalance ?? 0 };
  });

  const totalRevenue = rows.reduce((s, r) => s + r.revenue, 0);
  const totalCost = rows.reduce((s, r) => s + r.cost, 0);
  const totalMargin = totalRevenue - totalCost;

  // Revenue trend: real Stripe payments grouped by month
  const revenueTrend = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
    const next = new Date(d.getFullYear(), d.getMonth() + 1, 1);
    const revenue = paymentsAll
      .filter((p) => p.createdAt >= d && p.createdAt < next)
      .reduce((s, p) => s + getPayment(p).amount, 0);
    return { month: d.toLocaleString("de-DE", { month: "short" }), revenue };
  });

  // Cost trend: Vapi call costs grouped by month
  const since = new Date(now.getFullYear(), now.getMonth() - 5, 1);
  const recentCalls = await db.call.findMany({
    where: { startedAt: { gte: since } },
    select: { startedAt: true, costTotal: true },
  });

  const costTrend = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
    const next = new Date(d.getFullYear(), d.getMonth() + 1, 1);
    const cost = recentCalls
      .filter((c) => new Date(c.startedAt) >= d && new Date(c.startedAt) < next)
      .reduce((s, c) => s + (c.costTotal ?? 0), 0);
    return { month: d.toLocaleString("de-DE", { month: "short" }), cost };
  });

  return (
    <div className="flex flex-col">
      <div className="bg-white border-b border-gray-100 px-8 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Usage & Finance</h1>
          <p className="text-sm text-gray-500 mt-0.5">Alle Zeiträume</p>
        </div>
        <a href="/api/admin/usage/export" className="text-sm text-indigo-600 hover:underline">
          CSV exportieren ↓
        </a>
      </div>

      <main className="flex-1 px-8 py-8 space-y-8">
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: "Gesamt Revenue", value: formatCurrency(totalRevenue), sub: "Stripe-Zahlungen aller Kunden" },
            { label: "Gesamt Kosten", value: formatCurrency(totalCost), sub: "Vapi API-Kosten" },
            {
              label: "Gross Margin",
              value: formatCurrency(totalMargin),
              sub: totalRevenue > 0 ? `${((totalMargin / totalRevenue) * 100).toFixed(0)}%` : "–",
            },
          ].map((item) => (
            <Card key={item.label}>
              <p className="text-sm text-gray-500 mb-1">{item.label}</p>
              <p className="text-2xl font-bold text-gray-900">{item.value}</p>
              <p className="text-xs text-gray-400 mt-1">{item.sub}</p>
            </Card>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-6">
          <ChartCard
            title="Revenue Trend"
            subtitle="Stripe-Zahlungen pro Monat"
            data={revenueTrend}
            type="bar"
            dataKey="revenue"
            xKey="month"
            color="#6366f1"
            format="currency"
          />
          <ChartCard
            title="Kosten Trend"
            subtitle="Vapi API-Kosten pro Monat"
            data={costTrend}
            type="bar"
            dataKey="cost"
            xKey="month"
            color="#ef4444"
            format="currency"
          />
        </div>

        <Card padding={false}>
          <div className="px-6 py-4 border-b border-gray-100">
            <h2 className="text-base font-semibold text-gray-900">Pro Kunde</h2>
          </div>
          <Table>
            <Thead>
              <Th>Workspace</Th><Th>Plan</Th><Th>Anrufe</Th><Th>Minuten</Th>
              <Th>API-Kosten</Th><Th>Eingezahlt</Th><Th>Margin</Th><Th>Guthaben</Th>
            </Thead>
            <Tbody>
              {rows.map((row) => (
                <Tr key={row.id}>
                  <Td>
                    <a href={`/admin/customers/${row.id}`} className="font-medium text-gray-900 hover:text-indigo-600">
                      {row.name}
                    </a>
                  </Td>
                  <Td>{row.plan}</Td>
                  <Td>{row.calls}</Td>
                  <Td>{row.minutes}</Td>
                  <Td>{formatCurrency(row.cost)}</Td>
                  <Td>{formatCurrency(row.revenue)}</Td>
                  <Td>
                    <span className={row.revenue === 0 ? "text-gray-400" : row.margin >= 0 ? "text-emerald-600" : "text-red-600"}>
                      {row.revenue === 0 ? "–" : formatCurrency(row.margin)}
                    </span>
                  </Td>
                  <Td>
                    <span className={row.credits < 5 ? "text-red-600 font-medium" : ""}>
                      {formatCurrency(row.credits)}
                    </span>
                  </Td>
                </Tr>
              ))}
              {rows.length === 0 && (
                <Tr><Td colSpan={8} className="text-center py-12 text-gray-400">Keine Daten</Td></Tr>
              )}
            </Tbody>
          </Table>
        </Card>
      </main>
    </div>
  );
}
