"use client";

import { Mic, MicOff, PhoneCall, PhoneOff, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useVapi } from "@/hooks/use-vapi";

interface VoiceCallProps {
  publicKey?: string;
  assistantId?: string;
  className?: string;
}

export function VoiceCall({ publicKey, assistantId, className }: VoiceCallProps) {
  const { status, isMuted, volumeLevel, error, start, stop, toggleMute } =
    useVapi({ publicKey, assistantId });

  const isIdle = status === "idle";
  const isConnecting = status === "connecting";
  const isActive = status === "active";
  const isEnding = status === "ending";
  const busy = isConnecting || isEnding;

  return (
    <div className={cn("flex flex-col items-center gap-4", className)}>
      {/* Audio visualiser ring */}
      <div className="relative flex items-center justify-center">
        {/* Outer pulse ring – visible only during active call */}
        {isActive && (
          <span
            className="absolute rounded-full bg-black/10 animate-ping"
            style={{
              width: `${72 + volumeLevel * 40}px`,
              height: `${72 + volumeLevel * 40}px`,
            }}
          />
        )}

        {/* Main call button */}
        <button
          onClick={isIdle ? start : stop}
          disabled={busy}
          aria-label={isIdle ? "Anruf starten" : "Anruf beenden"}
          className={cn(
            "relative z-10 w-16 h-16 rounded-full flex items-center justify-center transition-all duration-200 shadow-lg focus:outline-none",
            isIdle &&
              "bg-black text-white hover:bg-gray-800 active:scale-95",
            (isActive || isEnding) &&
              "bg-red-600 text-white hover:bg-red-700 active:scale-95",
            isConnecting && "bg-gray-400 text-white cursor-not-allowed",
          )}
        >
          {busy ? (
            <Loader2 className="w-6 h-6 animate-spin" />
          ) : isActive || isEnding ? (
            <PhoneOff className="w-6 h-6" />
          ) : (
            <PhoneCall className="w-6 h-6" />
          )}
        </button>
      </div>

      {/* Status label */}
      <p className="text-sm font-medium text-gray-700">
        {isIdle && "Anruf starten"}
        {isConnecting && "Verbinde…"}
        {isActive && "Gespräch läuft"}
        {isEnding && "Anruf wird beendet…"}
      </p>

      {/* Mute toggle – only during active call */}
      {isActive && (
        <button
          onClick={toggleMute}
          aria-label={isMuted ? "Stummschaltung aufheben" : "Stummschalten"}
          className={cn(
            "flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition",
            isMuted
              ? "bg-red-100 text-red-700 hover:bg-red-200"
              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
          )}
        >
          {isMuted ? (
            <MicOff className="w-4 h-4" />
          ) : (
            <Mic className="w-4 h-4" />
          )}
          {isMuted ? "Stummgeschaltet" : "Mikrofon an"}
        </button>
      )}

      {/* Error message */}
      {error && (
        <p className="text-xs text-red-600 text-center max-w-xs">{error}</p>
      )}
    </div>
  );
}
