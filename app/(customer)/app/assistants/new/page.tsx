"use client";

import { useRouter } from "next/navigation";
import { AssistantEditor, AssistantFormData, DEFAULT_TOOLS_CONFIG } from "@/components/customer/AssistantEditor";

const DEFAULT_FORM: AssistantFormData = {
  name: "",
  systemPrompt: "",
  voice: "alloy",
  language: "de",
  phoneNumber: "",
  fallbackRule: "voicemail",
  status: "ACTIVE",
  vapiAssistantId: "",
  toolsConfig: { ...DEFAULT_TOOLS_CONFIG },
};

export default function NewAssistantPage() {
  const router = useRouter();

  async function handleSave(data: AssistantFormData) {
    const res = await fetch("/api/assistants", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error ?? "Fehler beim Erstellen");
    const params = json.vapiSyncFailed ? "?vapi_error=1" : "";
    router.push(`/app/assistants/${json.id}${params}`);
  }

  return (
    <AssistantEditor
      mode="create"
      initialData={DEFAULT_FORM}
      onSave={handleSave}
    />
  );
}
