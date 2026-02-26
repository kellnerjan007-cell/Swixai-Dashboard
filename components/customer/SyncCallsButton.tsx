"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/Button";

export function SyncCallsButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [lastSynced, setLastSynced] = useState<string | null>(null);

  const sync = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const res = await fetch("/api/calls/sync", { method: "POST" });
      if (res.ok) {
        setLastSynced(new Date().toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" }));
        router.refresh();
      }
    } catch {
      // silent fail for auto-sync
    } finally {
      if (!silent) setLoading(false);
    }
  }, [router]);

  // Auto-sync on mount
  useEffect(() => {
    sync(true);
  }, [sync]);

  // Auto-sync every 60 seconds
  useEffect(() => {
    const interval = setInterval(() => sync(true), 60_000);
    return () => clearInterval(interval);
  }, [sync]);

  return (
    <div className="flex items-center gap-3">
      {lastSynced && (
        <span className="text-xs text-gray-400">Sync: {lastSynced}</span>
      )}
      <Button variant="secondary" size="sm" onClick={() => sync(false)} loading={loading}>
        <RefreshCw className="w-4 h-4" />
        Sync
      </Button>
    </div>
  );
}
