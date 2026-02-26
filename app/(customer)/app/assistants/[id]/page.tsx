"use client";

import { useState, useEffect, use } from "react";
import { AssistantEditor, AssistantFormData, DEFAULT_TOOLS_CONFIG } from "@/components/customer/AssistantEditor";

export default function AssistantDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [initialData, setInitialData] = useState<AssistantFormData | null>(null);
  const [assistantName, setAssistantName] = useState("");

  useEffect(() => {
    fetch(`/api/assistants/${id}`)
      .then((r) => r.json())
      .then((data) => {
        setAssistantName(data.name ?? "");
        setInitialData({
          name: data.name ?? "",
          systemPrompt: data.systemPrompt ?? "",
          voice: data.voice ?? "alloy",
          language: data.language ?? "de",
          phoneNumber: data.phoneNumber ?? "",
          fallbackRule: data.fallbackRule ?? "voicemail",
          status: data.status ?? "ACTIVE",
          vapiAssistantId: data.vapiAssistantId ?? "",
          toolsConfig: {
            ...DEFAULT_TOOLS_CONFIG,
            ...(data.toolsConfig ?? {}),
          },
        });
      });
  }, [id]);

  async function handleSave(data: AssistantFormData) {
    const res = await fetch(`/api/assistants/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const json = await res.json();
      throw new Error(json.error ?? "Fehler beim Speichern");
    }
  }

  async function handleDelete() {
    await fetch(`/api/assistants/${id}`, { method: "DELETE" });
  }

  if (!initialData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-black border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <AssistantEditor
      mode="edit"
      initialData={initialData}
      assistantId={id}
      assistantName={assistantName}
      onSave={handleSave}
      onDelete={handleDelete}
    />
  );
}
