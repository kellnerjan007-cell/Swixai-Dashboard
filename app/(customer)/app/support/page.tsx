import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { Topbar } from "@/components/customer/Topbar";
import { Card } from "@/components/ui/Card";
import { Mail, MessageCircle, FileText, ExternalLink } from "lucide-react";

export default async function SupportPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  return (
    <>
      <Topbar title="Hilfe & Support" subtitle="Wir helfen dir weiter" />
      <main className="flex-1 px-8 py-8 space-y-6">

        {/* Contact options */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card>
            <div className="flex items-start gap-4">
              <div className="w-11 h-11 bg-gray-900 dark:bg-white rounded-xl flex items-center justify-center flex-shrink-0">
                <Mail className="w-5 h-5 text-white dark:text-gray-900" />
              </div>
              <div className="flex-1">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-1">E-Mail Support</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
                  Schreib uns — wir antworten innerhalb von 24 Stunden.
                </p>
                <a
                  href="mailto:office@swixai.info"
                  className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-900 dark:text-gray-100 hover:underline"
                >
                  office@swixai.info
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>
          </Card>

          <Card>
            <div className="flex items-start gap-4">
              <div className="w-11 h-11 bg-gray-100 dark:bg-gray-800 rounded-xl flex items-center justify-center flex-shrink-0">
                <MessageCircle className="w-5 h-5 text-gray-600 dark:text-gray-300" />
              </div>
              <div className="flex-1">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-1">Live-Chat</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
                  Für Pro- und Business-Kunden verfügbar.
                </p>
                <span className="inline-flex items-center gap-1.5 text-sm text-gray-400 dark:text-gray-500">
                  Im Pro-Plan enthalten
                </span>
              </div>
            </div>
          </Card>
        </div>

        {/* FAQ */}
        <Card>
          <div className="flex items-center gap-3 mb-5">
            <div className="w-9 h-9 bg-gray-100 dark:bg-gray-800 rounded-xl flex items-center justify-center">
              <FileText className="w-4 h-4 text-gray-500 dark:text-gray-400" />
            </div>
            <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100">Häufige Fragen</h2>
          </div>

          <div className="space-y-4">
            {[
              {
                q: "Wie lade ich mein Guthaben auf?",
                a: 'Gehe zu Billing & Credits → wähle einen Betrag oder gib einen eigenen Betrag ein → klicke "Aufladen". Die Zahlung läuft über Stripe.',
              },
              {
                q: "Wie verbinde ich meinen Google-Kalender?",
                a: 'Gehe zu Kalender → klicke auf „Google Kalender verbinden" und folge der Anleitung. Nach der Verbindung werden Termine automatisch synchronisiert.',
              },
              {
                q: "Wie füge ich einen neuen KI-Assistenten hinzu?",
                a: 'Gehe zu Assistenten → klicke auf "Neuer Assistent" → fülle den Namen, die Stimme und den System-Prompt aus.',
              },
              {
                q: "Wie ändere ich meinen Plan?",
                a: 'Gehe zu Billing & Credits → scrolle zu "Verfügbare Pläne" → klicke auf "Zu [Plan] wechseln". Wir setzen den Wechsel manuell um und melden uns bei dir.',
              },
              {
                q: "Was passiert wenn mein Guthaben aufgebraucht ist?",
                a: "Neue Anrufe werden nicht mehr entgegengenommen bis du dein Guthaben wieder aufgeladen hast. Bereits laufende Anrufe werden nicht unterbrochen.",
              },
            ].map(({ q, a }) => (
              <div key={q} className="border-b border-gray-100 dark:border-gray-800 last:border-0 pb-4 last:pb-0">
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-1">{q}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">{a}</p>
              </div>
            ))}
          </div>
        </Card>

      </main>
    </>
  );
}
