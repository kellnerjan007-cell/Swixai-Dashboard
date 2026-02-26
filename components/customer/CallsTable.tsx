"use client";

import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/Badge";
import { Table, Thead, Th, Tbody, Td } from "@/components/ui/Table";
import { formatDate, formatDuration } from "@/lib/utils";
import { ChevronRight } from "lucide-react";

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

interface CallRow {
  id: string;
  startedAt: Date;
  fromNumber: string | null;
  durationSec: number | null;
  outcome: string | null;
  costTotal: number | null;
  assistant: { name: string } | null;
}

export function CallsTable({ calls }: { calls: CallRow[] }) {
  const router = useRouter();

  return (
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
          <tr
            key={call.id}
            onClick={() => router.push(`/app/calls/${call.id}`)}
            className="hover:bg-gray-50 transition cursor-pointer border-b border-gray-50 last:border-0"
          >
            <Td>
              <span className="text-sm font-medium text-gray-900">
                {formatDate(call.startedAt)}
              </span>
            </Td>
            <Td>
              <span className="font-mono text-sm">{call.fromNumber ?? "–"}</span>
            </Td>
            <Td>
              <span className="text-sm">{call.assistant?.name ?? "–"}</span>
            </Td>
            <Td>
              {call.durationSec != null ? formatDuration(call.durationSec) : "–"}
            </Td>
            <Td>
              {call.outcome ? (
                <Badge variant={outcomeVariant[call.outcome] ?? "gray"}>
                  {outcomeLabel[call.outcome] ?? call.outcome}
                </Badge>
              ) : (
                "–"
              )}
            </Td>
            <Td>
              {call.costTotal != null ? `€ ${call.costTotal.toFixed(4)}` : "–"}
            </Td>
            <Td>
              <ChevronRight className="w-4 h-4 text-gray-400" />
            </Td>
          </tr>
        ))}
      </Tbody>
    </Table>
  );
}
