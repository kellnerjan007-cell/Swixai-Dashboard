import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { Topbar } from "@/components/customer/Topbar";
import { Card } from "@/components/ui/Card";
import { Mail, FileText, ExternalLink } from "lucide-react";

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
              <div className="w-11 h-11 bg-[#25D366] rounded-xl flex items-center justify-center flex-shrink-0">
                <svg viewBox="0 0 24 24" className="w-5 h-5" fill="white">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z"/>
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-1">WhatsApp Support</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
                  Schreib uns direkt — schnelle Antwort garantiert.
                </p>
                <a
                  href="https://wa.me/41786669218"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-900 dark:text-gray-100 hover:underline"
                >
                  +41 78 666 92 18
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
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
