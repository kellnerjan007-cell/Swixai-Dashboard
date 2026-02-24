import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { creditAdjustSchema } from "@/lib/validations";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const parsed = creditAdjustSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message }, { status: 400 });
  }

  const billing = await db.billing.upsert({
    where: { workspaceId: id },
    update: { creditsBalance: { increment: parsed.data.amount } },
    create: {
      workspaceId: id,
      creditsBalance: parsed.data.amount,
      currency: "EUR",
    },
  });

  return NextResponse.json(billing);
}
