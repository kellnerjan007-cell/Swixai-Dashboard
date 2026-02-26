import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email("Ungültige E-Mail-Adresse"),
  password: z.string().min(1, "Passwort erforderlich"),
});

export const signupSchema = z.object({
  name: z.string().min(2, "Name muss mindestens 2 Zeichen haben"),
  email: z.string().email("Ungültige E-Mail-Adresse"),
  password: z.string().min(8, "Passwort muss mindestens 8 Zeichen haben"),
  companyName: z.string().min(2, "Firmenname muss mindestens 2 Zeichen haben"),
});

export const assistantSchema = z.object({
  name: z.string().min(2, "Name muss mindestens 2 Zeichen haben"),
  systemPrompt: z.string().optional(),
  voice: z.string().default("alloy"),
  language: z.string().default("de"),
  phoneNumber: z.string().optional(),
  fallbackRule: z.enum(["voicemail", "transfer", "hangup"]).default("voicemail"),
  status: z.enum(["ACTIVE", "PAUSED", "DRAFT"]).default("ACTIVE"),
  vapiAssistantId: z.string().optional(),
  toolsConfig: z.any().optional(),
});

export const knowledgeSourceSchema = z.object({
  title: z.string().min(2, "Titel erforderlich"),
  type: z.enum(["FAQ", "FILE", "TEXT"]),
  contentText: z.string().optional(),
  assistantId: z.string().optional(),
});

export const creditAdjustSchema = z.object({
  amount: z.number().min(-10000).max(10000),
  reason: z.string().min(3),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type SignupInput = z.infer<typeof signupSchema>;
export type AssistantInput = z.infer<typeof assistantSchema>;
export type KnowledgeSourceInput = z.infer<typeof knowledgeSourceSchema>;
