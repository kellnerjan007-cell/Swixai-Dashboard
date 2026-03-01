"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Download } from "lucide-react";

export function ImportVapiButton() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  async function handleImport() {
    setLoading(true);
    setResult(null);
    try {
      const res = await fetch("/api/assistants/import", { method: "POST" });
      const data = await res.json();
      if (data.imported > 0) {
        setResult(`${data.imported} Assistent${data.imported !== 1 ? "en" : ""} importiert`);
        setTimeout(() => window.location.reload(), 1200);
      } else {
        setResult(data.message ?? "Nichts zu importieren");
      }
    } catch {
      setResult("Fehler beim Importieren");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex items-center gap-2">
      {result && (
        <span className="text-sm text-gray-500">{result}</span>
      )}
      <Button variant="secondary" size="sm" onClick={handleImport} disabled={loading}>
        <Download className="w-4 h-4" />
        {loading ? "Importiere…" : "Aus Vapi importieren"}
      </Button>
    </div>
  );
}
