import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { formatDate, formatDuration, formatCurrency } from "@/lib/utils";
import { ArrowLeft, Phone, Clock, Mic, FileText, Tag, Calendar } from "lucide-react";

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
  failed: "red",
};

export default async function CallDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const membership = await db.membership.findFirst({
    where: { userId: session.user.id },
    select: { workspaceId: true },
    orderBy: { createdAt: "asc" },
  });
  if (!membership) notFound();

  const call = await db.call.findFirst({
    where: { id, workspaceId: membership.workspaceId },
    include: { assistant: { select: { name: true } } },
  });
  if (!call) notFound();

  const costBreakdown = call.costBreakdownJson as Record<string, number> | null;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 px-8 py-4 flex items-center gap-3">
        <Link
          href="/app/calls"
          className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 transition"
        >
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div className="flex items-center gap-2">
          <h1 className="text-lg font-bold text-gray-900">Anruf Details</h1>
          {call.outcome && (
            <Badge variant={outcomeVariant[call.outcome] ?? "gray"}>
              {outcomeLabel[call.outcome] ?? call.outcome}
            </Badge>
          )}
        </div>
      </div>

      <main className="max-w-3xl mx-auto px-8 py-8 space-y-6">
        {/* Meta */}
        <Card>
          <h2 className="text-base font-semibold text-gray-900 mb-4">Übersicht</h2>
          <div className="grid grid-cols-2 gap-4">
            {[
              { icon: Calendar, label: "Zeitpunkt", value: formatDate(call.startedAt) },
              { icon: Phone, label: "Anrufer", value: call.fromNumber ?? "–" },
              { icon: Mic, label: "Assistent", value: call.assistant?.name ?? "–" },
              { icon: Clock, label: "Dauer", value: call.durationSec ? formatDuration(call.durationSec) : "–" },
            ].map(({ icon: Icon, label, value }) => (
              <div key={label} className="flex items-start gap-3">
                <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Icon className="w-4 h-4 text-gray-500" />
                </div>
                <div>
                  <p className="text-xs text-gray-400">{label}</p>
                  <p className="text-sm font-medium text-gray-900">{value}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Cost Breakdown */}
        <Card>
          <h2 className="text-base font-semibold text-gray-900 mb-4">Kosten</h2>
          <div className="space-y-2">
            {costBreakdown ? (
              Object.entries(costBreakdown).map(([key, val]) => (
                <div key={key} className="flex justify-between text-sm">
                  <span className="text-gray-500 capitalize">{key}</span>
                  <span className="font-medium text-gray-900">
                    {formatCurrency(val)}
                  </span>
                </div>
              ))
            ) : (
              <p className="text-sm text-gray-400">Keine Aufschlüsselung verfügbar</p>
            )}
            <div className="border-t border-gray-100 pt-2 mt-2 flex justify-between text-sm">
              <span className="font-semibold text-gray-900">Gesamt</span>
              <span className="font-semibold text-gray-900">
                {call.costTotal != null ? formatCurrency(call.costTotal) : "–"}
              </span>
            </div>
          </div>
        </Card>

        {/* Tags & Intent */}
        {(call.tags?.length > 0 || call.intent || call.bookingStatus) && (
          <Card>
            <h2 className="text-base font-semibold text-gray-900 mb-4">
              Extraktion
            </h2>
            <div className="space-y-3">
              {call.intent && (
                <div className="flex items-center gap-2">
                  <Tag className="w-4 h-4 text-gray-400" />
                  <span className="text-sm text-gray-700">Intent: </span>
                  <Badge variant="blue">{call.intent}</Badge>
                </div>
              )}
              {call.bookingStatus && (
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-gray-400" />
                  <span className="text-sm text-gray-700">Buchungsstatus: </span>
                  <Badge variant={call.bookingStatus === "booked" ? "green" : "gray"}>
                    {call.bookingStatus}
                  </Badge>
                </div>
              )}
              {call.tags?.length > 0 && (
                <div className="flex items-center gap-2 flex-wrap">
                  {call.tags.map((tag) => (
                    <Badge key={tag} variant="gray">{tag}</Badge>
                  ))}
                </div>
              )}
            </div>
          </Card>
        )}

        {/* Recording */}
        {call.recordingUrl && (
          <Card>
            <h2 className="text-base font-semibold text-gray-900 mb-4">
              <span className="flex items-center gap-2">
                <Mic className="w-4 h-4" /> Aufnahme
              </span>
            </h2>
            <audio controls className="w-full rounded-xl" src={call.recordingUrl} />
          </Card>
        )}

        {/* Transcript */}
        {call.transcriptText && (
          <Card>
            <h2 className="text-base font-semibold text-gray-900 mb-4">
              <span className="flex items-center gap-2">
                <FileText className="w-4 h-4" /> Transkript
              </span>
            </h2>
            <pre className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed bg-gray-50 rounded-xl p-4">
              {call.transcriptText}
            </pre>
          </Card>
        )}
      </main>
    </div>
  );
}
