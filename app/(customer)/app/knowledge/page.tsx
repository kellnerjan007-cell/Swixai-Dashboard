"use client";

import { useState, useEffect } from "react";
import { Topbar } from "@/components/customer/Topbar";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { Input, Textarea, Select } from "@/components/ui/Input";
import { EmptyState } from "@/components/ui/EmptyState";
import { formatDate } from "@/lib/utils";
import { Plus, BookOpen, Search, Trash2, FileText, HelpCircle, File } from "lucide-react";

interface KSource {
  id: string;
  title: string;
  type: string;
  contentText: string | null;
  fileUrl: string | null;
  createdAt: string;
  updatedAt: string;
  assistant: { name: string } | null;
}

const typeConfig: Record<string, { icon: React.ElementType; label: string; variant: "green" | "blue" | "yellow" }> = {
  FAQ: { icon: HelpCircle, label: "FAQ", variant: "green" },
  TEXT: { icon: FileText, label: "Text", variant: "blue" },
  FILE: { icon: File, label: "Datei", variant: "yellow" },
};

export default function KnowledgePage() {
  const [sources, setSources] = useState<KSource[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ title: "", type: "FAQ", contentText: "" });

  async function load() {
    const res = await fetch("/api/knowledge");
    const data = await res.json();
    setSources(data);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    await fetch("/api/knowledge", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setSaving(false);
    setShowModal(false);
    setForm({ title: "", type: "FAQ", contentText: "" });
    load();
  }

  async function handleDelete(id: string) {
    if (!confirm("Eintrag löschen?")) return;
    await fetch(`/api/knowledge/${id}`, { method: "DELETE" });
    load();
  }

  const filtered = sources.filter(
    (s) =>
      s.title.toLowerCase().includes(search.toLowerCase()) ||
      s.contentText?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <>
      <Topbar
        title="Wissensdatenbank"
        subtitle={`${sources.length} Einträge`}
        actions={
          <Button size="sm" onClick={() => setShowModal(true)}>
            <Plus className="w-4 h-4" />
            Hinzufügen
          </Button>
        }
      />
      <main className="flex-1 px-8 py-8 space-y-4">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Suche…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full md:w-80 pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 bg-white text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-black/20 focus:border-black transition"
          />
        </div>

        {loading ? (
          <div className="flex justify-center py-16">
            <div className="w-6 h-6 border-2 border-black border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <Card>
            <EmptyState
              icon={<BookOpen className="w-5 h-5" />}
              title={search ? "Keine Ergebnisse" : "Noch keine Einträge"}
              description={
                search
                  ? "Versuche einen anderen Suchbegriff."
                  : "Füge FAQ-Einträge, Texte oder Dateien hinzu, die dein Assistent kennen soll."
              }
              action={
                !search && (
                  <Button onClick={() => setShowModal(true)}>
                    <Plus className="w-4 h-4" /> Ersten Eintrag hinzufügen
                  </Button>
                )
              }
            />
          </Card>
        ) : (
          <div className="space-y-2">
            {filtered.map((source) => {
              const cfg = typeConfig[source.type] ?? typeConfig.TEXT;
              const Icon = cfg.icon;
              return (
                <div
                  key={source.id}
                  className="bg-white rounded-2xl border border-gray-200 shadow-sm px-6 py-4 flex items-start gap-4 hover:shadow-md transition"
                >
                  <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Icon className="w-4 h-4 text-gray-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-semibold text-gray-900 truncate">{source.title}</p>
                      <Badge variant={cfg.variant}>{cfg.label}</Badge>
                    </div>
                    {source.contentText && (
                      <p className="text-sm text-gray-500 truncate max-w-xl">
                        {source.contentText}
                      </p>
                    )}
                    <p className="text-xs text-gray-400 mt-1">
                      Aktualisiert: {formatDate(source.updatedAt)}
                    </p>
                  </div>
                  <button
                    onClick={() => handleDelete(source.id)}
                    className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition flex-shrink-0"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* Create Modal */}
      <Modal
        open={showModal}
        onClose={() => setShowModal(false)}
        title="Eintrag hinzufügen"
      >
        <form onSubmit={handleCreate} className="space-y-4">
          <Input
            label="Titel"
            placeholder="z.B. Öffnungszeiten"
            value={form.title}
            onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
            required
          />
          <Select
            label="Typ"
            value={form.type}
            onChange={(e) => setForm((p) => ({ ...p, type: e.target.value }))}
            options={[
              { value: "FAQ", label: "FAQ (Frage & Antwort)" },
              { value: "TEXT", label: "Freitext" },
              { value: "FILE", label: "Datei (TODO: Upload)" },
            ]}
          />
          <Textarea
            label="Inhalt"
            placeholder="Schreibe den Inhalt, den der Assistent kennen soll…"
            value={form.contentText}
            onChange={(e) => setForm((p) => ({ ...p, contentText: e.target.value }))}
            rows={6}
          />
          <div className="flex gap-3 pt-2">
            <Button type="submit" loading={saving}>Speichern</Button>
            <Button variant="secondary" type="button" onClick={() => setShowModal(false)}>
              Abbrechen
            </Button>
          </div>
        </form>
      </Modal>
    </>
  );
}
