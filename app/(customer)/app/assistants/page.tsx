import { redirect } from "next/navigation";
import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { Topbar } from "@/components/customer/Topbar";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { Button } from "@/components/ui/Button";
import { Plus, UserRound } from "lucide-react";
import { AssistantList } from "@/components/customer/AssistantList";

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
          <AssistantList assistants={assistants} />
        )}
      </main>
    </>
  );
}
