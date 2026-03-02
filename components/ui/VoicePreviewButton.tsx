"use client";

import { useState } from "react";
import { Volume2, Square } from "lucide-react";

const SAMPLE_TEXT: Record<string, string> = {
  de: "Hallo! Ich bin Ihr KI-Assistent. Wie kann ich Ihnen heute helfen?",
  en: "Hello! I'm your AI assistant. How can I help you today?",
  fr: "Bonjour! Je suis votre assistant IA. Comment puis-je vous aider?",
  es: "¡Hola! Soy su asistente de IA. ¿Cómo puedo ayudarle hoy?",
};

const LANG_CODE: Record<string, string> = {
  de: "de-DE",
  en: "en-US",
  fr: "fr-FR",
  es: "es-ES",
};

// Approximate voice character via pitch & rate
const VOICE_STYLE: Record<string, { pitch: number; rate: number }> = {
  alloy:   { pitch: 1.0, rate: 1.0 },
  echo:    { pitch: 0.85, rate: 0.95 },
  fable:   { pitch: 1.0, rate: 0.9 },
  onyx:    { pitch: 0.7, rate: 0.88 },
  nova:    { pitch: 1.2, rate: 1.0 },
  shimmer: { pitch: 1.35, rate: 1.05 },
};

interface VoicePreviewButtonProps {
  voice: string;
  language: string;
}

export function VoicePreviewButton({ voice, language }: VoicePreviewButtonProps) {
  const [playing, setPlaying] = useState(false);

  function handleToggle() {
    if (!window.speechSynthesis) return;

    if (playing) {
      window.speechSynthesis.cancel();
      setPlaying(false);
      return;
    }

    const text = SAMPLE_TEXT[language] ?? SAMPLE_TEXT.de;
    const langCode = LANG_CODE[language] ?? "de-DE";
    const style = VOICE_STYLE[voice] ?? { pitch: 1.0, rate: 1.0 };

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = langCode;
    utterance.pitch = style.pitch;
    utterance.rate = style.rate;

    utterance.onstart = () => setPlaying(true);
    utterance.onend = () => setPlaying(false);
    utterance.onerror = () => setPlaying(false);

    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utterance);
  }

  return (
    <button
      type="button"
      onClick={handleToggle}
      title="Hörprobe abspielen"
      className={`
        flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition
        ${playing
          ? "bg-indigo-50 border-indigo-200 text-indigo-700"
          : "bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100"
        }
      `}
    >
      {playing ? (
        <>
          <Square className="w-3 h-3 fill-current" />
          Stopp
        </>
      ) : (
        <>
          <Volume2 className="w-3 h-3" />
          Hörprobe
        </>
      )}
    </button>
  );
}
