import { db } from "@/lib/db";
import { Card } from "@/components/ui/Card";
import { Table, Thead, Th, Tbody } from "@/components/ui/Table";
import { CustomerTableRow } from "@/components/admin/CustomerTableRow";

export default async function AdminCustomersPage() {
  const workspaces = await db.workspace.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      billing: true,
      _count: { select: { members: true, assistants: true, calls: true } },
      calls: {
        where: {
          startedAt: {
            gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
          },
        },
        select: { costTotal: true },
      },
    },
  });

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
              <Th>Revenue (Monat)</Th>
              <Th>Erstellt</Th>
              <Th className="w-8"></Th>
            </Thead>
            <Tbody>
              {workspaces.map((ws) => {
                const monthRevenue =
                  ws.calls.reduce((s, c) => s + (c.costTotal ?? 0), 0) * 1.4;
                return (
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
                    monthRevenue={monthRevenue}
                    createdAt={ws.createdAt}
                  />
                );
              })}
            </Tbody>
          </Table>
        </Card>
      </main>
    </div>
  );
}
