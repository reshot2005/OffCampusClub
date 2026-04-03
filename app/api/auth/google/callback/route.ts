import bcrypt from "bcryptjs";
import crypto from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { DEFAULT_AVATAR_URL } from "@/lib/avatar";
import {
  exchangeCodeForTokens,
  fetchGoogleUserInfo,
  GOOGLE_OAUTH_REDIRECT_COOKIE,
  GOOGLE_OAUTH_STATE_COOKIE,
  oauthCallbackUrl,
} from "@/lib/google-oauth";
import { authCookieOptions, signAuthToken } from "@/lib/jwt";
import { prisma } from "@/lib/prisma";
import { STAFF_PUBLIC_PREFIX } from "@/lib/staff-paths";

function generateIndianPhoneNumber(): string {
  const first = [6, 7, 8, 9][Math.floor(Math.random() * 4)];
  const rest = Array.from({ length: 9 }, () => Math.floor(Math.random() * 10)).join("");
  return `${first}${rest}`;
}

function postLoginDestination(
  user: { role: string; approvalStatus: string },
  redirectCookie: string | undefined,
): string {
  const raw = redirectCookie?.trim() || "/dashboard";
  const safe =
    raw.startsWith("/") && !raw.startsWith("//") ? raw.slice(0, 2000) : "/dashboard";

  if (safe !== "/dashboard") {
    return safe;
  }

  if (user.role === "ADMIN") {
    return STAFF_PUBLIC_PREFIX;
  }
  if (user.role === "CLUB_HEADER" && user.approvalStatus === "APPROVED") {
    return "/header/dashboard";
  }
  if (user.role === "CLUB_HEADER" && user.approvalStatus === "PENDING") {
    return "/pending";
  }
  return "/dashboard";
}

export async function GET(req: NextRequest) {
  const clientId = process.env.GOOGLE_CLIENT_ID?.trim();
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET?.trim();

  const url = req.nextUrl;
  const oauthError = url.searchParams.get("error");
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");

  const failRedirect = (message: string) =>
    NextResponse.redirect(new URL(`/login?error=${encodeURIComponent(message)}`, req.url));

  if (oauthError) {
    return failRedirect("Google sign-in was cancelled or failed");
  }
  if (!code || !state) {
    return failRedirect("Missing OAuth parameters");
  }
  if (!clientId || !clientSecret) {
    return failRedirect("Google OAuth is not configured on the server");
  }

  const cookieState = req.cookies.get(GOOGLE_OAUTH_STATE_COOKIE)?.value;
  const redirectCookie = req.cookies.get(GOOGLE_OAUTH_REDIRECT_COOKIE)?.value;
  if (!cookieState || cookieState !== state) {
    return failRedirect("Invalid session. Please try signing in again.");
  }

  const redirectUri = oauthCallbackUrl(req);

  let access_token: string;
  try {
    ({ access_token } = await exchangeCodeForTokens({
      code,
      clientId,
      clientSecret,
      redirectUri,
    }));
  } catch (e) {
    console.error("[auth/google/callback] token exchange", e);
    return failRedirect("Could not complete Google sign-in");
  }

  let googleUser: Awaited<ReturnType<typeof fetchGoogleUserInfo>>;
  try {
    googleUser = await fetchGoogleUserInfo(access_token);
  } catch (e) {
    console.error("[auth/google/callback] userinfo", e);
    return failRedirect("Could not read Google profile");
  }

  if (!googleUser.email) {
    return failRedirect("Google did not return an email address");
  }

  const email = googleUser.email.toLowerCase().trim();
  const fullNameFromGoogle =
    googleUser.name?.trim() || email.split("@")[0] || "OCC Member";

  let user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user) {
    let phoneNumber = "";
    for (let i = 0; i < 10; i++) {
      const candidate = generateIndianPhoneNumber();
      const exists = await prisma.user.findUnique({ where: { phoneNumber: candidate } });
      if (!exists) {
        phoneNumber = candidate;
        break;
      }
    }
    if (!phoneNumber) {
      phoneNumber = generateIndianPhoneNumber();
    }

    const randomPassword = crypto.randomBytes(48).toString("hex");
    const hashedPassword = await bcrypt.hash(randomPassword, 12);

    try {
      user = await prisma.user.create({
        data: {
          fullName: fullNameFromGoogle,
          collegeName: "Not specified",
          phoneNumber,
          email,
          password: hashedPassword,
          avatar: googleUser.picture ?? null,
          emailVerified: new Date(),
          role: "STUDENT",
        },
      });
    } catch (e) {
      console.error("[auth/google/callback] create user", e);
      return failRedirect("Could not create account");
    }
  } else {
    if (user.suspended) {
      return failRedirect("Account suspended");
    }

    const updates: {
      avatar?: string | null;
      emailVerified?: Date;
    } = {};

    const pic = googleUser.picture?.trim();
    if (pic && (!user.avatar || user.avatar === DEFAULT_AVATAR_URL)) {
      updates.avatar = pic;
    }
    if (!user.emailVerified) {
      updates.emailVerified = new Date();
    }

    if (Object.keys(updates).length > 0) {
      user = await prisma.user.update({
        where: { id: user.id },
        data: updates,
      });
    }
  }

  const token = await signAuthToken({
    userId: user.id,
    email: user.email,
    role: user.role as "ADMIN" | "CLUB_HEADER" | "STUDENT",
    approvalStatus: user.approvalStatus as "PENDING" | "APPROVED" | "REJECTED",
    suspended: user.suspended,
  });

  const destination = postLoginDestination(
    { role: user.role, approvalStatus: user.approvalStatus },
    redirectCookie,
  );

  const res = NextResponse.redirect(new URL(destination, req.url));
  res.cookies.set("occ-token", token, authCookieOptions);
  res.cookies.delete(GOOGLE_OAUTH_STATE_COOKIE);
  res.cookies.delete(GOOGLE_OAUTH_REDIRECT_COOKIE);
  return res;
}
