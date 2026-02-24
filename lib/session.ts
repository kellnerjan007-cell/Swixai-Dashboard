import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

export async function getSession() {
  return getServerSession(authOptions);
}

/** Returns the current user's workspace (first membership). */
export async function getCurrentWorkspace(userId: string) {
  const membership = await db.membership.findFirst({
    where: { userId },
    include: { workspace: true },
    orderBy: { createdAt: "asc" },
  });
  return membership?.workspace ?? null;
}

/** Guard: throws if not authenticated. */
export async function requireAuth() {
  const session = await getSession();
  if (!session?.user?.id) {
    throw new Error("UNAUTHENTICATED");
  }
  return session;
}

/** Guard: throws if not admin. */
export async function requireAdmin() {
  const session = await requireAuth();
  if (session.user.role !== "ADMIN") {
    throw new Error("FORBIDDEN");
  }
  return session;
}
