"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Topbar } from "@/components/customer/Topbar";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { Input, Textarea, Select } from "@/components/ui/Input";
import { EmptyState } from "@/components/ui/EmptyState";
import { formatDate } from "@/lib/utils";
import { cn } from "@/lib/utils";
import {
  Plus,
  BookOpen,
  Search,
  Trash2,
  FileText,
  HelpCircle,
  File,
  UploadCloud,
  X,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

interface KSource {
  id: string;
  title: string;
  type: string;
  contentText: string | null;
  fileUrl: string | null;
  fileName: string | null;
  createdAt: string;
  updatedAt: string;
  assistant: { name: string } | null;
}

const typeConfig: Record<
  string,
  { icon: React.ElementType; label: string; variant: "green" | "blue" | "yellow" }
> = {
  FAQ: { icon: HelpCircle, label: "FAQ", variant: "green" },
  TEXT: { icon: FileText, label: "Text", variant: "blue" },
  FILE: { icon: File, label: "PDF", variant: "yellow" },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function KnowledgePage() {
  const [sources, setSources] = useState<KSource[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Form state
  const [title, setTitle] = useState("");
  const [type, setType] = useState<"TEXT" | "FILE">("TEXT");
  const [contentText, setContentText] = useState("");

  // File upload state
  const [file, setFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ── Data loading ─────────────────────────────────────────────────────────────
  async function load() {
    const res = await fetch("/api/knowledge");
    const data = await res.json();
    setSources(Array.isArray(data) ? data : []);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  // ── File validation ───────────────────────────────────────────────────────────
  const validateAndSetFile = useCallback((f: File) => {
    if (!f.name.toLowerCase().endsWith(".pdf")) {
      setFileError("Bitte nur PDF-Dateien hochladen.");
      return;
    }
    if (f.size > MAX_FILE_SIZE) {
      setFileError("Datei ist zu groß (max. 10 MB).");
      return;
    }
    setFileError(null);
    setFile(f);
  }, []);

  // ── Drag & Drop handlers ──────────────────────────────────────────────────────
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      const dropped = e.dataTransfer.files[0];
      if (dropped) validateAndSetFile(dropped);
    },
    [validateAndSetFile]
  );

  // ── Reset modal ───────────────────────────────────────────────────────────────
  function resetModal() {
    setTitle("");
    setType("TEXT");
    setContentText("");
    setFile(null);
    setFileError(null);
    setSaveError(null);
    setDragOver(false);
  }

  function openModal() {
    resetModal();
    setShowModal(true);
  }

  function closeModal() {
    setShowModal(false);
    resetModal();
  }

  // ── Create ────────────────────────────────────────────────────────────────────
  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setSaveError(null);

    if (type === "FILE" && !file) {
      setFileError("Bitte eine PDF-Datei auswählen.");
      return;
    }

    setSaving(true);

    let res: Response;

    if (type === "FILE" && file) {
      const fd = new FormData();
      fd.append("title", title);
      fd.append("file", file);
      res = await fetch("/api/knowledge", { method: "POST", body: fd });
    } else {
      res = await fetch("/api/knowledge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, type, contentText }),
      });
    }

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setSaveError((data as { error?: string }).error ?? "Fehler beim Speichern.");
      setSaving(false);
      return;
    }

    setSaving(false);
    closeModal();
    load();
  }

  // ── Delete ────────────────────────────────────────────────────────────────────
  async function handleDelete(id: string) {
    if (!confirm("Eintrag löschen?")) return;
    await fetch(`/api/knowledge/${id}`, { method: "DELETE" });
    load();
  }

  // ── Filter ────────────────────────────────────────────────────────────────────
  const filtered = sources.filter(
    (s) =>
      s.title.toLowerCase().includes(search.toLowerCase()) ||
      s.contentText?.toLowerCase().includes(search.toLowerCase()) ||
      s.fileName?.toLowerCase().includes(search.toLowerCase())
  );

  // ─────────────────────────────────────────────────────────────────────────────

  return (
    <>
      <Topbar
        title="Wissensdatenbank"
        subtitle={`${sources.length} Einträge`}
        actions={
          <Button size="sm" onClick={openModal}>
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

        {/* List */}
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
                  : "Füge Texte oder PDFs hinzu, die dein Assistent kennen soll."
              }
              action={
                !search && (
                  <Button onClick={openModal}>
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
                    {/* PDF: show original filename */}
                    {source.type === "FILE" && source.fileName && (
                      <p className="text-xs text-gray-400 font-mono truncate max-w-xl">
                        {source.fileName}
                      </p>
                    )}
                    {/* Text: show content preview */}
                    {source.type !== "FILE" && source.contentText && (
                      <p className="text-sm text-gray-500 truncate max-w-xl">
                        {source.contentText}
                      </p>
                    )}
                    {/* PDF: show extracted text preview */}
                    {source.type === "FILE" && source.contentText && (
                      <p className="text-sm text-gray-400 truncate max-w-xl mt-0.5">
                        {source.contentText.slice(0, 120)}…
                      </p>
                    )}
                    <p className="text-xs text-gray-400 mt-1">
                      Aktualisiert: {formatDate(source.updatedAt)}
                    </p>
                  </div>
                  <button
                    onClick={() => handleDelete(source.id)}
                    className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition flex-shrink-0"
                    aria-label="Eintrag löschen"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* ── Create Modal ──────────────────────────────────────────────────────── */}
      <Modal open={showModal} onClose={closeModal} title="Eintrag hinzufügen">
        <form onSubmit={handleCreate} className="space-y-4">
          <Input
            label="Titel"
            placeholder="z.B. Öffnungszeiten"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />

          <Select
            label="Typ"
            value={type}
            onChange={(e) => {
              setType(e.target.value as "TEXT" | "FILE");
              setFile(null);
              setFileError(null);
            }}
            options={[
              { value: "TEXT", label: "Text" },
              { value: "FILE", label: "Datei (PDF)" },
            ]}
          />

          {/* ── Text input ── */}
          {type === "TEXT" && (
            <Textarea
              label="Inhalt"
              placeholder="Schreibe den Inhalt, den der Assistent kennen soll…"
              value={contentText}
              onChange={(e) => setContentText(e.target.value)}
              rows={6}
            />
          )}

          {/* ── PDF Drop Zone ── */}
          {type === "FILE" && (
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-gray-700">
                PDF-Datei
              </label>

              {file ? (
                /* File selected – show info + remove button */
                <div className="flex items-center gap-3 px-4 py-3 rounded-xl border border-gray-200 bg-gray-50">
                  <div className="w-9 h-9 bg-yellow-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <File className="w-4 h-4 text-yellow-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{file.name}</p>
                    <p className="text-xs text-gray-500">{formatBytes(file.size)}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setFile(null);
                      setFileError(null);
                      if (fileInputRef.current) fileInputRef.current.value = "";
                    }}
                    className="p-1 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition flex-shrink-0"
                    aria-label="Datei entfernen"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                /* Drop zone */
                <div
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => e.key === "Enter" && fileInputRef.current?.click()}
                  className={cn(
                    "flex flex-col items-center justify-center gap-3 px-6 py-10 rounded-xl border-2 border-dashed cursor-pointer transition select-none",
                    dragOver
                      ? "border-black bg-gray-50 scale-[1.01]"
                      : "border-gray-200 hover:border-gray-400 hover:bg-gray-50"
                  )}
                >
                  <div
                    className={cn(
                      "w-12 h-12 rounded-xl flex items-center justify-center transition",
                      dragOver ? "bg-black text-white" : "bg-gray-100 text-gray-400"
                    )}
                  >
                    <UploadCloud className="w-6 h-6" />
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-medium text-gray-700">
                      PDF hier reinziehen
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      oder klicken zum Auswählen · max. 10 MB
                    </p>
                  </div>
                </div>
              )}

              {/* Hidden file input */}
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,application/pdf"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) validateAndSetFile(f);
                }}
              />

              {fileError && <p className="text-xs text-red-600">{fileError}</p>}
            </div>
          )}

          {/* Global save error */}
          {saveError && <p className="text-sm text-red-600">{saveError}</p>}

          <div className="flex gap-3 pt-2">
            <Button type="submit" loading={saving}>
              Speichern
            </Button>
            <Button variant="secondary" type="button" onClick={closeModal}>
              Abbrechen
            </Button>
          </div>
        </form>
      </Modal>
    </>
  );
}
