/**
 * Vapi API Client
 * Docs: https://docs.vapi.ai
 *
 * Per-workspace Vapi API key is used if set (saved via Settings page).
 * Falls back to the platform VAPI_API_KEY from .env.
 * Webhook URL to configure in Vapi: https://yourdomain.com/api/webhooks/vapi
 */

const VAPI_BASE = "https://api.vapi.ai";

function getHeaders(apiKey?: string | null) {
  const key = apiKey || process.env.VAPI_API_KEY;
  if (!key) throw new Error("Kein Vapi API Key konfiguriert");
  return {
    Authorization: `Bearer ${key}`,
    "Content-Type": "application/json",
  };
}

/**
 * Voice is stored as "provider:voiceId" (e.g. "11labs:rachel").
 * Legacy values without ":" are treated as OpenAI voices.
 */
function parseVoice(voice?: string | null): { provider: string; voiceId: string } {
  if (voice && voice.includes(":")) {
    const [provider, ...rest] = voice.split(":");
    return { provider, voiceId: rest.join(":") };
  }
  return { provider: "openai", voiceId: voice ?? "alloy" };
}

export interface ToolsConfig {
  // FAQ / Company info
  qaEnabled?: boolean;
  companyInfo?: string;
  companyUrl?: string;
  // Call transfer
  transferEnabled?: boolean;
  transferPhone?: string;
  transferCondition?: string;
  // Email
  emailEnabled?: boolean;
  emailName?: string;
  emailRecipient?: string;
  emailSubject?: string;
  emailCondition?: string;
  emailBody?: string;
  // SMS
  smsEnabled?: boolean;
  smsRecipientType?: string;
  smsPhone?: string;
  smsSender?: string;
  smsCondition?: string;
  smsContent?: string;
  // Booking
  bookingEnabled?: boolean;
  bookingProvider?: string;
  bookingUrl?: string;
  bookingCondition?: string;
}

function buildVapiTools(config?: ToolsConfig | null): Record<string, unknown>[] {
  const tools: Record<string, unknown>[] = [];
  const webhookBase = process.env.NEXTAUTH_URL ?? "";

  if (config?.transferEnabled && config.transferPhone) {
    tools.push({
      type: "transferCall",
      destinations: [{
        type: "number",
        number: config.transferPhone,
        description: config.transferCondition || "Transfer to agent",
      }],
    });
  }

  if (config?.emailEnabled && config.emailRecipient) {
    tools.push({
      type: "function",
      function: {
        name: "sendEmail",
        description: config.emailCondition
          ? `E-Mail senden wenn: ${config.emailCondition}`
          : "E-Mail an den zuständigen Mitarbeiter senden",
        parameters: {
          type: "object",
          properties: {
            subject: { type: "string", description: "Betreff der E-Mail" },
            body: { type: "string", description: "Inhalt der E-Mail" },
          },
          required: ["subject", "body"],
        },
      },
      server: { url: `${webhookBase}/api/webhooks/vapi` },
    });
  }

  if (config?.smsEnabled) {
    tools.push({
      type: "function",
      function: {
        name: "sendSMS",
        description: config.smsCondition
          ? `SMS senden wenn: ${config.smsCondition}`
          : "SMS-Nachricht senden",
        parameters: {
          type: "object",
          properties: {
            message: { type: "string", description: "Inhalt der SMS" },
            to: { type: "string", description: "Empfänger-Telefonnummer" },
          },
          required: ["message"],
        },
      },
      server: { url: `${webhookBase}/api/webhooks/vapi` },
    });
  }

  if (config?.bookingEnabled && config.bookingUrl) {
    tools.push({
      type: "function",
      function: {
        name: "bookAppointment",
        description: config.bookingCondition
          ? `Termin buchen wenn: ${config.bookingCondition}`
          : "Termin für den Anrufer buchen",
        parameters: {
          type: "object",
          properties: {
            name: { type: "string", description: "Name des Kunden" },
            email: { type: "string", description: "E-Mail des Kunden" },
            phone: { type: "string", description: "Telefonnummer des Kunden" },
            preferredTime: { type: "string", description: "Gewünschter Termin" },
          },
          required: ["name"],
        },
      },
      server: { url: `${webhookBase}/api/webhooks/vapi` },
    });
  }

  return tools;
}

