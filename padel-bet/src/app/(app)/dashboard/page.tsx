import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { DashboardClient } from "./DashboardClient";

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  const user = await db.user.findUnique({
    where: { id: session!.user.id },
    select: {
      name: true,
      coins: true,
      loginStreak: true,
      lastLoginDate: true,
      adsWatchedToday: true,
      lastAdWatchDate: true,
      _count: { select: { predictions: true } },
    },
  });

  const recentMatches = await db.match.findMany({
    where: { status: { in: ["UPCOMING", "LIVE"] } },
    orderBy: { scheduledAt: "asc" },
    take: 3,
  });

  return <DashboardClient user={user!} recentMatches={recentMatches} />;
}
