/**
 * Vapi API Client
 * Docs: https://docs.vapi.ai
 *
 * Set VAPI_API_KEY in your .env to enable Vapi sync.
 * Webhook URL to configure in Vapi: https://yourdomain.com/api/webhooks/vapi
 */

const VAPI_BASE = "https://api.vapi.ai";

function getHeaders() {
  const key = process.env.VAPI_API_KEY;
  if (!key) throw new Error("VAPI_API_KEY is not set in environment");
  return {
    Authorization: `Bearer ${key}`,
    "Content-Type": "application/json",
  };
}

/** Maps our Assistant fields to Vapi's create/update payload */
function buildPayload(data: {
  name: string;
  systemPrompt?: string | null;
  voice?: string | null;
  language?: string | null;
}) {
  return {
    name: data.name,
    model: {
      provider: "openai",
      model: "gpt-4o-mini",
      ...(data.systemPrompt ? { systemPrompt: data.systemPrompt } : {}),
    },
    voice: {
      provider: "openai",
      voiceId: data.voice ?? "alloy",
    },
    transcriber: {
      provider: "deepgram",
      language: data.language ?? "de",
    },
  };
}

export async function createVapiAssistant(data: Parameters<typeof buildPayload>[0]): Promise<string> {
  const res = await fetch(`${VAPI_BASE}/assistant`, {
    method: "POST",
    headers: getHeaders(),
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
  data: Parameters<typeof buildPayload>[0]
): Promise<void> {
  const res = await fetch(`${VAPI_BASE}/assistant/${vapiId}`, {
    method: "PATCH",
    headers: getHeaders(),
    body: JSON.stringify(buildPayload(data)),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Vapi update assistant failed (${res.status}): ${text}`);
  }
}

export async function deleteVapiAssistant(vapiId: string): Promise<void> {
  const res = await fetch(`${VAPI_BASE}/assistant/${vapiId}`, {
    method: "DELETE",
    headers: getHeaders(),
  });
  // 404 means already gone — that's fine
  if (!res.ok && res.status !== 404) {
    const text = await res.text();
    throw new Error(`Vapi delete assistant failed (${res.status}): ${text}`);
  }
}
