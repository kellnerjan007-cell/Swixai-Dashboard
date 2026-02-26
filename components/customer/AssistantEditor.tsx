"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Input, Textarea, Select } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { VoicePicker } from "@/components/ui/VoicePicker";
import {
  ArrowLeft, Trash2, ChevronRight, X, Settings, Mic, Globe,
  ShieldAlert, Phone, Link2, CheckCircle, MessageSquare,
  PhoneForwarded, Mail, MessageCircle, CalendarDays, Loader2,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ToolsConfig {
  qaEnabled: boolean;
  companyInfo: string;
  companyUrl: string;
  transferEnabled: boolean;
  transferPhone: string;
  transferCondition: string;
  emailEnabled: boolean;
  emailName: string;
  emailRecipient: string;
  emailSubject: string;
  emailCondition: string;
  emailBody: string;
  smsEnabled: boolean;
  smsRecipientType: "caller" | "fixed";
  smsPhone: string;
  smsSender: string;
  smsCondition: string;
  smsContent: string;
  bookingEnabled: boolean;
  bookingProvider: "calendly" | "calcom" | "google";
  bookingUrl: string;
  bookingCondition: string;
}

export const DEFAULT_TOOLS_CONFIG: ToolsConfig = {
  qaEnabled: false,
  companyInfo: "",
  companyUrl: "",
  transferEnabled: false,
  transferPhone: "",
  transferCondition: "",
  emailEnabled: false,
  emailName: "",
  emailRecipient: "",
  emailSubject: "",
  emailCondition: "",
  emailBody: "",
  smsEnabled: false,
  smsRecipientType: "caller",
  smsPhone: "",
  smsSender: "",
  smsCondition: "",
  smsContent: "",
  bookingEnabled: false,
  bookingProvider: "calendly",
  bookingUrl: "",
  bookingCondition: "",
};

export interface AssistantFormData {
  name: string;
  systemPrompt: string;
  voice: string;
  language: string;
  phoneNumber: string;
  fallbackRule: string;
  status: string;
  vapiAssistantId: string;
  toolsConfig: ToolsConfig;
}

interface AssistantEditorProps {
  mode: "create" | "edit";
  initialData: AssistantFormData;
  assistantId?: string;
  assistantName?: string;
  onSave: (data: AssistantFormData) => Promise<void>;
  onDelete?: () => Promise<void>;
}

// ─── Constants ────────────────────────────────────────────────────────────────

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

type Tab = "verhalten" | "technisches";

interface Section {
  id: string;
  label: string;
  description: string;
  icon: React.ReactNode;
  tab: Tab;
  /** key in toolsConfig that indicates this is "enabled" (shows green dot) */
  enabledKey?: keyof ToolsConfig;
}

const SECTIONS: Section[] = [
  {
    id: "grundlegend",
    label: "Grundlegende Einstellungen",
    description: "Name, Stimme und Sprache",
    icon: <Settings className="w-5 h-5" />,
    tab: "verhalten",
  },
  {
    id: "qa",
    label: "Fragen beantworten",
    description: "Unternehmenswissen & Infos",
    icon: <MessageSquare className="w-5 h-5" />,
    tab: "verhalten",
    enabledKey: "qaEnabled",
  },
  {
    id: "anweisungen",
    label: "Eigener Prompt / Anweisungen",
    description: "Persönlichkeit und Verhalten",
    icon: <Mic className="w-5 h-5" />,
    tab: "verhalten",
  },
  {
    id: "transfer",
    label: "Anrufe weiterleiten",
    description: "An Mitarbeiter weiterleiten",
    icon: <PhoneForwarded className="w-5 h-5" />,
    tab: "verhalten",
    enabledKey: "transferEnabled",
  },
  {
    id: "email",
    label: "E-Mail senden",
    description: "Automatische E-Mails versenden",
    icon: <Mail className="w-5 h-5" />,
    tab: "verhalten",
    enabledKey: "emailEnabled",
  },
  {
    id: "sms",
    label: "SMS versenden",
    description: "SMS-Nachrichten senden",
    icon: <MessageCircle className="w-5 h-5" />,
    tab: "verhalten",
    enabledKey: "smsEnabled",
  },
  {
    id: "booking",
    label: "Termine buchen",
    description: "Calendly / Cal.com Integration",
    icon: <CalendarDays className="w-5 h-5" />,
    tab: "verhalten",
    enabledKey: "bookingEnabled",
  },
  {
    id: "fallback",
    label: "Fallback-Regel",
    description: "Wenn der Assistent nicht helfen kann",
    icon: <ShieldAlert className="w-5 h-5" />,
    tab: "verhalten",
  },
  {
    id: "telefon",
    label: "Telefonnummer",
    description: "Zugewiesene Rufnummer",
    icon: <Phone className="w-5 h-5" />,
    tab: "technisches",
  },
  {
    id: "vapi",
    label: "Vapi Verknüpfung",
    description: "Assistent ID",
    icon: <Link2 className="w-5 h-5" />,
    tab: "technisches",
  },
];

// ─── Toggle Switch ─────────────────────────────────────────────────────────────

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${
        checked ? "bg-gray-900" : "bg-gray-200"
      }`}
    >
      <span
        className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
          checked ? "translate-x-6" : "translate-x-1"
        }`}
      />
    </button>
  );
}

