import { NextResponse } from "next/server";
import { authCookieOptions, signAuthToken } from "@/lib/jwt";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/** Re-sign JWT from DB (e.g. after approval status changes). */
export async function POST() {
  const session = await getSessionUser();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({ where: { id: session.id } });
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const token = await signAuthToken({
    userId: user.id,
    email: user.email,
    role: user.role as "ADMIN" | "CLUB_HEADER" | "STUDENT",
    approvalStatus: user.approvalStatus as "PENDING" | "APPROVED" | "REJECTED",
    suspended: user.suspended,
    onboardingComplete: user.onboardingComplete,
  });

  const res = NextResponse.json({
    success: true,
    role: user.role,
    approvalStatus: user.approvalStatus,
  });
  res.cookies.set("occ-token", token, authCookieOptions);
  return res;
}
