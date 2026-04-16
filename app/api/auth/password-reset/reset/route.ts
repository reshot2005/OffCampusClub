import bcrypt from "bcryptjs";
import { NextRequest, NextResponse } from "next/server";
import { ZodError } from "zod";
import { prisma } from "@/lib/prisma";
import { resetPasswordSchema } from "@/lib/validations";
import { authCookieOptions, signAuthToken } from "@/lib/jwt";
import { sha256Hex } from "@/lib/otp";
import { ACTIVITY_CATEGORIES, extractRequestIp, logActivityEvent } from "@/lib/activity-events";

export async function POST(req: NextRequest) {
  try {
    if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is not configured");
    if (!process.env.JWT_SECRET) throw new Error("JWT_SECRET is not configured");

    const body = await req.json();
    const validated = resetPasswordSchema.parse(body);

    const otpEmail = validated.email;
    const otpPurpose = "RESET_PASSWORD" as const;

    const latestOtpToken = await prisma.emailOtpToken.findFirst({
      where: {
        email: otpEmail,
        purpose: otpPurpose,
        usedAt: null,
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: "desc" },
    });

    if (!latestOtpToken || latestOtpToken.attemptsLeft <= 0) {
      return NextResponse.json({ error: "Invalid or expired OTP" }, { status: 400 });
    }

    const expectedHash = sha256Hex(`${otpPurpose}:${otpEmail}:${validated.otp}`);
    if (expectedHash !== latestOtpToken.codeHash) {
      const nextAttempts = Math.max(0, latestOtpToken.attemptsLeft - 1);
      await prisma.emailOtpToken.update({
        where: { id: latestOtpToken.id },
        data: {
          attemptsLeft: nextAttempts,
          usedAt: nextAttempts === 0 ? new Date() : null,
        },
      });
      return NextResponse.json({ error: "Invalid or expired OTP" }, { status: 400 });
    }

    await prisma.emailOtpToken.update({
      where: { id: latestOtpToken.id },
      data: { usedAt: new Date() },
    });

    // Reset password for the user.
    const user = await prisma.user.findUnique({ where: { email: otpEmail } });
    if (!user) {
      // Generic response to avoid enumeration.
      return NextResponse.json({ error: "Password reset failed" }, { status: 400 });
    }

    const hashedPassword = await bcrypt.hash(validated.newPassword, 12);
    await prisma.user.update({
      where: { id: user.id },
      data: { password: hashedPassword },
    });
    await logActivityEvent({
      actor: { userId: user.id, name: user.fullName, role: user.role },
      category: ACTIVITY_CATEGORIES.auth,
      eventType: "password_reset_completed",
      summary: `${user.fullName} reset password`,
      entityType: "user",
      entityId: user.id,
      ipAddress: extractRequestIp(req),
      broadcast: true,
    });

    // Auto-login after successful reset.
    const token = await signAuthToken({
      userId: user.id,
      email: user.email,
      role: user.role as "ADMIN" | "CLUB_HEADER" | "STUDENT",
      approvalStatus: user.approvalStatus as "PENDING" | "APPROVED" | "REJECTED",
      suspended: user.suspended,
      onboardingComplete: user.onboardingComplete,
      hasPhone: !!(user.phoneNumber && user.phoneNumber.replace(/\D/g, "").length === 10),
    });
    const response = NextResponse.json({ success: true }, { status: 200 });
    response.cookies.set("occ-token", token, authCookieOptions);
    return response;
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json({ error: error.issues[0]?.message ?? "Invalid form data" }, { status: 400 });
    }
    console.error("[auth/password-reset] error:", error);
    return NextResponse.json({ error: "Password reset failed" }, { status: 500 });
  }
}

