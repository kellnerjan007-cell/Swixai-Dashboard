"use client";

import { useState, useEffect, useRef } from "react";
import { Search, Play, Square, ChevronDown, Mic } from "lucide-react";

export interface VoiceOption {
  value: string; // "provider:voiceId"
  label: string;
  provider: string;
  gender?: string;
  previewUrl?: string;
}

interface VoicePickerProps {
  value: string;
  onChange: (value: string, label: string) => void;
  label?: string;
  language?: string;
}

const PROVIDER_LABEL: Record<string, string> = {
  "11labs": "ElevenLabs",
  openai: "OpenAI",
  deepgram: "Deepgram",
  playht: "PlayHT",
  cartesia: "Cartesia",
  lmnt: "LMNT",
  azure: "Azure",
  neets: "Neets",
  rime: "Rime AI",
};

const LANG_CODE: Record<string, string> = {
  de: "de-DE",
  en: "en-US",
  fr: "fr-FR",
  es: "es-ES",
};

const SAMPLE_TEXT: Record<string, string> = {
  de: "Hallo! Ich bin Ihr KI-Assistent. Wie kann ich Ihnen heute helfen?",
  en: "Hello! I'm your AI assistant. How can I help you today?",
  fr: "Bonjour! Je suis votre assistant IA. Comment puis-je vous aider?",
  es: "¡Hola! Soy su asistente de IA. ¿Cómo puedo ayudarle hoy?",
};

