import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { getUserWorkspace } from "@/lib/workspace";
import { knowledgeSourceSchema } from "@/lib/validations";
import { supabaseAdmin, KNOWLEDGE_BUCKET } from "@/lib/supabase";

// ─── GET ──────────────────────────────────────────────────────────────────────

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const workspace = await getUserWorkspace(session.user.id);
  if (!workspace) return NextResponse.json([], { status: 200 });

  const sources = await db.knowledgeSource.findMany({
    where: { workspaceId: workspace.id },
    orderBy: { updatedAt: "desc" },
    include: { assistant: { select: { name: true } } },
  });

  return NextResponse.json(sources);
}

// ─── POST ─────────────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const workspace = await getUserWorkspace(session.user.id);
  if (!workspace) return NextResponse.json({ error: "No workspace" }, { status: 400 });

  const contentType = req.headers.get("content-type") ?? "";

  // ── PDF upload via multipart/form-data ──────────────────────────────────────
  if (contentType.includes("multipart/form-data")) {
    return handleFileUpload(req, workspace.id);
  }

  // ── Text entry via JSON ──────────────────────────────────────────────────────
  const body = await req.json();
  const parsed = knowledgeSourceSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message },
      { status: 400 }
    );
  }

  const source = await db.knowledgeSource.create({
    data: { workspaceId: workspace.id, ...parsed.data },
  });

  return NextResponse.json(source, { status: 201 });
}

// ─── File upload helper ────────────────────────────────────────────────────────

async function handleFileUpload(req: NextRequest, workspaceId: string) {
  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return NextResponse.json({ error: "Ungültige Formulardaten" }, { status: 400 });
  }

  const title = ((formData.get("title") as string | null) ?? "").trim();
  const file = formData.get("file") as File | null;

  if (title.length < 2) {
    return NextResponse.json({ error: "Titel erforderlich (min. 2 Zeichen)" }, { status: 400 });
  }
  if (!file) {
    return NextResponse.json({ error: "Keine Datei hochgeladen" }, { status: 400 });
  }
  if (!file.name.toLowerCase().endsWith(".pdf")) {
    return NextResponse.json({ error: "Nur PDF-Dateien erlaubt" }, { status: 400 });
  }
  if (file.size > 10 * 1024 * 1024) {
    return NextResponse.json({ error: "Datei zu groß (max. 10 MB)" }, { status: 400 });
  }

  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);

  // ── Extract text from PDF ───────────────────────────────────────────────────
  let extractedText: string | null = null;
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const pdfParse = require("pdf-parse") as (
      buf: Buffer
    ) => Promise<{ text: string }>;
    const result = await pdfParse(buffer);
    extractedText = result.text.trim() || null;
  } catch (err) {
    console.error("[PDF] Text extraction failed:", err);
  }

  // ── Upload to Supabase Storage ──────────────────────────────────────────────
  // Ensure bucket exists (no-op if already created)
  await supabaseAdmin.storage.createBucket(KNOWLEDGE_BUCKET, {
    public: true,
    fileSizeLimit: 10 * 1024 * 1024,
  });

  const safeOriginal = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
  const storagePath = `${workspaceId}/${Date.now()}-${safeOriginal}`;

  const { error: uploadError } = await supabaseAdmin.storage
    .from(KNOWLEDGE_BUCKET)
    .upload(storagePath, buffer, {
      contentType: "application/pdf",
      upsert: false,
    });

  if (uploadError) {
    console.error("[STORAGE] Upload failed:", uploadError.message);
    return NextResponse.json({ error: "Datei konnte nicht hochgeladen werden" }, { status: 500 });
  }

  const { data: urlData } = supabaseAdmin.storage
    .from(KNOWLEDGE_BUCKET)
    .getPublicUrl(storagePath);

  // ── Save to database ────────────────────────────────────────────────────────
  const source = await db.knowledgeSource.create({
    data: {
      workspaceId,
      type: "FILE",
      title,
      contentText: extractedText,
      fileUrl: urlData.publicUrl,
      fileName: file.name,
    },
  });

  return NextResponse.json(source, { status: 201 });
}
