import { db } from "@/lib/db";
import { Card } from "@/components/ui/Card";
import { Table, Thead, Th, Tbody } from "@/components/ui/Table";
import { CustomerTableRow } from "@/components/admin/CustomerTableRow";

export default async function AdminCustomersPage() {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const [workspaces, paymentsThisMonth] = await Promise.all([
    db.workspace.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        billing: true,
        _count: { select: { members: true, assistants: true, calls: true } },
        calls: {
          where: { startedAt: { gte: startOfMonth } },
          select: { costTotal: true },
        },
      },
    }),
    db.webhookLog.findMany({
      where: {
        provider: "stripe",
        status: "processed",
        event: "checkout.session.completed",
        createdAt: { gte: startOfMonth },
      },
      select: { payloadJson: true },
    }),
  ]);

  // Revenue per workspace this month from real Stripe payments
  const revenueByWorkspace = new Map<string, number>();
  for (const log of paymentsThisMonth) {
    const p = log.payloadJson as Record<string, unknown> | null;
    const wsId = p?.workspaceId as string | undefined;
    const amount = typeof p?.amount === "number" ? p.amount : 0;
    if (wsId) revenueByWorkspace.set(wsId, (revenueByWorkspace.get(wsId) ?? 0) + amount);
  }

  return (
    <div className="flex flex-col">
      <div className="bg-white border-b border-gray-100 px-8 py-4">
        <h1 className="text-xl font-bold text-gray-900">Kunden</h1>
        <p className="text-sm text-gray-500 mt-0.5">{workspaces.length} Workspaces</p>
      </div>

      <main className="flex-1 px-8 py-8">
        <Card padding={false}>
          <Table>
            <Thead>
              <Th>Workspace</Th>
              <Th>Plan</Th>
              <Th>Status</Th>
              <Th>Mitglieder</Th>
              <Th>Assistenten</Th>
              <Th>Anrufe (Monat)</Th>
              <Th>Guthaben</Th>
              <Th>Eingezahlt (Monat)</Th>
              <Th>Erstellt</Th>
              <Th className="w-8"></Th>
            </Thead>
            <Tbody>
              {workspaces.map((ws) => (
                <CustomerTableRow
                  key={ws.id}
                  id={ws.id}
                  name={ws.name}
                  slug={ws.slug}
                  plan={ws.plan}
                  status={ws.status}
                  memberCount={ws._count.members}
                  assistantCount={ws._count.assistants}
                  callCount={ws.calls.length}
                  creditsBalance={ws.billing?.creditsBalance ?? null}
                  monthRevenue={revenueByWorkspace.get(ws.id) ?? 0}
                  createdAt={ws.createdAt}
                />
              ))}
            </Tbody>
          </Table>
        </Card>
      </main>
    </div>
  );
}
