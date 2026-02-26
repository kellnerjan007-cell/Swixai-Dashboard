import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getUserWorkspace } from "@/lib/workspace";

const OPENAI_VOICES = [
  { provider: "openai", providerId: "alloy",   name: "Alloy",   gender: "neutral", previewUrl: null },
  { provider: "openai", providerId: "echo",    name: "Echo",    gender: "male",    previewUrl: null },
  { provider: "openai", providerId: "fable",   name: "Fable",   gender: "female",  previewUrl: null },
  { provider: "openai", providerId: "onyx",    name: "Onyx",    gender: "male",    previewUrl: null },
  { provider: "openai", providerId: "nova",    name: "Nova",    gender: "female",  previewUrl: null },
  { provider: "openai", providerId: "shimmer", name: "Shimmer", gender: "female",  previewUrl: null },
];

const DEEPGRAM_VOICES = [
  { provider: "deepgram", providerId: "aura-asteria-en",  name: "Asteria",  gender: "female", previewUrl: null },
  { provider: "deepgram", providerId: "aura-luna-en",     name: "Luna",     gender: "female", previewUrl: null },
  { provider: "deepgram", providerId: "aura-stella-en",   name: "Stella",   gender: "female", previewUrl: null },
  { provider: "deepgram", providerId: "aura-athena-en",   name: "Athena",   gender: "female", previewUrl: null },
  { provider: "deepgram", providerId: "aura-orion-en",    name: "Orion",    gender: "male",   previewUrl: null },
  { provider: "deepgram", providerId: "aura-arcas-en",    name: "Arcas",    gender: "male",   previewUrl: null },
  { provider: "deepgram", providerId: "aura-orpheus-en",  name: "Orpheus",  gender: "male",   previewUrl: null },
  { provider: "deepgram", providerId: "aura-helios-en",   name: "Helios",   gender: "male",   previewUrl: null },
  { provider: "deepgram", providerId: "aura-zeus-en",     name: "Zeus",     gender: "male",   previewUrl: null },
];

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const workspace = await getUserWorkspace(session.user.id);
  const vapiKey = workspace?.vapiApiKey || process.env.VAPI_API_KEY;

  // 1. Try Vapi voice library
  if (vapiKey) {
    try {
      const res = await fetch("https://api.vapi.ai/voice-library?page=0&perPage=1000", {
        headers: { Authorization: `Bearer ${vapiKey}` },
      });
      if (res.ok) {
        type VapiVoice = { provider?: string; providerId?: string; voiceId?: string; name?: string; gender?: string; previewUrl?: string; language?: string };
        const data = await res.json() as VapiVoice[] | { results?: VapiVoice[] };
        const list: VapiVoice[] = Array.isArray(data) ? data : (data.results ?? []);
        if (list.length > 0) {
          const mapped = list.map((v) => ({
            provider: v.provider ?? "11labs",
            providerId: v.providerId ?? v.voiceId ?? "",
            name: v.name ?? "",
            gender: v.gender ?? null,
            previewUrl: v.previewUrl ?? null,
          }));
          return NextResponse.json([...OPENAI_VOICES, ...mapped, ...DEEPGRAM_VOICES]);
        }
      }
    } catch { /* fall through */ }
  }

  // 2. Fallback: ElevenLabs public API (no auth needed for default voices)
  try {
    const res = await fetch("https://api.elevenlabs.io/v1/voices", {
      headers: { Accept: "application/json" },
    });
    if (res.ok) {
      type ELVoice = { voice_id: string; name: string; labels?: { gender?: string; accent?: string }; preview_url?: string };
      const data = await res.json() as { voices: ELVoice[] };
      const elVoices = data.voices.map((v) => ({
        provider: "11labs",
        providerId: v.voice_id,
        name: v.name,
        gender: v.labels?.gender ?? null,
        accent: v.labels?.accent ?? null,
        previewUrl: v.preview_url ?? null,
      }));
      return NextResponse.json([...OPENAI_VOICES, ...elVoices, ...DEEPGRAM_VOICES]);
    }
  } catch { /* fall through */ }

  // 3. Last resort: static list, no previews
  return NextResponse.json([...OPENAI_VOICES, ...DEEPGRAM_VOICES]);
}
