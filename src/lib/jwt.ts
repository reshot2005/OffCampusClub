import { SignJWT, jwtVerify } from "jose";

const JWT_EXPIRY = "7d";

export type AuthTokenPayload = {
  userId: string;
  email: string;
  role?: "ADMIN" | "CLUB_HEADER" | "STUDENT";
  approvalStatus?: "PENDING" | "APPROVED" | "REJECTED";
  suspended?: boolean;
  /** false = must complete /onboarding (e.g. first Google sign-in). Omitted on legacy tokens = treat as done. */
  onboardingComplete?: boolean;
};

function getJwtSecret() {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error("JWT_SECRET is not configured");
  }
  return new TextEncoder().encode(secret);
}

export async function signAuthToken(payload: AuthTokenPayload) {
  const payloadToSign = { ...payload } as unknown as { [key: string]: unknown };
  return new SignJWT(payloadToSign)
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime(JWT_EXPIRY)
    .sign(getJwtSecret());
}

export async function verifyAuthToken(token: string) {
  const { payload } = await jwtVerify(token, getJwtSecret());
  return payload as unknown as AuthTokenPayload;
}

export const authCookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
  maxAge: 60 * 60 * 24 * 7,
};
