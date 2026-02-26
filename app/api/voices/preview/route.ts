import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

const SAMPLE_TEXT: Record<string, string> = {
  de: "Hallo! Ich bin Ihr persönlicher KI-Assistent. Wie kann ich Ihnen heute helfen?",
  en: "Hello! I'm your personal AI assistant. How can I help you today?",
  fr: "Bonjour! Je suis votre assistant IA personnel. Comment puis-je vous aider?",
  es: "¡Hola! Soy su asistente de IA personal. ¿Cómo puedo ayudarle hoy?",
};

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const provider = searchParams.get("provider") ?? "openai";
  const voiceId = searchParams.get("voice") ?? "alloy";
  const language = searchParams.get("language") ?? "de";
  const text = SAMPLE_TEXT[language] ?? SAMPLE_TEXT.de;

  // ── ElevenLabs ────────────────────────────────────────────────────────────
  if (provider === "11labs") {
    const elKey = process.env.ELEVENLABS_API_KEY;
    if (!elKey) {
      return NextResponse.json({ error: "No ElevenLabs API key configured" }, { status: 503 });
    }
    const res = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${encodeURIComponent(voiceId)}`, {
      method: "POST",
      headers: {
        "xi-api-key": elKey,
        "Content-Type": "application/json",
        Accept: "audio/mpeg",
      },
      body: JSON.stringify({
        text,
        model_id: "eleven_multilingual_v2",
        voice_settings: { stability: 0.45, similarity_boost: 0.8, style: 0.2, use_speaker_boost: true },
      }),
    });
    if (!res.ok) {
      const err = await res.text();
      return NextResponse.json({ error: err }, { status: res.status });
    }
    const audio = await res.arrayBuffer();
    return new NextResponse(audio, {
      headers: { "Content-Type": "audio/mpeg", "Cache-Control": "public, max-age=3600" },
    });
  }

  // ── Deepgram ──────────────────────────────────────────────────────────────
  if (provider === "deepgram") {
    const dgKey = process.env.DEEPGRAM_API_KEY;
    if (dgKey) {
      const res = await fetch(`https://api.deepgram.com/v1/speak?model=${encodeURIComponent(voiceId)}&encoding=mp3`, {
        method: "POST",
        headers: {
          Authorization: `Token ${dgKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ text: SAMPLE_TEXT.en }), // Deepgram voices are English
      });
      if (res.ok) {
        const audio = await res.arrayBuffer();
        return new NextResponse(audio, {
          headers: { "Content-Type": "audio/mpeg", "Cache-Control": "public, max-age=3600" },
        });
      }
    }
    // Fall through to OpenAI as stand-in for Deepgram preview
  }

  // ── OpenAI (default + Deepgram fallback) ─────────────────────────────────
  const openaiKey = process.env.OPENAI_API_KEY;
  if (!openaiKey) {
    return NextResponse.json({ error: "No OpenAI API key configured" }, { status: 503 });
  }

  // Map Deepgram voices to a similar OpenAI voice for preview
  let openaiVoice = voiceId;
  if (provider === "deepgram") {
    const DEEPGRAM_TO_OPENAI: Record<string, string> = {
      "aura-asteria-en": "nova",
      "aura-luna-en": "shimmer",
      "aura-stella-en": "shimmer",
      "aura-athena-en": "fable",
      "aura-orion-en": "onyx",
      "aura-arcas-en": "echo",
      "aura-orpheus-en": "onyx",
      "aura-helios-en": "echo",
      "aura-zeus-en": "onyx",
    };
    openaiVoice = DEEPGRAM_TO_OPENAI[voiceId] ?? "alloy";
  }

  const res = await fetch("https://api.openai.com/v1/audio/speech", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${openaiKey}`,
      "Content-Type": "application/json",
    },
    // tts-1-hd = highest quality OpenAI TTS model
    body: JSON.stringify({ model: "tts-1-hd", input: text, voice: openaiVoice, response_format: "mp3" }),
  });
  if (!res.ok) {
    const err = await res.text();
    return NextResponse.json({ error: err }, { status: res.status });
  }
  const audio = await res.arrayBuffer();
  return new NextResponse(audio, {
    headers: { "Content-Type": "audio/mpeg", "Cache-Control": "public, max-age=3600" },
  });
}
