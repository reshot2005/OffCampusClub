import { NextRequest, NextResponse } from "next/server";
import {
  buildGoogleAuthUrl,
  generateOAuthState,
  GOOGLE_OAUTH_REDIRECT_COOKIE,
  GOOGLE_OAUTH_STATE_COOKIE,
  oauthCallbackUrl,
} from "@/lib/google-oauth";

function safeRedirectPath(path: string | null): string {
  if (!path || !path.startsWith("/") || path.startsWith("//")) {
    return "/dashboard";
  }
  return path.slice(0, 2000);
}

export async function GET(req: NextRequest) {
  const clientId = process.env.GOOGLE_CLIENT_ID?.trim();
  if (!clientId) {
    return NextResponse.json({ error: "Google OAuth is not configured" }, { status: 503 });
  }

  const redirectAfter = safeRedirectPath(req.nextUrl.searchParams.get("redirect"));
  const state = generateOAuthState();
  const redirectUri = oauthCallbackUrl(req);
  const url = buildGoogleAuthUrl({ clientId, redirectUri, state });

  const res = NextResponse.redirect(url);
  const cookieBase = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge: 600,
  };
  res.cookies.set(GOOGLE_OAUTH_STATE_COOKIE, state, cookieBase);
  res.cookies.set(GOOGLE_OAUTH_REDIRECT_COOKIE, redirectAfter, cookieBase);
  return res;
}
