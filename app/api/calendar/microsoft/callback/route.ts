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
    return NextResponse.redirect(new URL("/app/calendar?error=ms_access_denied", req.url));
  }

  const clientId = process.env.MICROSOFT_CLIENT_ID!;
  const clientSecret = process.env.MICROSOFT_CLIENT_SECRET!;
  const baseUrl = process.env.NEXTAUTH_URL ?? "http://localhost:3000";
  const redirectUri = `${baseUrl}/api/calendar/microsoft/callback`;

  const tokenRes = await fetch(
    "https://login.microsoftonline.com/common/oauth2/v2.0/token",
    {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: "authorization_code",
        scope: [
          "https://graph.microsoft.com/Calendars.ReadWrite",
          "offline_access",
        ].join(" "),
      }),
    }
  );

  if (!tokenRes.ok) {
    console.error("[MS Calendar] Token exchange failed:", await tokenRes.text());
    return NextResponse.redirect(new URL("/app/calendar?error=ms_token_exchange", req.url));
  }

  const tokens = await tokenRes.json() as {
    access_token: string;
    refresh_token?: string;
    expires_in: number;
  };

  const tokenExpiresAt = new Date(Date.now() + tokens.expires_in * 1000);

  let calendarId: string | null = null;
  try {
    const calRes = await fetch("https://graph.microsoft.com/v1.0/me/calendar", {
      headers: { Authorization: `Bearer ${tokens.access_token}` },
    });
    if (calRes.ok) {
      const cal = await calRes.json() as { id: string };
      calendarId = cal.id;
    }
  } catch { /* non-critical */ }

  const membership = await db.membership.findFirst({
    where: { userId: session.user.id },
    select: { workspaceId: true },
    orderBy: { createdAt: "asc" },
  });
  if (!membership) {
    return NextResponse.redirect(new URL("/app/calendar?error=no_workspace", req.url));
  }

  await db.calendarConnection.upsert({
    where: { workspaceId_provider: { workspaceId: membership.workspaceId, provider: "MICROSOFT" } },
    update: { accessToken: tokens.access_token, refreshToken: tokens.refresh_token ?? null, calendarId, tokenExpiresAt, connectedAt: new Date() },
    create: { workspaceId: membership.workspaceId, provider: "MICROSOFT", accessToken: tokens.access_token, refreshToken: tokens.refresh_token ?? null, calendarId, tokenExpiresAt },
  });

  return NextResponse.redirect(new URL("/app/calendar?success=microsoft", req.url));
}
