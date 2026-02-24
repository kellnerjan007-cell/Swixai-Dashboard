import { redirect } from "next/navigation";
import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { Topbar } from "@/components/customer/Topbar";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { Button } from "@/components/ui/Button";
import { formatDate } from "@/lib/utils";
import { Plus, UserRound, Phone, ChevronRight } from "lucide-react";

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

export default async function AssistantsPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const membership = await db.membership.findFirst({
    where: { userId: session.user.id },
    select: { workspaceId: true },
    orderBy: { createdAt: "asc" },
  });

  const assistants = membership
    ? await db.assistant.findMany({
        where: { workspaceId: membership.workspaceId },
        orderBy: { createdAt: "desc" },
        include: {
          _count: { select: { calls: true } },
          calls: {
            where: {
              startedAt: {
                gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
              },
            },
            select: { costTotal: true, startedAt: true },
            orderBy: { startedAt: "desc" },
            take: 1,
          },
        },
      })
    : [];

  return (
    <>
      <Topbar
        title="Assistenten"
        subtitle={`${assistants.length} Assistent${assistants.length !== 1 ? "en" : ""}`}
        actions={
          <Link href="/app/assistants/new">
            <Button size="sm">
              <Plus className="w-4 h-4" />
              Neu erstellen
            </Button>
          </Link>
        }
      />
      <main className="flex-1 px-8 py-8">
        {assistants.length === 0 ? (
          <Card>
            <EmptyState
              icon={<UserRound className="w-5 h-5" />}
              title="Noch kein Assistent"
              description="Erstelle deinen ersten KI-Assistenten und verbinde ihn mit einer Telefonnummer."
              action={
                <Link href="/app/assistants/new">
                  <Button>
                    <Plus className="w-4 h-4" />
                    Ersten Assistenten erstellen
                  </Button>
                </Link>
              }
            />
          </Card>
        ) : (
          <div className="space-y-3">
            {assistants.map((a) => {
              const costThisMonth = a.calls.reduce(
                (s, c) => s + (c.costTotal ?? 0),
                0
              );
              const lastCall = a.calls[0]?.startedAt;
              return (
                <Link key={a.id} href={`/app/assistants/${a.id}`}>
                  <div className="bg-white rounded-2xl border border-gray-200 shadow-sm px-6 py-4 flex items-center gap-5 hover:shadow-md hover:border-gray-300 transition cursor-pointer">
                    {/* Avatar */}
                    <div className="w-11 h-11 bg-indigo-50 rounded-xl flex items-center justify-center flex-shrink-0">
                      <UserRound className="w-5 h-5 text-indigo-600" />
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
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
                        {lastCall && (
                          <span>Letzter Anruf: {formatDate(lastCall)}</span>
                        )}
                      </div>
                    </div>

                    {/* Cost this month */}
                    <div className="text-right flex-shrink-0">
                      <p className="text-sm font-semibold text-gray-900">
                        € {costThisMonth.toFixed(2)}
                      </p>
                      <p className="text-xs text-gray-400">diesen Monat</p>
                    </div>

                    <ChevronRight className="w-4 h-4 text-gray-400 flex-shrink-0" />
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </main>
    </>
  );
}
