"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Input, Textarea, Select } from "@/components/ui/Input";
import { Card } from "@/components/ui/Card";
import { ArrowLeft } from "lucide-react";

const VOICE_OPTIONS = [
  { value: "alloy", label: "Alloy (neutral)" },
  { value: "echo", label: "Echo (maskulin)" },
  { value: "fable", label: "Fable (warm)" },
  { value: "onyx", label: "Onyx (tief)" },
  { value: "nova", label: "Nova (feminin)" },
  { value: "shimmer", label: "Shimmer (hell)" },
];

const LANGUAGE_OPTIONS = [
  { value: "de", label: "Deutsch" },
  { value: "en", label: "Englisch" },
  { value: "fr", label: "Französisch" },
  { value: "es", label: "Spanisch" },
];

const FALLBACK_OPTIONS = [
  { value: "voicemail", label: "Voicemail hinterlassen" },
  { value: "transfer", label: "Zu Mensch weiterleiten" },
  { value: "hangup", label: "Auflegen" },
];

const STATUS_OPTIONS = [
  { value: "ACTIVE", label: "Aktiv" },
  { value: "PAUSED", label: "Pausiert" },
  { value: "DRAFT", label: "Entwurf" },
];

export default function NewAssistantPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    name: "",
    systemPrompt: "",
    voice: "alloy",
    language: "de",
    phoneNumber: "",
    fallbackRule: "voicemail",
    status: "ACTIVE",
  });

  function update(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/assistants", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Fehler beim Erstellen");
        setLoading(false);
        return;
      }
      router.push(`/app/assistants/${data.id}`);
    } catch {
      setError("Netzwerkfehler");
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 px-8 py-4 flex items-center gap-3">
        <Link
          href="/app/assistants"
          className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 transition"
        >
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <h1 className="text-lg font-bold text-gray-900">Neuer Assistent</h1>
      </div>

      <main className="max-w-2xl mx-auto px-8 py-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Info */}
          <Card>
            <h2 className="text-base font-semibold text-gray-900 mb-5">
              Allgemein
            </h2>
            <div className="space-y-4">
              <Input
                label="Name des Assistenten"
                placeholder="z.B. Empfangs-Bot"
                value={form.name}
                onChange={(e) => update("name", e.target.value)}
                required
              />
              <Select
                label="Status"
                value={form.status}
                onChange={(e) => update("status", e.target.value)}
                options={STATUS_OPTIONS}
              />
              <Input
                label="Telefonnummer (optional)"
                placeholder="+49 30 12345678"
                value={form.phoneNumber}
                onChange={(e) => update("phoneNumber", e.target.value)}
                hint="Wird von deinem Voice Provider (Twilio/Vapi) zugewiesen"
              />
            </div>
          </Card>

          {/* Voice & Language */}
          <Card>
            <h2 className="text-base font-semibold text-gray-900 mb-5">
              Stimme & Sprache
            </h2>
            <div className="grid grid-cols-2 gap-4">
              <Select
                label="Stimme"
                value={form.voice}
                onChange={(e) => update("voice", e.target.value)}
                options={VOICE_OPTIONS}
              />
              <Select
                label="Sprache"
                value={form.language}
                onChange={(e) => update("language", e.target.value)}
                options={LANGUAGE_OPTIONS}
              />
            </div>
          </Card>

          {/* System Prompt */}
          <Card>
            <h2 className="text-base font-semibold text-gray-900 mb-5">
              Rolle & Anweisungen
            </h2>
            <Textarea
              label="System Prompt"
              placeholder={`Du bist ein freundlicher Assistent für [Firmenname]. Deine Aufgabe ist es, Anrufer zu begrüßen, Termine zu vereinbaren und Fragen zu beantworten.\n\nSei immer höflich und professionell.`}
              value={form.systemPrompt}
              onChange={(e) => update("systemPrompt", e.target.value)}
              rows={8}
              hint="Definiere die Persönlichkeit und Aufgaben deines Assistenten"
            />
          </Card>

          {/* Fallback */}
          <Card>
            <h2 className="text-base font-semibold text-gray-900 mb-5">
              Fallback-Regel
            </h2>
            <Select
              label="Was passiert, wenn der Assistent nicht helfen kann?"
              value={form.fallbackRule}
              onChange={(e) => update("fallbackRule", e.target.value)}
              options={FALLBACK_OPTIONS}
            />
          </Card>

          {error && (
            <div className="text-sm text-red-600 bg-red-50 border border-red-100 px-4 py-3 rounded-xl">
              {error}
            </div>
          )}

          <div className="flex items-center gap-3">
            <Button type="submit" loading={loading}>
              Assistent erstellen
            </Button>
            <Link href="/app/assistants">
              <Button variant="secondary" type="button">
                Abbrechen
              </Button>
            </Link>
          </div>
        </form>
      </main>
    </div>
  );
}
