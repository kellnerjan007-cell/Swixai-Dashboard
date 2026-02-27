import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { Topbar } from "@/components/customer/Topbar";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { formatDate } from "@/lib/utils";
import { CalendarDays, CheckCircle2, AlertCircle, ExternalLink, RefreshCw } from "lucide-react";

const ERROR_MESSAGES: Record<string, string> = {
  no_client_id: "Google Client ID ist nicht konfiguriert. Trage GOOGLE_CLIENT_ID in die .env ein.",
  access_denied: "Google-Zugriff wurde verweigert.",
  token_exchange: "Fehler beim Verbinden mit Google. Bitte erneut versuchen.",
  no_workspace: "Kein Workspace gefunden.",
};

export default async function CalendarPage({
  searchParams,
}: {
  searchParams: Promise<{ success?: string; error?: string }>;
}) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const params = await searchParams;
  const connectSuccess = params.success === "1";
  const connectError = params.error;

  const membership = await db.membership.findFirst({
    where: { userId: session.user.id },
    select: { workspaceId: true },
    orderBy: { createdAt: "asc" },
  });

  const connection = membership
    ? await db.calendarConnection.findFirst({
        where: { workspaceId: membership.workspaceId },
        orderBy: { connectedAt: "desc" },
      })
    : null;

  const recentBookings = membership
    ? await db.call.findMany({
        where: { workspaceId: membership.workspaceId, bookingStatus: "booked" },
        orderBy: { startedAt: "desc" },
        take: 5,
        include: { assistant: { select: { name: true } } },
      })
    : [];

  const isConnected = !!connection;

  return (
    <>
      <Topbar title="Google Kalender" subtitle="Kalender-Integration" />
      <main className="flex-1 px-8 py-8 space-y-6">
        {connectSuccess && (
          <div className="flex items-center gap-3 bg-emerald-50 border border-emerald-200 rounded-2xl px-5 py-4">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            <p className="text-sm font-medium text-emerald-800">Google Kalender erfolgreich verbunden!</p>
          </div>
        )}
        {connectError && (
          <div className="flex items-center gap-3 bg-red-50 border border-red-200 rounded-2xl px-5 py-4">
            <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
            <p className="text-sm text-red-700">{ERROR_MESSAGES[connectError] ?? connectError}</p>
          </div>
        )}
        {/* Connection Status */}
        <Card>
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-4">
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${isConnected ? "bg-emerald-50" : "bg-gray-100"}`}>
                <CalendarDays className={`w-6 h-6 ${isConnected ? "text-emerald-600" : "text-gray-400"}`} />
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h2 className="text-base font-semibold text-gray-900">Google Kalender</h2>
                  <Badge variant={isConnected ? "green" : "gray"}>
                    {isConnected ? (
                      <><CheckCircle2 className="w-3 h-3" /> Verbunden</>
                    ) : (
                      "Nicht verbunden"
                    )}
                  </Badge>
                </div>
                {isConnected ? (
                  <>
                    <p className="text-sm text-gray-500">
                      Kalender-ID: <span className="font-mono">{connection.calendarId ?? "–"}</span>
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      Verbunden seit: {formatDate(connection.connectedAt)}
                    </p>
                  </>
                ) : (
                  <p className="text-sm text-gray-500">
                    Verbinde deinen Google Kalender, damit Assistenten Termine buchen können.
                  </p>
                )}
              </div>
            </div>

            <div className="flex gap-2">
              {isConnected ? (
                <>
                  <a href="/app/calendar">
                    <Button variant="secondary" size="sm">
                      <RefreshCw className="w-4 h-4" />
                      Sync
                    </Button>
                  </a>
                  <form action="/api/calendar/disconnect" method="POST">
                    <Button variant="ghost" size="sm" type="submit">
                      Trennen
                    </Button>
                  </form>
                </>
              ) : (
                <a href="/api/calendar/connect">
                  <Button size="sm">
                    <ExternalLink className="w-4 h-4" />
                    Mit Google verbinden
                  </Button>
                </a>
              )}
            </div>
          </div>
        </Card>

        {/* Setup Instructions (when not connected) */}
        {!isConnected && (
          <Card>
            <div className="flex items-start gap-3 mb-4">
              <AlertCircle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
              <h2 className="text-base font-semibold text-gray-900">Setup-Anleitung</h2>
            </div>
            <ol className="space-y-3 text-sm text-gray-600">
              {[
                'Öffne die Google Cloud Console → APIs & Services → OAuth 2.0',
                'Erstelle ein OAuth 2.0 Client ID (Web Application)',
                `Authorized redirect URI: ${process.env.NEXTAUTH_URL ?? "http://localhost:3000"}/api/calendar/callback`,
                'Kopiere GOOGLE_CLIENT_ID und GOOGLE_CLIENT_SECRET in deine .env Datei',
                'Aktiviere die Google Calendar API in deiner Cloud Console',
                'Klicke dann auf "Mit Google verbinden" oben',
              ].map((step, i) => (
                <li key={i} className="flex items-start gap-3">
                  <span className="w-5 h-5 bg-gray-900 text-white rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">
                    {i + 1}
                  </span>
                  <span>{step}</span>
                </li>
              ))}
            </ol>
          </Card>
        )}

        {/* Recent Bookings */}
        <Card>
          <h2 className="text-base font-semibold text-gray-900 mb-4">
            Letzte Buchungen
          </h2>
          {recentBookings.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-8">
              Noch keine Buchungen über den Assistenten
            </p>
          ) : (
            <div className="space-y-3">
              {recentBookings.map((call) => (
                <div
                  key={call.id}
                  className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0"
                >
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {call.fromNumber ?? "Unbekannt"}
                    </p>
                    <p className="text-xs text-gray-400">
                      via {call.assistant?.name ?? "–"} · {formatDate(call.startedAt)}
                    </p>
                  </div>
                  <Badge variant="green">Gebucht</Badge>
                </div>
              ))}
            </div>
          )}
        </Card>
      </main>
    </>
  );
}
