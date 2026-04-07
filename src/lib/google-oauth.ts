import crypto from "crypto";
import { NextRequest } from "next/server";

const GOOGLE_AUTH = "https://accounts.google.com/o/oauth2/v2/auth";
const GOOGLE_TOKEN = "https://oauth2.googleapis.com/token";
const GOOGLE_USERINFO = "https://www.googleapis.com/oauth2/v2/userinfo";

export const GOOGLE_OAUTH_STATE_COOKIE = "occ-google-oauth-state";
export const GOOGLE_OAUTH_REDIRECT_COOKIE = "occ-google-oauth-redirect";
/** Uppercase referral code for Google sign-up from /register (short-lived). */
export const GOOGLE_OAUTH_REFERRAL_COOKIE = "occ-google-oauth-referral";
/** `"register"` when OAuth started from the register page (for error redirect). */
export const GOOGLE_OAUTH_FROM_COOKIE = "occ-google-oauth-from";

/** Public callback URL — must match an Authorized redirect URI in Google Cloud Console. */
export function oauthCallbackUrl(req: NextRequest): string {
  const explicit = process.env.GOOGLE_REDIRECT_URI?.trim();
  if (explicit) {
    return explicit.replace(/\/$/, "");
  }
  const host = req.headers.get("x-forwarded-host") ?? req.headers.get("host");
  const protoHeader = req.headers.get("x-forwarded-proto");
  const proto =
    protoHeader ?? (host?.startsWith("localhost") || host?.startsWith("127.") ? "http" : "https");
  if (!host) {
    return "http://localhost:3000/api/auth/google/callback";
  }
  return `${proto}://${host}/api/auth/google/callback`;
}

export function generateOAuthState(): string {
  return crypto.randomBytes(32).toString("hex");
}

export function buildGoogleAuthUrl(params: {
  clientId: string;
  redirectUri: string;
  state: string;
}): string {
  const u = new URL(GOOGLE_AUTH);
  u.searchParams.set("client_id", params.clientId);
  u.searchParams.set("redirect_uri", params.redirectUri);
  u.searchParams.set("response_type", "code");
  u.searchParams.set("scope", ["openid", "email", "profile"].join(" "));
  u.searchParams.set("state", params.state);
  u.searchParams.set("access_type", "online");
  u.searchParams.set("prompt", "select_account");
  return u.toString();
}

export async function exchangeCodeForTokens(params: {
  code: string;
  clientId: string;
  clientSecret: string;
  redirectUri: string;
}): Promise<{ access_token: string }> {
  const body = new URLSearchParams({
    code: params.code,
    client_id: params.clientId,
    client_secret: params.clientSecret,
    redirect_uri: params.redirectUri,
    grant_type: "authorization_code",
  });
  const res = await fetch(GOOGLE_TOKEN, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Google token exchange failed: ${res.status} ${text}`);
  }
  const data = (await res.json()) as { access_token?: string };
  if (!data.access_token) {
    throw new Error("No access_token in Google token response");
  }
  return { access_token: data.access_token };
}

export type GoogleUserInfo = {
  id: string;
  email?: string;
  verified_email?: boolean;
  name?: string;
  picture?: string;
};

export async function fetchGoogleUserInfo(accessToken: string): Promise<GoogleUserInfo> {
  const res = await fetch(GOOGLE_USERINFO, {
    headers: { Authorization: `Bearer ${accessToken}` },
    cache: "no-store",
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Google userinfo failed: ${res.status} ${text}`);
  }
  return (await res.json()) as GoogleUserInfo;
}
