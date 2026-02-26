import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.redirect(new URL("/login", req.url));

  const membership = await db.membership.findFirst({
    where: { userId: session.user.id },
    select: { workspaceId: true },
    orderBy: { createdAt: "asc" },
  });

  if (membership) {
    await db.calendarConnection.deleteMany({
      where: { workspaceId: membership.workspaceId },
    });
  }

  return NextResponse.redirect(new URL("/app/calendar", req.url), 303);
}
