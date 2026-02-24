/**
 * Helper to get the user's active workspace from a session.
 * Used in API route handlers.
 */
import { db } from "@/lib/db";

export async function getUserWorkspace(userId: string) {
  const membership = await db.membership.findFirst({
    where: { userId },
    include: { workspace: true },
    orderBy: { createdAt: "asc" },
  });
  return membership?.workspace ?? null;
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
