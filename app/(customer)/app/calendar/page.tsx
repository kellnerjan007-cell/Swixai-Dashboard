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
import { CheckCircle2, AlertCircle, ExternalLink } from "lucide-react";

const ERROR_MESSAGES: Record<string, string> = {
  no_client_id: "Google Client ID ist nicht konfiguriert.",
  no_ms_client_id: "Microsoft Client ID nicht konfiguriert. Trage MICROSOFT_CLIENT_ID in die .env ein.",
  access_denied: "Google-Zugriff wurde verweigert.",
  ms_access_denied: "Microsoft-Zugriff wurde verweigert.",
  token_exchange: "Google-Verbindungsfehler. Bitte erneut versuchen.",
  ms_token_exchange: "Microsoft-Verbindungsfehler. Bitte erneut versuchen.",
  no_workspace: "Kein Workspace gefunden.",
};

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
    </svg>
  );
}

function AppleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor">
      <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
    </svg>
  );
}

function CalendlyIcon() {
  // Calendly brand mark: open "C" arc, opening to the right
  return (
    <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
      <path d="M16 5.07 A8 8 0 1 0 16 18.93" />
    </svg>
  );
}

function MicrosoftIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none">
      <rect x="1" y="1" width="10" height="10" fill="#F25022"/>
      <rect x="13" y="1" width="10" height="10" fill="#7FBA00"/>
      <rect x="1" y="13" width="10" height="10" fill="#00A4EF"/>
      <rect x="13" y="13" width="10" height="10" fill="#FFB900"/>
    </svg>
  );
}


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
          bookingDate: { gte: new Date(year, month - 1, 1), lt: new Date(year, month, 1) },
        },
        include: { assistant: { select: { name: true } } },
        orderBy: { bookingDate: "asc" },
      })
    : [];

  return (
    <>
      <Topbar title="Kalender" subtitle={`${bookings.length} Buchung${bookings.length !== 1 ? "en" : ""} diesen Monat`} />
      <main className="flex-1 px-8 py-8 space-y-6">

        {params.success && (
          <div className="flex items-center gap-3 bg-emerald-50 dark:bg-emerald-950 border border-emerald-200 dark:border-emerald-900 rounded-2xl px-5 py-4">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
            <p className="text-sm font-medium text-emerald-800 dark:text-emerald-300">
              {params.success === "microsoft" ? "Microsoft Outlook erfolgreich verbunden!" : "Google Kalender erfolgreich verbunden!"}
            </p>
          </div>
        )}

        {params.error && (
          <div className="flex items-center gap-3 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-900 rounded-2xl px-5 py-4">
            <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
            <p className="text-sm text-red-700 dark:text-red-400">{ERROR_MESSAGES[params.error] ?? params.error}</p>
          </div>
        )}

        {/* Integrations */}
        <div>
          <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-3">Kalender-Integrationen</h2>
          <div className="grid grid-cols-2 gap-4">
            <Card>
              <ProviderCard
                label="Google Kalender"
                icon={<GoogleIcon />}
                iconBg="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700"
                connected={!!googleConn}
                calendarId={googleConn?.calendarId ?? null}
                connectedAt={googleConn?.connectedAt ?? null}
                connectHref="/api/calendar/connect"
                disconnectAction="/api/calendar/disconnect?provider=GOOGLE"
              />
            </Card>
            <Card>
              <ProviderCard
                label="Microsoft Outlook"
                icon={<MicrosoftIcon />}
                iconBg="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700"
                connected={!!msConn}
                calendarId={msConn?.calendarId ?? null}
                connectedAt={msConn?.connectedAt ?? null}
                connectHref="/api/calendar/microsoft/connect"
                disconnectAction="/api/calendar/disconnect?provider=MICROSOFT"
              />
            </Card>
            <Card>
              <ProviderCard
                label="Apple Calendar"
                icon={<AppleIcon />}
                iconBg="bg-gray-900 dark:bg-white text-white dark:text-gray-900"
                connected={false}
                calendarId={null}
                connectedAt={null}
                connectHref="/api/calendar/apple/connect"
                disconnectAction="/api/calendar/disconnect?provider=APPLE"
              />
            </Card>
            <Card>
              <ProviderCard
                label="Calendly"
                icon={<CalendlyIcon />}
                iconBg="bg-blue-600 text-white"
                connected={false}
                calendarId={null}
                connectedAt={null}
                connectHref="/api/calendar/calendly/connect"
                disconnectAction="/api/calendar/disconnect?provider=CALENDLY"
              />
            </Card>
          </div>
        </div>

        {/* Calendar */}
        <Card>
          <BookingsCalendar year={year} month={month} bookings={bookings} />
        </Card>

      </main>
    </>
  );
}

function ProviderCard({
  label, icon, iconBg, connected, calendarId, connectedAt,
  connectHref, disconnectAction,
}: {
  label: string;
  icon: React.ReactNode;
  iconBg: string;
  connected: boolean;
  calendarId: string | null;
  connectedAt: Date | null;
  connectHref: string;
  disconnectAction: string;
}) {
  return (
    <div className="flex flex-col gap-3 h-full">
      <div className="flex items-start gap-3">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${iconBg}`}>
          {icon}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5 flex-wrap">
            <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">{label}</p>
            <Badge variant={connected ? "green" : "gray"}>
              {connected ? <><CheckCircle2 className="w-3 h-3" />Aktiv</> : "–"}
            </Badge>
          </div>
          {connected ? (
            <>
              {calendarId && <p className="text-xs font-mono text-gray-400 dark:text-gray-500 truncate">{calendarId}</p>}
              {connectedAt && <p className="text-xs text-gray-400 dark:text-gray-500">Seit {formatDate(connectedAt)}</p>}
            </>
          ) : (
            <p className="text-xs text-gray-400 dark:text-gray-500">Nicht verbunden</p>
          )}
        </div>
      </div>

      <div className="mt-auto pt-1">
        {connected ? (
          <form action={disconnectAction} method="POST">
            <Button variant="ghost" size="sm" type="submit" className="w-full">
              Trennen
            </Button>
          </form>
        ) : (
          <a href={connectHref} className="block">
            <Button size="sm" className="w-full">
              <ExternalLink className="w-3.5 h-3.5" />
              Verbinden
            </Button>
          </a>
        )}
      </div>
    </div>
  );
}