export function VoicePicker({ value, onChange, label = "Stimme", language = "de" }: VoicePickerProps) {
  const [open, setOpen] = useState(false);
  const [voices, setVoices] = useState<VoiceOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [providerFilter, setProviderFilter] = useState("all");
  const [playingUrl, setPlayingUrl] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const selectedVoice = voices.find((v) => v.value === value);

  useEffect(() => {
    if (!open || voices.length > 0) return;
    setLoading(true);
    fetch("/api/voices")
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) {
          const mapped: VoiceOption[] = data.map((v) => ({
            value: `${v.provider}:${v.providerId}`,
            label: v.name,
            provider: v.provider,
            gender: v.gender,
            previewUrl: v.previewUrl,
          }));
          setVoices(mapped);
        } else {
          setError(data.error ?? "Fehler beim Laden");
        }
      })
      .catch(() => setError("Netzwerkfehler"))
      .finally(() => setLoading(false));
  }, [open, voices.length]);

  function playAudioUrl(url: string, key: string, fallback: () => void) {
    const audio = new Audio(url);
    audioRef.current = audio;
    audio.onended = () => setPlayingUrl(null);
    audio.onerror = () => { audioRef.current = null; fallback(); };
    audio.play().catch(() => { audioRef.current = null; fallback(); });
  }

  function playPreview(v: VoiceOption) {
    const key = v.value;

    // Stop if already playing
    if (playingUrl === key) {
      audioRef.current?.pause();
      audioRef.current = null;
      window.speechSynthesis?.cancel();
      setPlayingUrl(null);
      return;
    }

    stopPreview();
    setPlayingUrl(key);

    const voiceId = v.value.split(":")[1] ?? "";

    if (v.provider === "11labs" && v.previewUrl) {
      // ElevenLabs pre-recorded samples are highest quality — use directly
      playAudioUrl(v.previewUrl, key, () => {
        // Fallback to server-side TTS if direct URL fails
        const url = `/api/voices/preview?provider=11labs&voice=${encodeURIComponent(voiceId)}&language=${encodeURIComponent(language)}`;
        playAudioUrl(url, key, () => speakTTS(v));
      });
    } else if (v.provider === "openai" || v.provider === "11labs" || v.provider === "deepgram") {
      // Server-side TTS with high quality model (tts-1-hd / ElevenLabs multilingual v2)
      const url = `/api/voices/preview?provider=${encodeURIComponent(v.provider)}&voice=${encodeURIComponent(voiceId)}&language=${encodeURIComponent(language)}`;
      playAudioUrl(url, key, () => speakTTS(v));
    } else if (v.previewUrl) {
      playAudioUrl(v.previewUrl, key, () => speakTTS(v));
    } else {
      speakTTS(v);
    }
  }

  function speakTTS(v: VoiceOption) {
    const voiceId = v.value.split(":")[1] ?? "";
    const text = SAMPLE_TEXT[language] ?? SAMPLE_TEXT.de;
    const langCode = LANG_CODE[language] ?? "de-DE";

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = langCode;

    // Pick the best available system voice for the target language
    const systemVoices = window.speechSynthesis.getVoices();
    const PREFERRED: Record<string, string[]> = {
      "de-DE": ["Anna", "Markus", "Yannick", "Petra", "Google Deutsch", "Microsoft Hedda"],
      "en-US": ["Samantha", "Alex", "Google US English", "Microsoft Zira"],
      "fr-FR": ["Thomas", "Amelie", "Google français"],
      "es-ES": ["Monica", "Jorge", "Google español"],
    };
    const preferred = PREFERRED[langCode] ?? [];
    const bestVoice =
      preferred.reduce<SpeechSynthesisVoice | null>((found, name) => {
        if (found) return found;
        return systemVoices.find((sv) => sv.name.includes(name) && sv.lang.startsWith(langCode.slice(0, 2))) ?? null;
      }, null) ??
      systemVoices.find((sv) => sv.lang.startsWith(langCode.slice(0, 2)) && sv.localService) ??
      systemVoices.find((sv) => sv.lang.startsWith(langCode.slice(0, 2))) ??
      null;

    if (bestVoice) utterance.voice = bestVoice;

    // Vary pitch/rate to distinguish voices
    const GENDER_PITCH: Record<string, number> = { female: 1.1, male: 0.85, neutral: 1.0 };
    utterance.pitch = GENDER_PITCH[v.gender ?? "neutral"] ?? 1.0;
    utterance.rate = voiceId === "shimmer" ? 1.05 : voiceId === "onyx" ? 0.88 : 1.0;

    utterance.onend = () => setPlayingUrl(null);
    utterance.onerror = () => setPlayingUrl(null);
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utterance);
  }

  function stopPreview() {
    audioRef.current?.pause();
    audioRef.current = null;
    window.speechSynthesis?.cancel();
    setPlayingUrl(null);
  }

  function selectVoice(v: VoiceOption) {
    stopPreview();
    onChange(v.value, v.label);
    setOpen(false);
    setSearch("");
  }

  const providers = ["all", ...Array.from(new Set(voices.map((v) => v.provider)))];

  const filtered = voices.filter((v) => {
    const matchSearch =
      v.label.toLowerCase().includes(search.toLowerCase()) ||
      v.provider.toLowerCase().includes(search.toLowerCase());
    const matchProvider = providerFilter === "all" || v.provider === providerFilter;
    return matchSearch && matchProvider;
  });

  return (
    <div className="space-y-1.5">
      {label && (
        <label className="block text-sm font-medium text-gray-700">{label}</label>
      )}

      {/* Trigger button */}
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="w-full flex items-center justify-between px-3 py-2.5 bg-white border border-gray-200 rounded-xl text-sm text-gray-900 hover:border-gray-300 transition focus:outline-none focus:ring-2 focus:ring-black/10"
      >
        <div className="flex items-center gap-2">
          <Mic className="w-4 h-4 text-gray-400" />
          <span>{selectedVoice ? selectedVoice.label : (value || "Stimme wählen...")}</span>
          {selectedVoice && (
            <span className="text-xs text-gray-400">
              {PROVIDER_LABEL[selectedVoice.provider] ?? selectedVoice.provider}
            </span>
          )}
        </div>
        <ChevronDown className="w-4 h-4 text-gray-400" />
      </button>

      {/* Modal */}
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => { stopPreview(); setOpen(false); }}
          />
          <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-xl border border-gray-200 flex flex-col" style={{ maxHeight: "560px" }}>
            {/* Header */}
            <div className="px-5 pt-5 pb-4 border-b border-gray-100">
              <h2 className="text-base font-semibold text-gray-900 mb-3">Stimme auswählen</h2>
              <div className="relative mb-3">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  autoFocus
                  type="text"
                  placeholder="Name oder Anbieter suchen..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-10 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-black/10"
                />
              </div>
              {/* Provider filter */}
              <div className="flex gap-2 flex-wrap">
                {providers.map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setProviderFilter(p)}
                    className={`px-3 py-1 rounded-full text-xs font-medium border transition ${
                      providerFilter === p
                        ? "bg-gray-900 text-white border-gray-900"
                        : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"
                    }`}
                  >
                    {p === "all" ? "Alle" : (PROVIDER_LABEL[p] ?? p)}
                  </button>
                ))}
              </div>
            </div>

            {/* Voice list — scrollable */}
            <div className="overflow-y-auto flex-1 min-h-0">
              {loading && (
                <div className="flex items-center justify-center py-12">
                  <div className="w-6 h-6 border-2 border-black border-t-transparent rounded-full animate-spin" />
                </div>
              )}
              {error && (
                <p className="text-sm text-red-600 text-center py-8">{error}</p>
              )}
              {!loading && !error && filtered.length === 0 && (
                <p className="text-sm text-gray-500 text-center py-8">Keine Stimmen gefunden</p>
              )}
              {!loading && !error && filtered.map((v) => (
                <div
                  key={v.value}
                  onClick={() => selectVoice(v)}
                  className={`flex items-center gap-3 px-5 py-3 cursor-pointer hover:bg-gray-50 transition ${
                    value === v.value ? "bg-indigo-50" : ""
                  }`}
                >
                  {/* Play button */}
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); playPreview(v); }}
                    className="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 hover:bg-indigo-100 transition text-gray-600 hover:text-indigo-700"
                  >
                    {playingUrl === v.value
                      ? <Square className="w-3 h-3 fill-current" />
                      : <Play className="w-3 h-3 fill-current" />
                    }
                  </button>

                  {/* Name + provider */}
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-medium truncate ${value === v.value ? "text-indigo-700" : "text-gray-900"}`}>
                      {v.label}
                    </p>
                    <p className="text-xs text-gray-400">
                      {PROVIDER_LABEL[v.provider] ?? v.provider}
                      {v.gender ? ` · ${v.gender === "male" ? "männlich" : v.gender === "female" ? "weiblich" : v.gender}` : ""}
                    </p>
                  </div>

                  {value === v.value && (
                    <span className="text-xs font-medium text-indigo-600">Aktiv</span>
                  )}
                </div>
              ))}
            </div>

            {/* Footer */}
            <div className="px-5 py-3 border-t border-gray-100 flex justify-between items-center">
              <span className="text-xs text-gray-400">{filtered.length} Stimmen</span>
              <button
                type="button"
                onClick={() => { stopPreview(); setOpen(false); }}
                className="text-sm text-gray-600 hover:text-gray-900"
              >
                Schließen
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
