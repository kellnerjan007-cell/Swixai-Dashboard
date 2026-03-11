import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { z } from "zod";

const schema = z.object({
  matchId: z.string(),
  predictedWinner: z.enum(["home", "away"]),
});

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Ungültige Eingaben." }, { status: 400 });
  }

  const { matchId, predictedWinner } = parsed.data;

  const match = await db.match.findUnique({ where: { id: matchId } });
  if (!match || match.status !== "UPCOMING") {
    return NextResponse.json({ error: "Match nicht verfügbar." }, { status: 400 });
  }

  const user = await db.user.findUnique({ where: { id: session.user.id } });
  if (!user) return NextResponse.json({ error: "Benutzer nicht gefunden." }, { status: 404 });

  if (user.coins < match.coinCost) {
    return NextResponse.json({ error: "Nicht genug Coins." }, { status: 402 });
  }

  const existing = await db.prediction.findUnique({
    where: { userId_matchId: { userId: user.id, matchId } },
  });
  if (existing) {
    return NextResponse.json({ error: "Bereits getippt." }, { status: 409 });
  }

  const [prediction] = await db.$transaction([
    db.prediction.create({
      data: {
        userId: user.id,
        matchId,
        predictedWinner,
        coinsSpent: match.coinCost,
      },
    }),
    db.user.update({
      where: { id: user.id },
      data: { coins: { decrement: match.coinCost } },
    }),
    db.coinTransaction.create({
      data: {
        userId: user.id,
        amount: -match.coinCost,
        type: "PREDICTION_SPEND",
        description: `Tipp auf ${match.homePlayer} vs ${match.awayPlayer}`,
      },
    }),
  ]);

  return NextResponse.json(prediction, { status: 201 });
}

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const predictions = await db.prediction.findMany({
    where: { userId: session.user.id },
    include: { match: true },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(predictions);
}
