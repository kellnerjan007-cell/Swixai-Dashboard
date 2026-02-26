"use client";

import { useState, useEffect } from "react";
import { Topbar } from "@/components/customer/Topbar";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { CheckCircle, XCircle, Zap, Webhook, Copy, Check } from "lucide-react";

const WEBHOOK_URL = `${typeof window !== "undefined" ? window.location.origin : ""}/api/webhooks/vapi`;

export default function SettingsPage() {
  const [vapiKey, setVapiKey] = useState("");
  const [keyStatus, setKeyStatus] = useState<"unknown" | "set" | "unset">("unknown");
  const [maskedKey, setMaskedKey] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetch("/api/settings")
      .then((r) => r.json())
      .then((data) => {
        setKeyStatus(data.vapiApiKeySet ? "set" : "unset");
        setMaskedKey(data.vapiApiKeyMasked ?? null);
      });
  }, []);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    setSuccess("");

    const res = await fetch("/api/settings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ vapiApiKey: vapiKey }),
    });
    const data = await res.json();

    if (!res.ok) {
      setError(data.error ?? "Fehler beim Speichern");
    } else {
      setSuccess("Vapi API Key erfolgreich gespeichert und verbunden!");
      setKeyStatus("set");
      setMaskedKey(vapiKey ? `${vapiKey.slice(0, 12)}${"•".repeat(20)}` : null);
      setVapiKey("");
    }
    setSaving(false);
  }

  async function handleDisconnect() {
    setSaving(true);
    setError("");
    setSuccess("");
    await fetch("/api/settings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ vapiApiKey: "" }),
    });
    setKeyStatus("unset");
    setMaskedKey(null);
    setSuccess("Vapi Verbindung getrennt.");
    setSaving(false);
  }

  function copyWebhook() {
    navigator.clipboard.writeText(WEBHOOK_URL);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <>
      <Topbar title="Einstellungen" subtitle="Integrationen & Konfiguration" />
      <main className="flex-1 px-8 py-8 space-y-6 max-w-2xl">

        {/* Vapi Integration */}
        <Card>
          <div className="flex items-start gap-4 mb-6">
            <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center flex-shrink-0">
              <Zap className="w-5 h-5 text-indigo-600" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h2 className="text-base font-semibold text-gray-900">Vapi.ai Verbindung</h2>
                {keyStatus === "set" && (
                  <span className="flex items-center gap-1 text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                    <CheckCircle className="w-3 h-3" /> Verbunden
                  </span>
                )}
                {keyStatus === "unset" && (
                  <span className="flex items-center gap-1 text-xs font-medium text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                    <XCircle className="w-3 h-3" /> Nicht verbunden
                  </span>
                )}
              </div>
              <p className="text-sm text-gray-500 mt-0.5">
                Verbinde deinen Vapi Account damit Anrufdaten, Kosten und Transkripte automatisch synchronisiert werden.
              </p>
            </div>
          </div>

          {keyStatus === "set" && maskedKey && (
            <div className="mb-4 flex items-center justify-between bg-gray-50 border border-gray-200 rounded-xl px-4 py-3">
              <div>
                <p className="text-xs text-gray-500 mb-0.5">Aktueller API Key</p>
                <p className="text-sm font-mono text-gray-700">{maskedKey}</p>
              </div>
              <Button variant="secondary" size="sm" onClick={handleDisconnect} loading={saving}>
                Trennen
              </Button>
            </div>
          )}

          <form onSubmit={handleSave} className="space-y-4">
            <Input
              label={keyStatus === "set" ? "Neuen API Key eintragen (ersetzt den alten)" : "Vapi API Key"}
              placeholder="va-..."
              value={vapiKey}
              onChange={(e) => setVapiKey(e.target.value)}
              hint="Zu finden unter: dashboard.vapi.ai → Account → API Keys"
            />

            {error && (
              <p className="text-sm text-red-600 bg-red-50 border border-red-100 px-4 py-3 rounded-xl">
                {error}
              </p>
            )}
            {success && (
              <p className="text-sm text-emerald-700 bg-emerald-50 border border-emerald-100 px-4 py-3 rounded-xl">
                {success}
              </p>
            )}

            <Button type="submit" loading={saving} disabled={!vapiKey}>
              {keyStatus === "set" ? "Key aktualisieren" : "Verbinden & testen"}
            </Button>
          </form>
        </Card>

        {/* Webhook URL */}
        <Card>
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center flex-shrink-0">
              <Webhook className="w-5 h-5 text-gray-600" />
            </div>
            <div className="flex-1">
              <h2 className="text-base font-semibold text-gray-900 mb-1">Webhook URL</h2>
              <p className="text-sm text-gray-500 mb-4">
                Trage diese URL in deinem Vapi Dashboard ein unter{" "}
                <strong>Settings → Webhooks → Server URL</strong>, damit Anrufdaten in Echtzeit synchronisiert werden.
              </p>

              <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-xl px-4 py-3">
                <code className="text-sm text-gray-700 flex-1 break-all">
                  {typeof window !== "undefined" ? window.location.origin : "https://deine-domain.com"}/api/webhooks/vapi
                </code>
                <button
                  onClick={copyWebhook}
                  className="flex-shrink-0 p-1.5 rounded-lg hover:bg-gray-200 transition text-gray-500"
                  title="Kopieren"
                >
                  {copied ? (
                    <Check className="w-4 h-4 text-emerald-600" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </button>
              </div>

              <p className="text-xs text-gray-400 mt-3">
                Für lokale Tests: installiere ngrok und starte{" "}
                <code className="bg-gray-100 px-1 rounded">ngrok http 3000</code>, dann trage die ngrok-URL ein.
              </p>
            </div>
          </div>
        </Card>
      </main>
    </>
  );
}
