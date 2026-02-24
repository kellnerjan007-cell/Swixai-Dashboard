"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Input, Textarea, Select } from "@/components/ui/Input";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Modal } from "@/components/ui/Modal";
import { ArrowLeft, Trash2, Save } from "lucide-react";

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

interface Assistant {
  id: string;
  name: string;
  status: string;
  phoneNumber: string | null;
  systemPrompt: string | null;
  voice: string;
  language: string;
  fallbackRule: string;
  createdAt: string;
}

export default function AssistantDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const [assistant, setAssistant] = useState<Assistant | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
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

  useEffect(() => {
    fetch(`/api/assistants/${id}`)
      .then((r) => r.json())
      .then((data) => {
        setAssistant(data);
        setForm({
          name: data.name ?? "",
          systemPrompt: data.systemPrompt ?? "",
          voice: data.voice ?? "alloy",
          language: data.language ?? "de",
          phoneNumber: data.phoneNumber ?? "",
          fallbackRule: data.fallbackRule ?? "voicemail",
          status: data.status ?? "ACTIVE",
        });
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [id]);

  function update(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    const res = await fetch(`/api/assistants/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setSaving(false);
    if (!res.ok) {
      const d = await res.json();
      setError(d.error ?? "Fehler beim Speichern");
    }
  }

  async function handleDelete() {
    setDeleting(true);
    await fetch(`/api/assistants/${id}`, { method: "DELETE" });
    router.push("/app/assistants");
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-black border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!assistant) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 mb-4">Assistent nicht gefunden.</p>
          <Link href="/app/assistants">
            <Button variant="secondary">Zurück</Button>
          </Link>
        </div>
      </div>
    );
  }

  const statusVariant: Record<string, "green" | "yellow" | "gray"> = {
    ACTIVE: "green",
    PAUSED: "yellow",
    DRAFT: "gray",
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 px-8 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            href="/app/assistants"
            className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 transition"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-bold text-gray-900">{assistant.name}</h1>
            <Badge variant={statusVariant[assistant.status] ?? "gray"}>
              {assistant.status}
            </Badge>
          </div>
        </div>
        <button
          onClick={() => setShowDelete(true)}
          className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      <main className="max-w-2xl mx-auto px-8 py-8">
        <form onSubmit={handleSave} className="space-y-6">
          <Card>
            <h2 className="text-base font-semibold text-gray-900 mb-5">Allgemein</h2>
            <div className="space-y-4">
              <Input
                label="Name"
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
                label="Telefonnummer"
                value={form.phoneNumber}
                onChange={(e) => update("phoneNumber", e.target.value)}
                placeholder="+49 30 12345678"
              />
            </div>
          </Card>

          <Card>
            <h2 className="text-base font-semibold text-gray-900 mb-5">Stimme & Sprache</h2>
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

          <Card>
            <h2 className="text-base font-semibold text-gray-900 mb-5">System Prompt</h2>
            <Textarea
              label="Anweisungen"
              value={form.systemPrompt}
              onChange={(e) => update("systemPrompt", e.target.value)}
              rows={10}
            />
          </Card>

          <Card>
            <h2 className="text-base font-semibold text-gray-900 mb-5">Fallback-Regel</h2>
            <Select
              label="Wenn der Assistent nicht helfen kann"
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

          <Button type="submit" loading={saving}>
            <Save className="w-4 h-4" />
            Änderungen speichern
          </Button>
        </form>
      </main>

      {/* Delete Modal */}
      <Modal
        open={showDelete}
        onClose={() => setShowDelete(false)}
        title="Assistent löschen"
        size="sm"
      >
        <p className="text-sm text-gray-600 mb-6">
          Möchtest du <strong>{assistant.name}</strong> wirklich löschen? Alle
          zugehörigen Daten werden unwiderruflich entfernt.
        </p>
        <div className="flex gap-3">
          <Button
            variant="danger"
            loading={deleting}
            onClick={handleDelete}
          >
            Löschen
          </Button>
          <Button variant="secondary" onClick={() => setShowDelete(false)}>
            Abbrechen
          </Button>
        </div>
      </Modal>
    </div>
  );
}
