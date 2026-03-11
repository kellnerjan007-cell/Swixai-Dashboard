import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { getDailyLoginReward, isNewDay } from "@/lib/coins";

export async function POST() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = await db.user.findUnique({ where: { id: session.user.id } });
  if (!user) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (!isNewDay(user.lastLoginDate)) {
    return NextResponse.json({ error: "Bereits heute eingeloggt.", alreadyClaimed: true }, { status: 200 });
  }

  // Increment streak or reset if missed a day
  let newStreak = user.loginStreak + 1;
  if (user.lastLoginDate) {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const last = new Date(user.lastLoginDate);
    const sameDay =
      last.getFullYear() === yesterday.getFullYear() &&
      last.getMonth() === yesterday.getMonth() &&
      last.getDate() === yesterday.getDate();
    if (!sameDay) newStreak = 1; // streak broken
  }

  const reward = getDailyLoginReward(newStreak);

  const updated = await db.user.update({
    where: { id: user.id },
    data: {
      coins: { increment: reward },
      loginStreak: newStreak,
      lastLoginDate: new Date(),
      coinTransactions: {
        create: {
          amount: reward,
          type: "DAILY_LOGIN",
          description: `Tages-Login Bonus (Tag ${newStreak})`,
        },
      },
    },
  });

  return NextResponse.json({
    coins: updated.coins,
    earned: reward,
    streak: newStreak,
  });
}