/** Maps our Assistant fields to Vapi's create/update payload */
function buildPayload(data: {
  name: string;
  systemPrompt?: string | null;
  voice?: string | null;
  language?: string | null;
  toolsConfig?: ToolsConfig | null;
}) {
  const { provider, voiceId } = parseVoice(data.voice);
  const tools = buildVapiTools(data.toolsConfig);

  // Prepend company info to system prompt when FAQ is enabled
  let fullPrompt = data.systemPrompt ?? "";
  const cfg = data.toolsConfig;
  if (cfg?.qaEnabled && cfg.companyInfo) {
    fullPrompt = `# Unternehmensinfos\n${cfg.companyInfo}\n\n${fullPrompt}`;
  }

  // Append booking URL hint to prompt
  if (cfg?.bookingEnabled && cfg.bookingUrl) {
    fullPrompt += `\n\nTerminbuchung-Link: ${cfg.bookingUrl}`;
  }

  return {
    name: data.name,
    model: {
      provider: "openai",
      model: "gpt-4o-mini",
      ...(fullPrompt ? { systemPrompt: fullPrompt } : {}),
      ...(tools.length > 0 ? { tools } : {}),
    },
    voice: { provider, voiceId },
    transcriber: {
      provider: "deepgram",
      language: data.language ?? "de",
    },
  };
}

export async function createVapiAssistant(
  data: Parameters<typeof buildPayload>[0],
  apiKey?: string | null
): Promise<string> {
  const res = await fetch(`${VAPI_BASE}/assistant`, {
    method: "POST",
    headers: getHeaders(apiKey),
    body: JSON.stringify(buildPayload(data)),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Vapi create assistant failed (${res.status}): ${text}`);
  }
  const json = (await res.json()) as { id: string };
  return json.id;
}

export async function updateVapiAssistant(
  vapiId: string,
  data: Parameters<typeof buildPayload>[0],
  apiKey?: string | null
): Promise<void> {
  const res = await fetch(`${VAPI_BASE}/assistant/${vapiId}`, {
    method: "PATCH",
    headers: getHeaders(apiKey),
    body: JSON.stringify(buildPayload(data)),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Vapi update assistant failed (${res.status}): ${text}`);
  }
}

export async function deleteVapiAssistant(
  vapiId: string,
  apiKey?: string | null
): Promise<void> {
  const res = await fetch(`${VAPI_BASE}/assistant/${vapiId}`, {
    method: "DELETE",
    headers: getHeaders(apiKey),
  });
  // 404 means already gone — that's fine
  if (!res.ok && res.status !== 404) {
    const text = await res.text();
    throw new Error(`Vapi delete assistant failed (${res.status}): ${text}`);
  }
}

export interface VapiVoice {
  providerId: string;
  provider: string;
  name: string;
  gender?: string;
  language?: string;
  previewUrl?: string;
  accent?: string;
}

/** Fetches available voices from Vapi voice library */
export async function fetchVapiVoices(apiKey?: string | null): Promise<VapiVoice[]> {
  const res = await fetch(`${VAPI_BASE}/voice-library?limit=1000`, {
    headers: getHeaders(apiKey),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Vapi voice library failed (${res.status}): ${text}`);
  }
  return res.json() as Promise<VapiVoice[]>;
}

export interface VapiCallRecord {
  id: string;
  assistantId?: string;
  startedAt?: string;
  endedAt?: string;
  cost?: number;
  costs?: unknown[];
  endedReason?: string;
  status?: string;
  customer?: { number?: string };
  phoneNumber?: { number?: string };
  transcript?: string;
  recordingUrl?: string;
  stereoRecordingUrl?: string;
  analysis?: {
    summary?: string;
    successEvaluation?: string;
    structuredData?: unknown;
  };
}

/** Fetches recent calls from Vapi API */
export async function fetchVapiCalls(
  apiKey?: string | null,
  limit = 100
): Promise<VapiCallRecord[]> {
  const res = await fetch(`${VAPI_BASE}/call?limit=${limit}`, {
    headers: getHeaders(apiKey),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Vapi fetch calls failed (${res.status}): ${text}`);
  }
  const raw = await res.json();
  // Vapi may return plain array or paginated { results: [...] }
  return (Array.isArray(raw) ? raw : (raw.results ?? raw.data ?? [])) as VapiCallRecord[];
}

/** Fetches all assistants from a Vapi account (used in Settings to preview connection) */
export async function listVapiAssistants(
  apiKey: string
): Promise<{ id: string; name: string }[]> {
  const res = await fetch(`${VAPI_BASE}/assistant?limit=100`, {
    headers: getHeaders(apiKey),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Vapi list failed (${res.status}): ${text}`);
  }
  return res.json() as Promise<{ id: string; name: string }[]>;
}
