import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { COIN_REWARDS } from "@/lib/coins";
import { z } from "zod";

const schema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(6),
});

export async function POST(req: NextRequest) {
  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Ungültige Eingaben." }, { status: 400 });
  }

  const { name, email, password } = parsed.data;

  const existing = await db.user.findUnique({ where: { email } });
  if (existing) {
    return NextResponse.json({ error: "E-Mail bereits registriert." }, { status: 409 });
  }

  const hashed = await bcrypt.hash(password, 12);

  const user = await db.user.create({
    data: {
      name,
      email,
      password: hashed,
      coins: COIN_REWARDS.SIGNUP_BONUS,
      coinTransactions: {
        create: {
          amount: COIN_REWARDS.SIGNUP_BONUS,
          type: "SIGNUP_BONUS",
          description: "Willkommens-Bonus",
        },
      },
    },
  });

  return NextResponse.json({ id: user.id }, { status: 201 });
}
