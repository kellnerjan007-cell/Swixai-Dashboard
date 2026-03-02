"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { formatDate } from "@/lib/utils";
import { UserRound, Phone, ChevronRight, Trash2 } from "lucide-react";

const statusVariant: Record<string, "green" | "yellow" | "gray"> = {
  ACTIVE: "green",
  PAUSED: "yellow",
  DRAFT: "gray",
};

const statusLabel: Record<string, string> = {
  ACTIVE: "Aktiv",
  PAUSED: "Pausiert",
  DRAFT: "Entwurf",
};

interface AssistantItem {
  id: string;
  name: string;
  status: string;
  phoneNumber: string | null;
  _count: { calls: number };
  calls: { costTotal: number | null; startedAt: Date }[];
}

export function AssistantList({ assistants: initial }: { assistants: AssistantItem[] }) {
  const router = useRouter();
  const [assistants, setAssistants] = useState(initial);
  const [toDelete, setToDelete] = useState<AssistantItem | null>(null);
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    if (!toDelete) return;
    setDeleting(true);
    await fetch(`/api/assistants/${toDelete.id}`, { method: "DELETE" });
    setAssistants((prev) => prev.filter((a) => a.id !== toDelete.id));
    setToDelete(null);
    setDeleting(false);
    router.refresh();
  }

  return (
    <>
      <div className="space-y-3">
        {assistants.map((a) => {
          const costThisMonth = a.calls.reduce((s, c) => s + (c.costTotal ?? 0), 0);
          const lastCall = a.calls[0]?.startedAt;
          return (
            <div
              key={a.id}
              className="bg-white rounded-2xl border border-gray-200 shadow-sm px-6 py-4 flex items-center gap-5 hover:shadow-md hover:border-gray-300 transition"
            >
              {/* Avatar */}
              <div className="w-11 h-11 bg-indigo-50 rounded-xl flex items-center justify-center flex-shrink-0">
                <UserRound className="w-5 h-5 text-indigo-600" />
              </div>

              {/* Info — clickable */}
              <Link href={`/app/assistants/${a.id}`} className="flex-1 min-w-0 cursor-pointer">
                <div className="flex items-center gap-2 mb-0.5">
                  <p className="font-semibold text-gray-900 truncate">{a.name}</p>
                  <Badge variant={statusVariant[a.status] ?? "gray"}>
                    {statusLabel[a.status] ?? a.status}
                  </Badge>
                </div>
                <div className="flex items-center gap-4 text-sm text-gray-500">
                  <span className="flex items-center gap-1">
                    <Phone className="w-3.5 h-3.5" />
                    {a.phoneNumber ?? "Keine Nummer"}
                  </span>
                  <span>{a._count.calls} Anrufe gesamt</span>
                  {lastCall && <span>Letzter Anruf: {formatDate(lastCall)}</span>}
                </div>
              </Link>

              {/* Cost */}
              <div className="text-right flex-shrink-0">
                <p className="text-sm font-semibold text-gray-900">
                  € {costThisMonth.toFixed(2)}
                </p>
                <p className="text-xs text-gray-400">diesen Monat</p>
              </div>

              {/* Actions */}
              <button
                onClick={() => setToDelete(a)}
                className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition flex-shrink-0"
                title="Löschen"
              >
                <Trash2 className="w-4 h-4" />
              </button>

              <Link href={`/app/assistants/${a.id}`} className="flex-shrink-0">
                <ChevronRight className="w-4 h-4 text-gray-400" />
              </Link>
            </div>
          );
        })}
      </div>

      {/* Delete confirmation modal */}
      <Modal
        open={!!toDelete}
        onClose={() => setToDelete(null)}
        title="Assistent löschen"
        size="sm"
      >
        <p className="text-sm text-gray-600 mb-6">
          Möchtest du <strong>{toDelete?.name}</strong> wirklich löschen? Alle
          zugehörigen Daten werden unwiderruflich entfernt.
        </p>
        <div className="flex gap-3">
          <Button variant="danger" loading={deleting} onClick={handleDelete}>
            Löschen
          </Button>
          <Button variant="secondary" onClick={() => setToDelete(null)}>
            Abbrechen
          </Button>
        </div>
      </Modal>
    </>
  );
}
