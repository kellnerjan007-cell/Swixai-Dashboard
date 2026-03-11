import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { COIN_REWARDS, AD_LIMIT_PER_DAY, isNewDay } from "@/lib/coins";

export async function POST() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = await db.user.findUnique({ where: { id: session.user.id } });
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  // Reset daily counter if it's a new day
  let adsToday = user.adsWatchedToday;
  if (isNewDay(user.lastAdWatchDate)) {
    adsToday = 0;
  }

  if (adsToday >= AD_LIMIT_PER_DAY) {
    return NextResponse.json(
      { error: `Limit erreicht. Maximal ${AD_LIMIT_PER_DAY} Videos pro Tag.` },
      { status: 429 }
    );
  }

  const updated = await db.user.update({
    where: { id: user.id },
    data: {
      coins: { increment: COIN_REWARDS.AD_WATCH },
      adsWatchedToday: adsToday + 1,
      lastAdWatchDate: new Date(),
      coinTransactions: {
        create: {
          amount: COIN_REWARDS.AD_WATCH,
          type: "AD_REWARD",
          description: `Video angeschaut (+${COIN_REWARDS.AD_WATCH} Coins)`,
        },
      },
    },
  });

  return NextResponse.json({
    coins: updated.coins,
    earned: COIN_REWARDS.AD_WATCH,
    adsRemaining: AD_LIMIT_PER_DAY - (adsToday + 1),
  });
}
