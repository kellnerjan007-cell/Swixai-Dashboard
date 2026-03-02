import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
  const email = req.nextUrl.searchParams.get("email");
  if (!email) return NextResponse.json({ exists: false });

  const user = await db.user.findUnique({ where: { email: email.toLowerCase() } });
  return NextResponse.json({ exists: !!user });
}
