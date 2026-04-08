import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { generateSixDigitOtp, sha256Hex } from "@/lib/otp";
import { sendOtpEmail } from "@/lib/smtp";

const sendOtpSchema = z.object({
  email: z.string().email("Enter a valid email"),
});

export async function POST(req: NextRequest) {
  try {
    if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is not configured");

    const { email } = sendOtpSchema.parse(await req.json());
    const purpose = "RESET_PASSWORD" as const;

    // Avoid user enumeration but also reduce unnecessary OTP spam.
    const user = await prisma.user.findUnique({ where: { email } }).catch(() => null);
    if (!user) {
      return NextResponse.json({ success: true }, { status: 200 });
    }

    const now = Date.now();
    const windowMs = 60_000; // 1 minute
    const maxPerWindow = 3;
    const sentRecently = await prisma.emailOtpToken.count({
      where: {
        email,
        purpose,
        createdAt: { gte: new Date(now - windowMs) },
      },
    });
    if (sentRecently >= maxPerWindow) {
      return NextResponse.json({ success: true }, { status: 200 });
    }

    const otp = generateSixDigitOtp();
    const expectedHash = sha256Hex(`${purpose}:${email}:${otp}`);

    await prisma.emailOtpToken.deleteMany({
      where: {
        email,
        purpose,
        usedAt: null,
        expiresAt: { gt: new Date(Date.now() - windowMs) },
      },
    });

    await prisma.emailOtpToken.create({
      data: {
        email,
        purpose,
        codeHash: expectedHash,
        attemptsLeft: 5,
        expiresAt: new Date(Date.now() + 10 * 60_000),
      },
    });

    await sendOtpEmail({ to: email, code: otp, purpose });
    return NextResponse.json({ success: true }, { status: 200 });
  } catch {
    return NextResponse.json({ error: "OTP send failed" }, { status: 500 });
  }
}

