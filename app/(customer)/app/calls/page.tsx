import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { Topbar } from "@/components/customer/Topbar";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { CallsTable } from "@/components/customer/CallsTable";
import { SyncCallsButton } from "@/components/customer/SyncCallsButton";
import { PhoneCall } from "lucide-react";

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
        actions={<SyncCallsButton />}
      />
      <main className="flex-1 px-8 py-8">
        {calls.length === 0 ? (
          <Card>
            <EmptyState
              icon={<PhoneCall className="w-5 h-5" />}
              title="Noch keine Anrufe"
              description="Klicke auf 'Vapi sync' um Anrufe von Vapi zu importieren."
            />
          </Card>
        ) : (
          <Card padding={false}>
            <CallsTable calls={calls} />
          </Card>
        )}
      </main>
    </>
  );
}
