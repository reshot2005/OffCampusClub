import bcrypt from "bcryptjs";
import { NextRequest, NextResponse } from "next/server";
import { ZodError } from "zod";
import { authCookieOptions, signAuthToken } from "@/lib/jwt";
import { prisma } from "@/lib/prisma";
import { loginSchema } from "@/lib/validations";

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
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    if (user.suspended) {
      return NextResponse.json({ error: "Account suspended" }, { status: 403 });
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
  } catch (error: any) {
    // TEMPORARY DEBUG: Log to a file we can read
    try {
      const fs = require('fs');
      const errLog = `[auth/login] ${new Date().toISOString()} error: ${error?.message}\nStack: ${error?.stack}\n\n`;
      fs.appendFileSync('tmp_login_error.log', errLog);
    } catch {}

    console.error("[auth/login] error:", error);
    if (error instanceof ZodError) {
      return NextResponse.json({ error: error.issues[0]?.message ?? "Invalid form data" }, { status: 400 });
    }

    return NextResponse.json({ error: "Login failed: " + (error?.message ?? "unknown") }, { status: 500 });
  }
}
