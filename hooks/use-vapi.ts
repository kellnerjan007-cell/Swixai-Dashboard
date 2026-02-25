"use client";

import { useEffect, useRef, useCallback, useState } from "react";
import Vapi from "@vapi-ai/web";

export type CallStatus = "idle" | "connecting" | "active" | "ending";

export interface UseVapiOptions {
  publicKey?: string;
  assistantId?: string;
}

export function useVapi(options?: UseVapiOptions) {
  const publicKey =
    options?.publicKey ?? process.env.NEXT_PUBLIC_VAPI_PUBLIC_KEY ?? "";
  const assistantId =
    options?.assistantId ?? process.env.NEXT_PUBLIC_VAPI_ASSISTANT_ID ?? "";

  const vapiRef = useRef<Vapi | null>(null);
  const [status, setStatus] = useState<CallStatus>("idle");
  const [isMuted, setIsMuted] = useState(false);
  const [volumeLevel, setVolumeLevel] = useState(0);
  const [error, setError] = useState<string | null>(null);

  // Initialise Vapi once
  useEffect(() => {
    if (!publicKey) return;
    vapiRef.current = new Vapi(publicKey);
    const vapi = vapiRef.current;

    vapi.on("call-start", () => {
      setStatus("active");
      setError(null);
    });

    vapi.on("call-end", () => {
      setStatus("idle");
      setIsMuted(false);
      setVolumeLevel(0);
    });

    vapi.on("volume-level", (level: number) => {
      setVolumeLevel(level);
    });

    vapi.on("error", (err: unknown) => {
      const msg =
        err instanceof Error ? err.message : "Ein Fehler ist aufgetreten.";
      setError(msg);
      setStatus("idle");
    });

    return () => {
      vapi.stop();
    };
  }, [publicKey]);

  const start = useCallback(async () => {
    if (!vapiRef.current) return;
    if (!assistantId) {
      setError("Keine Assistenten-ID konfiguriert.");
      return;
    }
    setStatus("connecting");
    setError(null);
    try {
      await vapiRef.current.start(assistantId);
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : "Anruf konnte nicht gestartet werden.";
      setError(msg);
      setStatus("idle");
    }
  }, [assistantId]);

  const stop = useCallback(() => {
    if (!vapiRef.current) return;
    setStatus("ending");
    vapiRef.current.stop();
  }, []);

  const toggleMute = useCallback(() => {
    if (!vapiRef.current || status !== "active") return;
    const next = !isMuted;
    vapiRef.current.setMuted(next);
    setIsMuted(next);
  }, [isMuted, status]);

  return { status, isMuted, volumeLevel, error, start, stop, toggleMute };
}
