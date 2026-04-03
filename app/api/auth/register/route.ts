import bcrypt from "bcryptjs";
import { Prisma } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { ZodError } from "zod";
import { prisma } from "@/lib/prisma";
import { registerSchema } from "@/lib/validations";
import { authCookieOptions, signAuthToken } from "@/lib/jwt";
import { sha256Hex } from "@/lib/otp";
import { pusherServer } from "@/lib/pusher";

function generateIndianPhoneNumber(): string {
  const first = [6, 7, 8, 9][Math.floor(Math.random() * 4)];
  const rest = Array.from({ length: 9 }, () => Math.floor(Math.random() * 10)).join("");
  return `${first}${rest}`;
}

export async function POST(req: NextRequest) {
  try {
    if (!process.env.DATABASE_URL) {
      return NextResponse.json({ error: "Server is not configured" }, { status: 503 });
    }
    if (!process.env.JWT_SECRET) {
      return NextResponse.json({ error: "Server is not configured" }, { status: 503 });
    }

    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const validated = registerSchema.parse(body);
    const referralCode =
      typeof body === "object" &&
      body !== null &&
      "referralCode" in body &&
      typeof (body as { referralCode?: unknown }).referralCode === "string"
        ? (body as { referralCode: string }).referralCode.trim()
        : "";

    const otpEmail = validated.email;
    const otpPurpose = "REGISTER" as const;

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

    const collegeName = validated.collegeName ?? "Unknown College";

    let phoneNumber = validated.phoneNumber;
    if (!phoneNumber) {
      for (let i = 0; i < 5; i++) {
        const candidate = generateIndianPhoneNumber();
        const exists = await prisma.user
          .findUnique({ where: { phoneNumber: candidate } })
          .catch(() => null);
        if (!exists) {
          phoneNumber = candidate;
          break;
        }
      }
    }
    if (!phoneNumber) phoneNumber = generateIndianPhoneNumber();

    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [{ email: validated.email }, { phoneNumber }],
      },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "An account with this email or phone already exists. Try logging in." },
        { status: 409 },
      );
    }

    const hashedPassword = await bcrypt.hash(validated.password, 12);

    let referrerUser: { id: string; clubManaged: { id: string } | null } | null = null;
    if (referralCode) {
      referrerUser = await prisma.user.findUnique({
        where: { referralCode },
        select: { id: true, clubManaged: { select: { id: true } } },
      });
    }

    const user = await prisma.user.create({
      data: {
        fullName: validated.fullName,
        collegeName,
        phoneNumber,
        email: validated.email,
        password: hashedPassword,
        role: "STUDENT",
        referredBy: referrerUser?.id,
      },
      select: {
        id: true,
        fullName: true,
        email: true,
        collegeName: true,
      },
    });

    await prisma.emailOtpToken.update({
      where: { id: latestOtpToken.id },
      data: { usedAt: new Date() },
    });

    if (referrerUser?.clubManaged?.id) {
      try {
        await prisma.clubMembership.upsert({
          where: { userId_clubId: { userId: user.id, clubId: referrerUser.clubManaged.id } },
          update: {},
          create: { userId: user.id, clubId: referrerUser.clubManaged.id },
        });

        await prisma.referralStat.create({
          data: {
            clubHeaderId: referrerUser.id,
            studentId: user.id,
            clubId: referrerUser.clubManaged.id,
          },
        });

        await prisma.notification.create({
          data: {
            userId: referrerUser.id,
            type: "new-referral",
            title: "New student joined",
            message: `${user.fullName} joined using your referral code.`,
            data: { studentId: user.id },
          },
        });

        await pusherServer.trigger(`header-${referrerUser.id}`, "new-member", {
          member: {
            id: user.id,
            fullName: user.fullName,
            collegeName: user.collegeName,
            registeredAt: new Date().toISOString(),
          },
        });
      } catch (referralErr) {
        console.warn("[auth/register] referral/Pusher side-effects failed (non-critical):", referralErr);
      }
    }

    const token = await signAuthToken({
      userId: user.id,
      email: user.email,
      role: "STUDENT",
      approvalStatus: "APPROVED",
      suspended: false,
    });
    const response = NextResponse.json({ success: true, user }, { status: 201 });
    response.cookies.set("occ-token", token, authCookieOptions);
  } catch (error) {
    console.error("[auth/register] error:", error);

    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: error.issues[0]?.message ?? "Invalid form data" },
        { status: 400 },
      );
    }

    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2002") {
        return NextResponse.json(
          { error: "An account with this email or phone already exists. Try logging in." },
          { status: 409 },
        );
      }
      if (error.code === "P2003") {
        return NextResponse.json(
          { error: "Foreign key constraint failed. Related record not found." },
          { status: 400 },
        );
      }
      return NextResponse.json(
        { error: `Database error (${error.code}): ${error.message}` },
        { status: 500 },
      );
    }

    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: `Registration failed: ${message}. Check server logs.` },
      { status: 500 },
    );
  }
}
