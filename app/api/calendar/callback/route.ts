import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.redirect(new URL("/login", req.url));

  const { searchParams } = new URL(req.url);
  const code = searchParams.get("code");
  const error = searchParams.get("error");

  if (error || !code) {
    return NextResponse.redirect(new URL("/app/calendar?error=access_denied", req.url));
  }

  const clientId = process.env.GOOGLE_CLIENT_ID!;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET!;
  const baseUrl = process.env.NEXTAUTH_URL ?? "http://localhost:3000";
  const redirectUri = `${baseUrl}/api/calendar/callback`;

  // Exchange code for tokens
  const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
      grant_type: "authorization_code",
    }),
  });

  if (!tokenRes.ok) {
    console.error("[Calendar] Token exchange failed:", await tokenRes.text());
    return NextResponse.redirect(new URL("/app/calendar?error=token_exchange", req.url));
  }

  const tokens = await tokenRes.json() as {
    access_token: string;
    refresh_token?: string;
    expires_in: number;
  };

  // Fetch the primary calendar ID
  let calendarId: string | null = null;
  try {
    const calRes = await fetch("https://www.googleapis.com/calendar/v3/calendars/primary", {
      headers: { Authorization: `Bearer ${tokens.access_token}` },
    });
    if (calRes.ok) {
      const cal = await calRes.json() as { id: string };
      calendarId = cal.id;
    }
  } catch { /* non-critical */ }

  // Get workspace
  const membership = await db.membership.findFirst({
    where: { userId: session.user.id },
    select: { workspaceId: true },
    orderBy: { createdAt: "asc" },
  });
  if (!membership) {
    return NextResponse.redirect(new URL("/app/calendar?error=no_workspace", req.url));
  }

  await db.calendarConnection.upsert({
    where: { workspaceId_provider: { workspaceId: membership.workspaceId, provider: "GOOGLE" } },
    update: { accessToken: tokens.access_token, refreshToken: tokens.refresh_token ?? null, calendarId, connectedAt: new Date() },
    create: { workspaceId: membership.workspaceId, provider: "GOOGLE", accessToken: tokens.access_token, refreshToken: tokens.refresh_token ?? null, calendarId },
  });

  return NextResponse.redirect(new URL("/app/calendar?success=google", req.url));
}
