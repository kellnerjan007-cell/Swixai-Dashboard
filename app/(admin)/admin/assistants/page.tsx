import Link from "next/link";
import { db } from "@/lib/db";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Table, Thead, Th, Tbody, Tr, Td } from "@/components/ui/Table";
import { formatDate } from "@/lib/utils";

const statusVariant: Record<string, "green" | "yellow" | "gray"> = {
  ACTIVE: "green",
  PAUSED: "yellow",
  DRAFT: "gray",
};

export default async function AdminAssistantsPage() {
  const assistants = await db.assistant.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      workspace: { select: { id: true, name: true } },
      _count: { select: { calls: true } },
    },
  });

  return (
    <div className="flex flex-col">
      <div className="bg-white border-b border-gray-100 px-8 py-4">
        <h1 className="text-xl font-bold text-gray-900">Alle Assistenten</h1>
        <p className="text-sm text-gray-500 mt-0.5">{assistants.length} Assistenten</p>
      </div>

      <main className="flex-1 px-8 py-8">
        <Card padding={false}>
          <Table>
            <Thead>
              <Th>Name</Th>
              <Th>Workspace</Th>
              <Th>Status</Th>
              <Th>Stimme</Th>
              <Th>Sprache</Th>
              <Th>Telefon</Th>
              <Th>Anrufe</Th>
              <Th>Erstellt</Th>
            </Thead>
            <Tbody>
              {assistants.map((a) => (
                <Tr key={a.id}>
                  <Td>
                    <span className="font-medium text-gray-900">{a.name}</span>
                  </Td>
                  <Td>
                    <Link
                      href={`/admin/customers/${a.workspace.id}`}
                      className="text-indigo-600 hover:underline text-sm"
                    >
                      {a.workspace.name}
                    </Link>
                  </Td>
                  <Td>
                    <Badge variant={statusVariant[a.status] ?? "gray"}>
                      {a.status}
                    </Badge>
                  </Td>
                  <Td>{a.voice}</Td>
                  <Td>{a.language}</Td>
                  <Td>
                    <span className="font-mono text-sm">
                      {a.phoneNumber ?? "–"}
                    </span>
                  </Td>
                  <Td>{a._count.calls}</Td>
                  <Td>{formatDate(a.createdAt)}</Td>
                </Tr>
              ))}
              {assistants.length === 0 && (
                <Tr>
                  <Td colSpan={8} className="text-center text-gray-400 py-12">
                    Keine Assistenten gefunden
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
