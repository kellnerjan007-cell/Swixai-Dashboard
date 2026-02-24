import { db } from "@/lib/db";
import { Card } from "@/components/ui/Card";
import { Table, Thead, Th, Tbody, Tr, Td } from "@/components/ui/Table";
import { ChartCard } from "@/components/customer/ChartCard";
import { formatCurrency } from "@/lib/utils";

export default async function AdminUsagePage() {
  const workspaces = await db.workspace.findMany({
    include: {
      billing: true,
      calls: {
        select: { costTotal: true, durationSec: true },
      },
      assistants: { select: { id: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  const rows = workspaces.map((ws) => {
    const totalCost = ws.calls.reduce((s, c) => s + (c.costTotal ?? 0), 0);
    const revenue = totalCost * 1.4;
    const margin = revenue - totalCost;
    const totalMinutes = Math.round(
      ws.calls.reduce((s, c) => s + (c.durationSec ?? 0), 0) / 60
    );
    return {
      id: ws.id,
      name: ws.name,
      plan: ws.plan,
      calls: ws.calls.length,
      minutes: totalMinutes,
      cost: totalCost,
      revenue,
      margin,
      credits: ws.billing?.creditsBalance ?? 0,
    };
  });

  const totalRevenue = rows.reduce((s, r) => s + r.revenue, 0);
  const totalCost = rows.reduce((s, r) => s + r.cost, 0);
  const totalMargin = totalRevenue - totalCost;

  // Monthly trend (mock – implement with real date grouping)
  const trend = [
    { month: "Sep", revenue: 420, cost: 252 },
    { month: "Okt", revenue: 680, cost: 408 },
    { month: "Nov", revenue: 850, cost: 510 },
    { month: "Dez", revenue: 1100, cost: 660 },
    { month: "Jan", revenue: 1380, cost: 828 },
    { month: "Feb", revenue: totalRevenue || 1620, cost: totalCost || 972 },
  ];

  function csvDownload() {
    // This is client-side CSV – server-side alternative: export route
    return null;
  }

  return (
    <div className="flex flex-col">
      <div className="bg-white border-b border-gray-100 px-8 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Usage & Finance</h1>
          <p className="text-sm text-gray-500 mt-0.5">Alle Zeiträume</p>
        </div>
        <a
          href="/api/admin/usage/export"
          className="text-sm text-indigo-600 hover:underline"
        >
          CSV exportieren ↓
        </a>
      </div>

      <main className="flex-1 px-8 py-8 space-y-8">
        {/* Summary */}
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: "Gesamt Revenue", value: formatCurrency(totalRevenue), sub: "Alle Kunden" },
            { label: "Gesamt Kosten", value: formatCurrency(totalCost), sub: "Provider-Kosten" },
            {
              label: "Gross Margin",
              value: formatCurrency(totalMargin),
              sub:
                totalRevenue > 0
                  ? `${((totalMargin / totalRevenue) * 100).toFixed(0)}%`
                  : "–",
            },
          ].map((item) => (
            <Card key={item.label}>
              <p className="text-sm text-gray-500 mb-1">{item.label}</p>
              <p className="text-2xl font-bold text-gray-900">{item.value}</p>
              <p className="text-xs text-gray-400 mt-1">{item.sub}</p>
            </Card>
          ))}
        </div>

        {/* Revenue vs Cost Chart */}
        <div className="grid grid-cols-2 gap-6">
          <ChartCard
            title="Revenue Trend"
            data={trend}
            type="bar"
            dataKey="revenue"
            xKey="month"
            color="#6366f1"
            format="currency"
          />
          <ChartCard
            title="Kosten Trend"
            data={trend}
            type="bar"
            dataKey="cost"
            xKey="month"
            color="#ef4444"
            format="currency"
          />
        </div>

        {/* Per-customer table */}
        <Card padding={false}>
          <div className="px-6 py-4 border-b border-gray-100">
            <h2 className="text-base font-semibold text-gray-900">
              Pro Kunde
            </h2>
          </div>
          <Table>
            <Thead>
              <Th>Workspace</Th>
              <Th>Plan</Th>
              <Th>Anrufe</Th>
              <Th>Minuten</Th>
              <Th>Kosten</Th>
              <Th>Revenue</Th>
              <Th>Margin</Th>
              <Th>Guthaben</Th>
            </Thead>
            <Tbody>
              {rows.map((row) => (
                <Tr key={row.id}>
                  <Td>
                    <a
                      href={`/admin/customers/${row.id}`}
                      className="font-medium text-gray-900 hover:text-indigo-600"
                    >
                      {row.name}
                    </a>
                  </Td>
                  <Td>{row.plan}</Td>
                  <Td>{row.calls}</Td>
                  <Td>{row.minutes}</Td>
                  <Td>{formatCurrency(row.cost)}</Td>
                  <Td>{formatCurrency(row.revenue)}</Td>
                  <Td>
                    <span className={row.margin > 0 ? "text-emerald-600" : "text-red-600"}>
                      {formatCurrency(row.margin)}
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
                <Tr>
                  <Td colSpan={8} className="text-center py-12 text-gray-400">
                    Keine Daten
                  </Td>
                </Tr>
              )}
            </Tbody>
          </Table>
        </Card>
      </main>
    </div>
  );
}
