import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { Topbar } from "@/components/customer/Topbar";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { BookingsCalendar } from "@/components/customer/BookingsCalendar";
import { formatDate } from "@/lib/utils";
import { CalendarDays, CheckCircle2, AlertCircle, ExternalLink } from "lucide-react";

const ERROR_MESSAGES: Record<string, string> = {
  no_client_id: "Google Client ID ist nicht konfiguriert.",
  no_ms_client_id: "Microsoft Client ID nicht konfiguriert. Trage MICROSOFT_CLIENT_ID in die .env ein.",
  access_denied: "Google-Zugriff wurde verweigert.",
  ms_access_denied: "Microsoft-Zugriff wurde verweigert.",
  token_exchange: "Google-Verbindungsfehler. Bitte erneut versuchen.",
  ms_token_exchange: "Microsoft-Verbindungsfehler. Bitte erneut versuchen.",
  no_workspace: "Kein Workspace gefunden.",
};

export default async function CalendarPage({
  searchParams,
}: {
  searchParams: Promise<{ success?: string; error?: string; month?: string }>;
}) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const params = await searchParams;
  const now = new Date();
  let year = now.getFullYear();
  let month = now.getMonth() + 1;
  if (params.month && /^\d{4}-\d{2}$/.test(params.month)) {
    const [y, m] = params.month.split("-").map(Number);
    if (y >= 2020 && y <= 2100 && m >= 1 && m <= 12) { year = y; month = m; }
  }

  const membership = await db.membership.findFirst({
    where: { userId: session.user.id },
    select: { workspaceId: true },
    orderBy: { createdAt: "asc" },
  });

  const connections = membership
    ? await db.calendarConnection.findMany({ where: { workspaceId: membership.workspaceId } })
    : [];

  const googleConn = connections.find((c) => c.provider === "GOOGLE") ?? null;
  const msConn = connections.find((c) => c.provider === "MICROSOFT") ?? null;

  const bookings = membership
    ? await db.call.findMany({
        where: {
          workspaceId: membership.workspaceId,
          bookingStatus: "booked",
          startedAt: { gte: new Date(year, month - 1, 1), lt: new Date(year, month, 1) },
        },
        include: { assistant: { select: { name: true } } },
        orderBy: { startedAt: "asc" },
      })
    : [];

  return (
    <>
      <Topbar title="Kalender" subtitle={`${bookings.length} Buchung${bookings.length !== 1 ? "en" : ""} diesen Monat`} />
      <main className="flex-1 px-8 py-8 space-y-6">

        {params.success && (
          <div className="flex items-center gap-3 bg-emerald-50 border border-emerald-200 rounded-2xl px-5 py-4">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            <p className="text-sm font-medium text-emerald-800">
              {params.success === "microsoft" ? "Microsoft Outlook erfolgreich verbunden!" : "Google Kalender erfolgreich verbunden!"}
            </p>
          </div>
        )}

        {params.error && (
          <div className="flex items-center gap-3 bg-red-50 border border-red-200 rounded-2xl px-5 py-4">
            <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
            <p className="text-sm text-red-700">{ERROR_MESSAGES[params.error] ?? params.error}</p>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card>
            <ProviderCard label="Google Kalender" connected={!!googleConn}
              calendarId={googleConn?.calendarId ?? null} connectedAt={googleConn?.connectedAt ?? null}
              connectHref="/api/calendar/connect" disconnectAction="/api/calendar/disconnect?provider=GOOGLE" />
          </Card>
          <Card>
            <ProviderCard label="Microsoft Outlook" connected={!!msConn}
              calendarId={msConn?.calendarId ?? null} connectedAt={msConn?.connectedAt ?? null}
              connectHref="/api/calendar/microsoft/connect" disconnectAction="/api/calendar/disconnect?provider=MICROSOFT" />
          </Card>
        </div>

        <Card>
          <BookingsCalendar year={year} month={month} bookings={bookings} />
        </Card>

      </main>
    </>
  );
}

function ProviderCard({ label, connected, calendarId, connectedAt, connectHref, disconnectAction }: {
  label: string; connected: boolean; calendarId: string | null;
  connectedAt: Date | null; connectHref: string; disconnectAction: string;
}) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div className="flex items-start gap-3">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${connected ? "bg-emerald-50" : "bg-gray-100"}`}>
          <CalendarDays className={`w-5 h-5 ${connected ? "text-emerald-600" : "text-gray-400"}`} />
        </div>
        <div>
          <div className="flex items-center gap-2 mb-0.5">
            <h3 className="text-sm font-semibold text-gray-900">{label}</h3>
            <Badge variant={connected ? "green" : "gray"}>
              {connected ? <><CheckCircle2 className="w-3 h-3" />Verbunden</> : "Nicht verbunden"}
            </Badge>
          </div>
          {connected && calendarId && <p className="text-xs font-mono text-gray-400 truncate max-w-[180px]">{calendarId}</p>}
          {connected && connectedAt && <p className="text-xs text-gray-400">Seit {formatDate(connectedAt)}</p>}
          {!connected && <p className="text-xs text-gray-500">Nicht verbunden</p>}
        </div>
      </div>
      <div className="flex-shrink-0">
        {connected ? (
          <form action={disconnectAction} method="POST">
            <Button variant="ghost" size="sm" type="submit">Trennen</Button>
          </form>
        ) : (
          <a href={connectHref}>
            <Button size="sm"><ExternalLink className="w-3.5 h-3.5" />Verbinden</Button>
          </a>
        )}
      </div>
    </div>
  );
}
