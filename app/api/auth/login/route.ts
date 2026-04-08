import bcrypt from "bcryptjs";
import { NextRequest, NextResponse } from "next/server";
import { ZodError } from "zod";
import { authCookieOptions, signAuthToken } from "@/lib/jwt";
import { prisma } from "@/lib/prisma";
import { loginSchema } from "@/lib/validations";
import { generateSixDigitOtp, sha256Hex } from "@/lib/otp";
import { sendOtpEmail } from "@/lib/smtp";

const loginRateMap =
  (globalThis as unknown as { __occLoginRateMap?: Map<string, { count: number; resetAt: number }> })
    .__occLoginRateMap ??
  (((globalThis as unknown as { __occLoginRateMap?: Map<string, { count: number; resetAt: number }> })
    .__occLoginRateMap = new Map()));

function getRateKey(req: NextRequest, email: string) {
  const forwarded = req.headers.get("x-forwarded-for") || "";
  const ip = forwarded.split(",")[0]?.trim() || "unknown";
  return `${ip}:${email.toLowerCase()}`;
}

export async function POST(req: NextRequest) {
  try {
    if (!process.env.DATABASE_URL) {
      throw new Error("DATABASE_URL is not configured");
    }
    if (!process.env.JWT_SECRET) {
      throw new Error("JWT_SECRET is not configured");
    }

    const body = await req.json();
    const { email, password } = loginSchema.parse(body);
    const otp = typeof (body as any)?.otp === "string" ? String((body as any).otp).trim() : "";
    const otpPurpose = "ADMIN_LOGIN" as const;
    const rateKey = getRateKey(req, email);
    const now = Date.now();
    const rateWindowMs = 15 * 60_000;
    const maxFailures = 12;
    const bucket = loginRateMap.get(rateKey);
    if (bucket && bucket.resetAt > now && bucket.count >= maxFailures) {
      return NextResponse.json({ error: "Too many attempts. Please wait and try again." }, { status: 429 });
    }

    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        memberships: {
          include: {
            club: true,
          },
        },
      },
    });

    if (!user) {
      loginRateMap.set(rateKey, {
        count: bucket && bucket.resetAt > now ? bucket.count + 1 : 1,
        resetAt: now + rateWindowMs,
      });
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      loginRateMap.set(rateKey, {
        count: bucket && bucket.resetAt > now ? bucket.count + 1 : 1,
        resetAt: now + rateWindowMs,
      });
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }
    loginRateMap.delete(rateKey);

    if (user.suspended) {
      return NextResponse.json({ error: "Account suspended" }, { status: 403 });
    }

    // Step-up auth: admins must confirm an OTP after password.
    if (user.role === "ADMIN") {
      const otpEmail = user.email.toLowerCase().trim();
      const nowMs = Date.now();
      const windowMs = 60_000; // allow resend throttling via DB window

      if (!otp) {
        const sentRecently = await prisma.emailOtpToken.count({
          where: {
            email: otpEmail,
            purpose: otpPurpose,
            createdAt: { gte: new Date(nowMs - windowMs) },
          },
        });
        if (sentRecently >= 3) {
          return NextResponse.json({ error: "Too many OTP requests. Please wait and try again." }, { status: 429 });
        }

        const code = generateSixDigitOtp();
        const expectedHash = sha256Hex(`${otpPurpose}:${otpEmail}:${code}`);

        await prisma.emailOtpToken.deleteMany({
          where: {
            email: otpEmail,
            purpose: otpPurpose,
            usedAt: null,
            expiresAt: { gt: new Date(Date.now() - windowMs) },
          },
        });

        await prisma.emailOtpToken.create({
          data: {
            email: otpEmail,
            purpose: otpPurpose,
            codeHash: expectedHash,
            attemptsLeft: 5,
            expiresAt: new Date(Date.now() + 10 * 60_000),
          },
        });

        await sendOtpEmail({ to: otpEmail, code, purpose: "ADMIN_LOGIN" });
        return NextResponse.json({ mfaRequired: true }, { status: 202 });
      }

      const latest = await prisma.emailOtpToken.findFirst({
        where: {
          email: otpEmail,
          purpose: otpPurpose,
          usedAt: null,
          expiresAt: { gt: new Date() },
        },
        orderBy: { createdAt: "desc" },
      });

      if (!latest || latest.attemptsLeft <= 0) {
        return NextResponse.json({ error: "Invalid or expired OTP" }, { status: 400 });
      }

      const expectedHash = sha256Hex(`${otpPurpose}:${otpEmail}:${otp}`);
      if (expectedHash !== latest.codeHash) {
        const nextAttempts = Math.max(0, latest.attemptsLeft - 1);
        await prisma.emailOtpToken.update({
          where: { id: latest.id },
          data: {
            attemptsLeft: nextAttempts,
            usedAt: nextAttempts === 0 ? new Date() : null,
          },
        });
        return NextResponse.json({ error: "Invalid or expired OTP" }, { status: 400 });
      }

      await prisma.emailOtpToken.update({
        where: { id: latest.id },
        data: { usedAt: new Date() },
      });
    }

    const token = await signAuthToken({
      userId: user.id,
      email: user.email,
      role: user.role as "ADMIN" | "CLUB_HEADER" | "STUDENT",
      approvalStatus: user.approvalStatus as "PENDING" | "APPROVED" | "REJECTED",
      suspended: user.suspended,
      onboardingComplete: user.onboardingComplete,
    });

    const response = NextResponse.json({
      success: true,
      role: user.role,
      approvalStatus: user.approvalStatus,
      user: {
        id: user.id,
        fullName: user.fullName,
        email: user.email,
        collegeName: user.collegeName,
        memberships: user.memberships,
      },
    });

    response.cookies.set("occ-token", token, authCookieOptions);

    return response;
  } catch (error: unknown) {
    console.error("[auth/login] error:", error);
    if (error instanceof ZodError) {
      return NextResponse.json({ error: error.issues[0]?.message ?? "Invalid form data" }, { status: 400 });
    }

    return NextResponse.json({ error: "Unable to sign in. Try again later." }, { status: 500 });
  }
}
