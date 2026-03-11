import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const matches = await db.match.findMany({
    where: { status: { in: ["UPCOMING", "LIVE"] } },
    orderBy: { scheduledAt: "asc" },
    include: {
      predictions: {
        where: { userId: session.user.id },
        select: { predictedWinner: true, status: true, coinsSpent: true },
      },
    },
  });

  return NextResponse.json(matches);
}
