import { redirect } from "next/navigation";
import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { Topbar } from "@/components/customer/Topbar";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { Table, Thead, Th, Tbody, Tr, Td } from "@/components/ui/Table";
import { formatDate, formatDuration } from "@/lib/utils";
import { PhoneCall, ChevronRight } from "lucide-react";

const outcomeLabel: Record<string, string> = {
  answered: "Beantwortet",
  voicemail: "Voicemail",
  missed: "Verpasst",
  transferred: "Weitergeleitet",
  failed: "Fehlgeschlagen",
};
const outcomeVariant: Record<string, "green" | "yellow" | "gray" | "red"> = {
  answered: "green",
  voicemail: "yellow",
  missed: "gray",
  transferred: "blue" as "gray",
  failed: "red",
};

export default async function CallsPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const membership = await db.membership.findFirst({
    where: { userId: session.user.id },
    select: { workspaceId: true },
    orderBy: { createdAt: "asc" },
  });

  const calls = membership
    ? await db.call.findMany({
        where: { workspaceId: membership.workspaceId },
        orderBy: { startedAt: "desc" },
        take: 100,
        include: {
          assistant: { select: { name: true } },
        },
      })
    : [];

  return (
    <>
      <Topbar
        title="Anrufverlauf"
        subtitle={`${calls.length} Anrufe`}
      />
      <main className="flex-1 px-8 py-8">
        {calls.length === 0 ? (
          <Card>
            <EmptyState
              icon={<PhoneCall className="w-5 h-5" />}
              title="Noch keine Anrufe"
              description="Sobald dein Assistent Anrufe entgegennimmt, erscheinen sie hier."
            />
          </Card>
        ) : (
          <Card padding={false}>
            <Table>
              <Thead>
                <Th>Zeitpunkt</Th>
                <Th>Anrufer</Th>
                <Th>Assistent</Th>
                <Th>Dauer</Th>
                <Th>Ergebnis</Th>
                <Th>Kosten</Th>
                <Th className="w-8"></Th>
              </Thead>
              <Tbody>
                {calls.map((call) => (
                  <Link key={call.id} href={`/app/calls/${call.id}`} legacyBehavior>
                    <Tr onClick={() => {}}>
                      <Td>
                        <span className="text-sm font-medium text-gray-900">
                          {formatDate(call.startedAt)}
                        </span>
                      </Td>
                      <Td>
                        <span className="font-mono text-sm">
                          {call.fromNumber ?? "–"}
                        </span>
                      </Td>
                      <Td>
                        <span className="text-sm">
                          {call.assistant?.name ?? "–"}
                        </span>
                      </Td>
                      <Td>
                        {call.durationSec != null
                          ? formatDuration(call.durationSec)
                          : "–"}
                      </Td>
                      <Td>
                        {call.outcome ? (
                          <Badge
                            variant={
                              outcomeVariant[call.outcome] ?? "gray"
                            }
                          >
                            {outcomeLabel[call.outcome] ?? call.outcome}
                          </Badge>
                        ) : (
                          "–"
                        )}
                      </Td>
                      <Td>
                        {call.costTotal != null
                          ? `€ ${call.costTotal.toFixed(4)}`
                          : "–"}
                      </Td>
                      <Td>
                        <ChevronRight className="w-4 h-4 text-gray-400" />
                      </Td>
                    </Tr>
                  </Link>
                ))}
              </Tbody>
            </Table>
          </Card>
        )}
      </main>
    </>
  );
}
