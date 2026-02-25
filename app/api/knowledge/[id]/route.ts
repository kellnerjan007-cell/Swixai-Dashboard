import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { getUserWorkspace } from "@/lib/workspace";
import { supabaseAdmin, KNOWLEDGE_BUCKET } from "@/lib/supabase";

// ─── Auth helper ──────────────────────────────────────────────────────────────

async function getSourceWithAuth(id: string, userId: string) {
  const workspace = await getUserWorkspace(userId);
  if (!workspace) return { ok: false as const, status: 400, error: "No workspace" };

  const source = await db.knowledgeSource.findFirst({
    where: { id, workspaceId: workspace.id },
  });
  if (!source) return { ok: false as const, status: 404, error: "Not found" };

  return { ok: true as const, source };
}

// ─── GET /api/knowledge/[id] ──────────────────────────────────────────────────

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const result = await getSourceWithAuth(id, session.user.id);
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: result.status });

  return NextResponse.json(result.source);
}

// ─── DELETE /api/knowledge/[id] ───────────────────────────────────────────────

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const result = await getSourceWithAuth(id, session.user.id);
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: result.status });

  // Delete file from Supabase Storage if it exists
  if (result.source.fileUrl && result.source.type === "FILE") {
    try {
      // Extract storage path from the public URL
      // Format: https://{project}.supabase.co/storage/v1/object/public/{bucket}/{path}
      const url = new URL(result.source.fileUrl);
      const prefix = `/storage/v1/object/public/${KNOWLEDGE_BUCKET}/`;
      const storagePath = url.pathname.startsWith(prefix)
        ? url.pathname.slice(prefix.length)
        : null;

      if (storagePath) {
        const { error } = await supabaseAdmin.storage
          .from(KNOWLEDGE_BUCKET)
          .remove([storagePath]);
        if (error) console.error("[STORAGE] Delete failed:", error.message);
      }
    } catch (err) {
      console.error("[STORAGE] Could not delete file:", err);
      // Continue with DB deletion regardless
    }
  }

  await db.knowledgeSource.delete({ where: { id } });

  return NextResponse.json({ ok: true });
}
