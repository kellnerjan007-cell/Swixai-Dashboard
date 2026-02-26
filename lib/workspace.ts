/**
 * Helper to get the user's active workspace from a session.
 * Used in API route handlers.
 */
import { db } from "@/lib/db";
import { slugify } from "@/lib/utils";

export async function getUserWorkspace(userId: string) {
  const membership = await db.membership.findFirst({
    where: { userId },
    include: { workspace: true },
    orderBy: { createdAt: "asc" },
  });
  return membership?.workspace ?? null;
}

/**
 * Like getUserWorkspace but auto-creates a workspace if the user has none.
 * Use in write operations so manually created users still work.
 */
export async function getOrCreateWorkspace(userId: string) {
  const existing = await getUserWorkspace(userId);
  if (existing) return existing;

  const user = await db.user.findUnique({
    where: { id: userId },
    select: { name: true, email: true },
  });
  if (!user) return null;

  const baseName = user.name ?? user.email.split("@")[0];
  let slug = slugify(baseName);
  const slugExists = await db.workspace.findUnique({ where: { slug } });
  if (slugExists) slug = `${slug}-${Date.now()}`;

  const workspace = await db.$transaction(async (tx) => {
    const ws = await tx.workspace.create({ data: { name: baseName, slug } });
    await tx.membership.create({ data: { userId, workspaceId: ws.id, role: "OWNER" } });
    await tx.billing.create({ data: { workspaceId: ws.id, creditsBalance: 10.0 } });
    return ws;
  });

  return workspace;
}

export async function assertWorkspaceMember(
  userId: string,
  workspaceId: string
): Promise<boolean> {
  const membership = await db.membership.findUnique({
    where: { userId_workspaceId: { userId, workspaceId } },
  });
  return !!membership;
}
