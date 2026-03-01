"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/Button";

export function SyncCallsButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<string | null>(null);

  const sync = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const res = await fetch("/api/calls/sync", { method: "POST" });
      const data = await res.json();
      if (res.ok) {
        setStatus(`${data.synced} von ${data.total} importiert`);
        router.refresh();
      } else {
        setStatus(`Fehler: ${data.error ?? res.statusText}`);
      }
    } catch (e) {
      if (!silent) setStatus(`Fehler: ${e instanceof Error ? e.message : "Unbekannt"}`);
    } finally {
      if (!silent) setLoading(false);
    }
  }, [router]);

  useEffect(() => { sync(true); }, [sync]);
  useEffect(() => {
    const interval = setInterval(() => sync(true), 60_000);
    return () => clearInterval(interval);
  }, [sync]);

  return (
    <div className="flex items-center gap-3">
      {status && (
        <span className={`text-xs ${status.startsWith("Fehler") ? "text-red-500" : "text-gray-400"}`}>
          {status}
        </span>
      )}
      <Button variant="secondary" size="sm" onClick={() => sync(false)} loading={loading}>
        <RefreshCw className="w-4 h-4" />
        Sync
      </Button>
    </div>
  );
}
