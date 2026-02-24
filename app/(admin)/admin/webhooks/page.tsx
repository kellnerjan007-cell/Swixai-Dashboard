import { db } from "@/lib/db";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Table, Thead, Th, Tbody, Tr, Td } from "@/components/ui/Table";
import { formatDate } from "@/lib/utils";

const statusVariant: Record<string, "green" | "yellow" | "red" | "gray"> = {
  received: "yellow",
  processed: "green",
  failed: "red",
};

export default async function AdminWebhooksPage() {
  const logs = await db.webhookLog.findMany({
    orderBy: { createdAt: "desc" },
    take: 100,
    include: {
      workspace: { select: { name: true } },
    },
  });

  const failedCount = logs.filter((l) => l.status === "failed").length;
  const processedCount = logs.filter((l) => l.status === "processed").length;

  return (
    <div className="flex flex-col">
      <div className="bg-white border-b border-gray-100 px-8 py-4">
        <h1 className="text-xl font-bold text-gray-900">Webhook Logs</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          {logs.length} Logs · {failedCount} Fehler · {processedCount} Verarbeitet
        </p>
      </div>

      <main className="flex-1 px-8 py-8 space-y-6">
        {/* Summary */}
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: "Gesamt", value: logs.length, variant: "gray" as const },
            { label: "Verarbeitet", value: processedCount, variant: "green" as const },
            { label: "Fehler", value: failedCount, variant: "red" as const },
          ].map((item) => (
            <Card key={item.label}>
              <p className="text-sm text-gray-500 mb-1">{item.label}</p>
              <p className="text-3xl font-bold text-gray-900">{item.value}</p>
            </Card>
          ))}
        </div>

        {/* Webhook info */}
        <Card>
          <h2 className="text-base font-semibold text-gray-900 mb-3">
            Webhook Endpoint
          </h2>
          <div className="bg-gray-900 rounded-xl px-4 py-3">
            <code className="text-emerald-400 text-sm">
              POST{" "}
              {process.env.NEXTAUTH_URL ?? "https://your-domain.com"}
              /api/webhooks/call
            </code>
          </div>
          <p className="text-sm text-gray-500 mt-3">
            Konfiguriere diesen Endpunkt in deinem Voice Provider (Twilio, Vapi, Retell).
            Erwartete Events: <code className="bg-gray-100 px-1 rounded text-xs">call-started</code>,{" "}
            <code className="bg-gray-100 px-1 rounded text-xs">call-ended</code>,{" "}
            <code className="bg-gray-100 px-1 rounded text-xs">call-failed</code>
          </p>
        </Card>

        {/* Logs Table */}
        <Card padding={false}>
          <Table>
            <Thead>
              <Th>Zeit</Th>
              <Th>Provider</Th>
              <Th>Event</Th>
              <Th>Workspace</Th>
              <Th>Status</Th>
              <Th>Fehler</Th>
            </Thead>
            <Tbody>
              {logs.map((log) => (
                <Tr key={log.id}>
                  <Td>{formatDate(log.createdAt)}</Td>
                  <Td>
                    <Badge variant="gray">{log.provider}</Badge>
                  </Td>
                  <Td>
                    <code className="text-xs bg-gray-100 px-1.5 py-0.5 rounded">
                      {log.event ?? "–"}
                    </code>
                  </Td>
                  <Td>{log.workspace?.name ?? "–"}</Td>
                  <Td>
                    <Badge variant={statusVariant[log.status] ?? "gray"}>
                      {log.status}
                    </Badge>
                  </Td>
                  <Td>
                    {log.error ? (
                      <span className="text-xs text-red-600 truncate max-w-xs block">
                        {log.error}
                      </span>
                    ) : (
                      "–"
                    )}
                  </Td>
                </Tr>
              ))}
              {logs.length === 0 && (
                <Tr>
                  <Td colSpan={6} className="text-center py-12 text-gray-400">
                    Noch keine Webhook-Logs
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
