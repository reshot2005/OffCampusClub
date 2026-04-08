import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { attachStudentToReferralCode } from "@/lib/attach-referral";
import { authCookieOptions, signAuthToken } from "@/lib/jwt";
import { logSuspiciousAccess } from "@/lib/security";

export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    if (body && typeof body === "object" && !Array.isArray(body)) {
      const raw = body as Record<string, unknown>;
      const attempted = ["role", "adminLevel", "adminRoleTemplateId", "approvalStatus"].filter(
        (k) => k in raw,
      );
      if (attempted.length) {
        const forwarded = req.headers.get("x-forwarded-for") || "";
        const ip = forwarded.split(",")[0]?.trim() || "unknown";
        await logSuspiciousAccess({
          userId: user.id,
          ipAddress: ip,
          userAgent: req.headers.get("user-agent") || undefined,
          path: "/api/onboarding/complete",
          reason: `Role/privilege field(s) present in onboarding request: ${attempted.join(", ")}`,
          severity: "HIGH",
        });
      }
    }
    const { referralSource, referralCode } = body as {
      referralSource?: string;
      referralCode?: string;
    };

    if (!referralSource) {
      return NextResponse.json({ error: "referralSource is required" }, { status: 400 });
    }

    const codeNormalized =
      typeof referralCode === "string" && referralCode.trim().length > 0
        ? referralCode.trim().toUpperCase()
        : "";

    // Step 1: Update user record
    await prisma.user.update({
      where: { id: user.id },
      data: {
        onboardingComplete: true,
        referralSource,
      },
    });

    if (codeNormalized) {
      const attached = await attachStudentToReferralCode({
        studentId: user.id,
        studentFullName: user.fullName,
        studentCollegeName: user.collegeName,
        codeRaw: codeNormalized,
      });
      if (!attached.ok) {
        console.warn("[onboarding] referral attach failed or invalid code for user=%s", user.id);
      }
    }

    const refreshed = await prisma.user.findUnique({ where: { id: user.id } });
    if (!refreshed) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const token = await signAuthToken({
      userId: refreshed.id,
      email: refreshed.email,
      role: refreshed.role as "ADMIN" | "CLUB_HEADER" | "STUDENT",
      approvalStatus: refreshed.approvalStatus as "PENDING" | "APPROVED" | "REJECTED",
      suspended: refreshed.suspended,
      onboardingComplete: refreshed.onboardingComplete,
    });

    const res = NextResponse.json({ success: true });
    res.cookies.set("occ-token", token, authCookieOptions);
    return res;
  } catch (error) {
    console.error("[onboarding/complete] error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