// ─── Main Component ────────────────────────────────────────────────────────────

export function AssistantEditor({
  mode,
  initialData,
  assistantId,
  assistantName,
  onSave,
  onDelete,
}: AssistantEditorProps) {
  const router = useRouter();
  const [form, setForm] = useState<AssistantFormData>(initialData);
  const [activeTab, setActiveTab] = useState<Tab>("verhalten");
  const [activeSection, setActiveSection] = useState<string | null>("grundlegend");
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  const [scraping, setScraping] = useState(false);

  function update(field: keyof AssistantFormData, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function updateTool<K extends keyof ToolsConfig>(field: K, value: ToolsConfig[K]) {
    setForm((prev) => ({
      ...prev,
      toolsConfig: { ...prev.toolsConfig, [field]: value },
    }));
  }

  async function handleScrape() {
    const url = form.toolsConfig.companyUrl.trim();
    if (!url) return;
    setScraping(true);
    try {
      const res = await fetch("/api/scrape", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });
      const data = await res.json();
      if (data.text) updateTool("companyInfo", data.text);
    } catch {
      // ignore scraping errors silently
    } finally {
      setScraping(false);
    }
  }

  async function handleSave() {
    setSaving(true);
    setError("");
    try {
      await onSave(form);
      setSaved(true);
      setTimeout(() => {
        if (mode === "create") router.push("/app/assistants");
        else setSaved(false);
      }, 1500);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Fehler beim Speichern");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!onDelete) return;
    setDeleting(true);
    await onDelete();
    router.push("/app/assistants");
  }

  const sectionsForTab = SECTIONS.filter((s) => s.tab === activeTab);

  function handleSectionClick(id: string) {
    setActiveSection(activeSection === id ? null : id);
  }

  function isEnabled(section: Section): boolean {
    if (!section.enabledKey) return false;
    return !!form.toolsConfig[section.enabledKey];
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Success banner */}
      {saved && (
        <div
          className="fixed top-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 text-white text-sm font-medium px-5 py-3 rounded-xl shadow-lg"
          style={{ backgroundColor: "#16a34a" }}
        >
          <CheckCircle className="w-4 h-4" />
          {mode === "create" ? "Assistent erstellt" : "Änderungen gespeichert"}
        </div>
      )}

      {/* Header */}
      <div className="bg-white border-b border-gray-100 px-8 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/app/assistants" className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 transition">
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <p className="text-xs text-gray-400">Assistenten /</p>
            <h1 className="text-base font-bold text-gray-900 leading-tight">
              {mode === "create" ? "Neuer Assistent" : (form.name || assistantName || "Assistent bearbeiten")}
            </h1>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {mode === "edit" && onDelete && (
            <button
              onClick={() => setShowDelete(true)}
              className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
          <Button onClick={handleSave} loading={saving}>
            {mode === "create" ? "Erstellen" : "Speichern"}
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white border-b border-gray-100 px-8">
        <div className="flex gap-6">
          {(["verhalten", "technisches"] as Tab[]).map((tab) => (
            <button
              key={tab}
              onClick={() => { setActiveTab(tab); setActiveSection(null); }}
              className={`py-3 text-sm font-medium border-b-2 transition capitalize ${
                activeTab === tab
                  ? "border-gray-900 text-gray-900"
                  : "border-transparent text-gray-400 hover:text-gray-600"
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Main content */}
      <main className="max-w-5xl mx-auto px-8 py-8">
        {error && (
          <div className="mb-4 text-sm text-red-600 bg-red-50 border border-red-100 px-4 py-3 rounded-xl">
            {error}
          </div>
        )}

        <div className="flex gap-6 items-start">
          {/* Left sidebar — section cards */}
          <div className="w-72 flex-shrink-0 space-y-2">
            {sectionsForTab.map((section) => {
              const enabled = isEnabled(section);
              const active = activeSection === section.id;
              return (
                <button
                  key={section.id}
                  onClick={() => handleSectionClick(section.id)}
                  className={`w-full text-left px-4 py-3.5 rounded-2xl border transition flex items-center justify-between gap-3 ${
                    active
                      ? "bg-white border-gray-200 shadow-sm"
                      : "bg-white border-gray-100 hover:border-gray-200 hover:shadow-sm"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className={`${active ? "text-gray-900" : "text-gray-400"}`}>
                      {section.icon}
                    </span>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className={`text-sm font-medium ${active ? "text-gray-900" : "text-gray-700"}`}>
                          {section.label}
                        </p>
                        {section.enabledKey && enabled && (
                          <span className="w-2 h-2 rounded-full bg-emerald-500 flex-shrink-0" />
                        )}
                      </div>
                      <p className="text-xs text-gray-400 mt-0.5">{section.description}</p>
                    </div>
                  </div>
                  <ChevronRight className={`w-4 h-4 flex-shrink-0 transition ${active ? "text-gray-900 rotate-90" : "text-gray-300"}`} />
                </button>
              );
            })}
          </div>

          {/* Right panel */}
          {activeSection && (
            <div className="flex-1 bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
              {/* Panel header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                <h2 className="text-base font-semibold text-gray-900">
                  {SECTIONS.find((s) => s.id === activeSection)?.label}
                </h2>
                <button
                  onClick={() => setActiveSection(null)}
                  className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Panel content */}
              <div className="px-6 py-5 space-y-5">

                {/* ── Grundlegende Einstellungen ─────────────────────────── */}
                {activeSection === "grundlegend" && (
                  <>
                    <Input
                      label="Name des Assistenten"
                      placeholder="z.B. Lena"
                      value={form.name}
                      onChange={(e) => update("name", e.target.value)}
                    />
                    <Select
                      label="Status"
                      value={form.status}
                      onChange={(e) => update("status", e.target.value)}
                      options={STATUS_OPTIONS}
                    />
                    <VoicePicker
                      label="Stimme"
                      value={form.voice}
                      onChange={(val) => update("voice", val)}
                      language={form.language}
                    />
                    <Select
                      label="Sprache"
                      value={form.language}
                      onChange={(e) => update("language", e.target.value)}
                      options={LANGUAGE_OPTIONS}
                    />
                  </>
                )}

                {/* ── Fragen beantworten ─────────────────────────────────── */}
                {activeSection === "qa" && (
                  <>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-900">Fragen beantworten aktivieren</p>
                        <p className="text-xs text-gray-500 mt-0.5">
                          Unternehmensinfos als Wissensgrundlage nutzen
                        </p>
                      </div>
                      <Toggle
                        checked={form.toolsConfig.qaEnabled}
                        onChange={(v) => updateTool("qaEnabled", v)}
                      />
                    </div>

                    {form.toolsConfig.qaEnabled && (
                      <>
                        <hr className="border-gray-100" />
                        <div className="space-y-2">
                          <p className="text-sm font-medium text-gray-700">Unternehmensinformationen</p>
                          <p className="text-xs text-gray-500">
                            Trage Infos zu deinem Unternehmen ein oder lass sie von einer Webseite einscannen.
                          </p>
                        </div>

                        {/* URL scraper */}
                        <div className="flex gap-2">
                          <input
                            type="url"
                            placeholder="https://deine-website.de"
                            value={form.toolsConfig.companyUrl}
                            onChange={(e) => updateTool("companyUrl", e.target.value)}
                            className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 bg-white text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-black/20 focus:border-black transition"
                          />
                          <button
                            type="button"
                            onClick={handleScrape}
                            disabled={scraping || !form.toolsConfig.companyUrl}
                            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gray-900 text-white text-sm font-medium hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
                          >
                            {scraping ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <Globe className="w-4 h-4" />
                            )}
                            Einscannen
                          </button>
                        </div>

                        <Textarea
                          label="Unternehmensinfos"
                          placeholder={`Firmenname: Muster GmbH\nBranche: IT-Dienstleistungen\nÖffnungszeiten: Mo–Fr, 9–18 Uhr\nAdresse: Musterstraße 1, 10115 Berlin\n\nWir bieten...`}
                          value={form.toolsConfig.companyInfo}
                          onChange={(e) => updateTool("companyInfo", e.target.value)}
                          rows={10}
                          hint="Diese Infos werden dem Assistenten als Wissensgrundlage übergeben"
                        />
                      </>
                    )}
                  </>
                )}

                {/* ── Eigener Prompt / Anweisungen ──────────────────────── */}
                {activeSection === "anweisungen" && (
                  <Textarea
                    label="System Prompt"
                    placeholder={`Du bist ein freundlicher Assistent für [Firmenname]. Deine Aufgabe ist es, Anrufer zu begrüßen und Fragen zu beantworten.\n\nSei immer höflich und professionell.`}
                    value={form.systemPrompt}
                    onChange={(e) => update("systemPrompt", e.target.value)}
                    rows={12}
                    hint="Definiere die Persönlichkeit und Aufgaben deines Assistenten"
                  />
                )}

                {/* ── Anrufe weiterleiten ───────────────────────────────── */}
                {activeSection === "transfer" && (
                  <>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-900">Weiterleitung aktivieren</p>
                        <p className="text-xs text-gray-500 mt-0.5">
                          Anrufe an eine Telefonnummer weiterleiten
                        </p>
                      </div>
                      <Toggle
                        checked={form.toolsConfig.transferEnabled}
                        onChange={(v) => updateTool("transferEnabled", v)}
                      />
                    </div>

                    {form.toolsConfig.transferEnabled && (
                      <>
                        <hr className="border-gray-100" />
                        <Input
                          label="Weiterleitungsnummer"
                          placeholder="+49 30 12345678"
                          value={form.toolsConfig.transferPhone}
                          onChange={(e) => updateTool("transferPhone", e.target.value)}
                          hint="Telefonnummer, an die weitergeleitet werden soll"
                        />
                        <Textarea
                          label="Wann soll weitergeleitet werden?"
                          placeholder="Leite den Anruf weiter, wenn der Anrufer einen komplexen technischen Support benötigt oder explizit nach einem Mitarbeiter fragt."
                          value={form.toolsConfig.transferCondition}
                          onChange={(e) => updateTool("transferCondition", e.target.value)}
                          rows={4}
                          hint="Beschreibe, in welchen Situationen weitergeleitet werden soll"
                        />
                      </>
                    )}
                  </>
                )}

                {/* ── E-Mail senden ─────────────────────────────────────── */}
                {activeSection === "email" && (
                  <>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-900">E-Mail senden aktivieren</p>
                        <p className="text-xs text-gray-500 mt-0.5">
                          Automatisch E-Mails nach einem Anruf versenden
                        </p>
                      </div>
                      <Toggle
                        checked={form.toolsConfig.emailEnabled}
                        onChange={(v) => updateTool("emailEnabled", v)}
                      />
                    </div>

                    {form.toolsConfig.emailEnabled && (
                      <>
                        <hr className="border-gray-100" />
                        <div className="grid grid-cols-2 gap-4">
                          <Input
                            label="Name des Empfängers"
                            placeholder="Max Mustermann"
                            value={form.toolsConfig.emailName}
                            onChange={(e) => updateTool("emailName", e.target.value)}
                          />
                          <Input
                            label="E-Mail-Adresse"
                            type="email"
                            placeholder="max@firma.de"
                            value={form.toolsConfig.emailRecipient}
                            onChange={(e) => updateTool("emailRecipient", e.target.value)}
                          />
                        </div>
                        <Input
                          label="Betreff-Vorlage"
                          placeholder="Neue Anfrage von {{caller_name}}"
                          value={form.toolsConfig.emailSubject}
                          onChange={(e) => updateTool("emailSubject", e.target.value)}
                        />
                        <Textarea
                          label="Wann soll die E-Mail gesendet werden?"
                          placeholder="Sende eine E-Mail, wenn der Anrufer eine konkrete Anfrage oder ein Problem schildert, das schriftlich dokumentiert werden sollte."
                          value={form.toolsConfig.emailCondition}
                          onChange={(e) => updateTool("emailCondition", e.target.value)}
                          rows={3}
                        />
                        <Textarea
                          label="E-Mail-Inhalt Vorlage"
                          placeholder="Guten Tag,\n\nes gibt eine neue Anfrage:\n\nAnrufer: {{caller_name}}\nTelefon: {{caller_phone}}\nAnliegen: {{summary}}\n\nMit freundlichen Grüßen,\nIhr Assistent"
                          value={form.toolsConfig.emailBody}
                          onChange={(e) => updateTool("emailBody", e.target.value)}
                          rows={8}
                          hint="Platzhalter: {{caller_name}}, {{caller_phone}}, {{summary}}"
                        />
                      </>
                    )}
                  </>
                )}

                {/* ── SMS versenden ─────────────────────────────────────── */}
                {activeSection === "sms" && (
                  <>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-900">SMS versenden aktivieren</p>
                        <p className="text-xs text-gray-500 mt-0.5">
                          SMS-Nachrichten während oder nach dem Anruf senden
                        </p>
                      </div>
                      <Toggle
                        checked={form.toolsConfig.smsEnabled}
                        onChange={(v) => updateTool("smsEnabled", v)}
                      />
                    </div>

                    {form.toolsConfig.smsEnabled && (
                      <>
                        <hr className="border-gray-100" />
                        <div>
                          <p className="text-sm font-medium text-gray-700 mb-2">Empfänger</p>
                          <div className="flex gap-3">
                            {[
                              { value: "caller", label: "Anrufer" },
                              { value: "fixed", label: "Feste Nummer" },
                            ].map((opt) => (
                              <button
                                key={opt.value}
                                type="button"
                                onClick={() => updateTool("smsRecipientType", opt.value as "caller" | "fixed")}
                                className={`flex-1 py-2.5 rounded-xl border text-sm font-medium transition ${
                                  form.toolsConfig.smsRecipientType === opt.value
                                    ? "bg-gray-900 text-white border-gray-900"
                                    : "bg-white text-gray-700 border-gray-200 hover:border-gray-300"
                                }`}
                              >
                                {opt.label}
                              </button>
                            ))}
                          </div>
                        </div>

                        {form.toolsConfig.smsRecipientType === "fixed" && (
                          <Input
                            label="Empfänger-Telefonnummer"
                            placeholder="+49 30 12345678"
                            value={form.toolsConfig.smsPhone}
                            onChange={(e) => updateTool("smsPhone", e.target.value)}
                          />
                        )}

                        <Input
                          label="Absendername"
                          placeholder="VoxAI"
                          value={form.toolsConfig.smsSender}
                          onChange={(e) => updateTool("smsSender", e.target.value)}
                          hint="Wird als Absender der SMS angezeigt (max. 11 Zeichen)"
                        />
                        <Textarea
                          label="Wann soll die SMS gesendet werden?"
                          placeholder="Sende eine SMS, wenn der Anrufer einen Rückruf wünscht oder einen Termin anfragen möchte."
                          value={form.toolsConfig.smsCondition}
                          onChange={(e) => updateTool("smsCondition", e.target.value)}
                          rows={3}
                        />
                        <Textarea
                          label="SMS-Inhalt"
                          placeholder="Hallo {{caller_name}}, wir haben Ihre Anfrage erhalten und melden uns bald bei Ihnen."
                          value={form.toolsConfig.smsContent}
                          onChange={(e) => updateTool("smsContent", e.target.value)}
                          rows={4}
                          hint="Max. 160 Zeichen für eine Standard-SMS"
                        />
                      </>
                    )}
                  </>
                )}

                {/* ── Termine buchen ────────────────────────────────────── */}
                {activeSection === "booking" && (
                  <>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-900">Terminbuchung aktivieren</p>
                        <p className="text-xs text-gray-500 mt-0.5">
                          Anrufer direkt einen Termin buchen lassen
                        </p>
                      </div>
                      <Toggle
                        checked={form.toolsConfig.bookingEnabled}
                        onChange={(v) => updateTool("bookingEnabled", v)}
                      />
                    </div>

                    {form.toolsConfig.bookingEnabled && (
                      <>
                        <hr className="border-gray-100" />
                        <div>
                          <p className="text-sm font-medium text-gray-700 mb-2">Anbieter</p>
                          <div className="flex gap-3">
                            {[
                              { value: "calendly", label: "Calendly" },
                              { value: "calcom", label: "Cal.com" },
                              { value: "google", label: "Google Calendar" },
                            ].map((opt) => (
                              <button
                                key={opt.value}
                                type="button"
                                onClick={() => updateTool("bookingProvider", opt.value as "calendly" | "calcom" | "google")}
                                className={`flex-1 py-2.5 rounded-xl border text-sm font-medium transition ${
                                  form.toolsConfig.bookingProvider === opt.value
                                    ? "bg-gray-900 text-white border-gray-900"
                                    : "bg-white text-gray-700 border-gray-200 hover:border-gray-300"
                                }`}
                              >
                                {opt.label}
                              </button>
                            ))}
                          </div>
                        </div>

                        <Input
                          label="Kalender-Link"
                          type="url"
                          placeholder={
                            form.toolsConfig.bookingProvider === "calendly"
                              ? "https://calendly.com/dein-name/30min"
                              : form.toolsConfig.bookingProvider === "google"
                              ? "https://calendar.google.com/calendar/appointments/schedules/..."
                              : "https://cal.com/dein-name/30min"
                          }
                          value={form.toolsConfig.bookingUrl}
                          onChange={(e) => updateTool("bookingUrl", e.target.value)}
                          hint="Link zu deinem Buchungskalender"
                        />
                        <Textarea
                          label="Wann soll ein Termin angeboten werden?"
                          placeholder="Biete einen Termin an, wenn der Anrufer eine Beratung, Demo oder persönliches Gespräch wünscht."
                          value={form.toolsConfig.bookingCondition}
                          onChange={(e) => updateTool("bookingCondition", e.target.value)}
                          rows={4}
                          hint="Beschreibe, in welchen Situationen ein Termin angeboten werden soll"
                        />
                      </>
                    )}
                  </>
                )}

                {/* ── Fallback-Regel ────────────────────────────────────── */}
                {activeSection === "fallback" && (
                  <Select
                    label="Was passiert, wenn der Assistent nicht helfen kann?"
                    value={form.fallbackRule}
                    onChange={(e) => update("fallbackRule", e.target.value)}
                    options={FALLBACK_OPTIONS}
                  />
                )}

                {/* ── Telefonnummer ─────────────────────────────────────── */}
                {activeSection === "telefon" && (
                  <Input
                    label="Telefonnummer"
                    placeholder="+49 30 12345678"
                    value={form.phoneNumber}
                    onChange={(e) => update("phoneNumber", e.target.value)}
                    hint="Wird von deinem Voice Provider (Vapi/Twilio) zugewiesen"
                  />
                )}

                {/* ── Vapi Verknüpfung ─────────────────────────────────── */}
                {activeSection === "vapi" && (
                  <Input
                    label="Vapi Assistant ID"
                    placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                    value={form.vapiAssistantId}
                    onChange={(e) => update("vapiAssistantId", e.target.value)}
                    hint="Bestehenden Vapi-Assistenten verknüpfen. Leer lassen um automatisch einen neuen zu erstellen."
                  />
                )}
              </div>
            </div>
          )}

          {/* Empty state when no section selected */}
          {!activeSection && (
            <div className="flex-1 flex items-center justify-center py-24 text-gray-300">
              <div className="text-center">
                <Settings className="w-10 h-10 mx-auto mb-3 opacity-30" />
                <p className="text-sm">Wähle eine Einstellung aus</p>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Delete Modal */}
      {mode === "edit" && (
        <Modal open={showDelete} onClose={() => setShowDelete(false)} title="Assistent löschen" size="sm">
          <p className="text-sm text-gray-600 mb-6">
            Möchtest du <strong>{form.name || assistantName}</strong> wirklich löschen? Alle
            zugehörigen Daten werden unwiderruflich entfernt.
          </p>
          <div className="flex gap-3">
            <Button variant="danger" loading={deleting} onClick={handleDelete}>Löschen</Button>
            <Button variant="secondary" onClick={() => setShowDelete(false)}>Abbrechen</Button>
          </div>
        </Modal>
      )}
    </div>
  );
}
