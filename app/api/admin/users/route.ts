import { NextRequest, NextResponse } from "next/server";
import { requireAdminPermission } from "@/lib/admin-api-guard";
import { prisma } from "@/lib/prisma";
import type { ApprovalStatus, UserRole } from "@prisma/client";

export async function GET(req: NextRequest) {
  const admin = await requireAdminPermission("users", "read");
  if (admin instanceof NextResponse) return admin;

  const q = req.nextUrl.searchParams.get("q")?.trim() || "";
  const role = req.nextUrl.searchParams.get("role") as UserRole | null;
  const status = req.nextUrl.searchParams.get("status") as ApprovalStatus | null;

  const users = await prisma.user.findMany({
    where: {
      ...(q
        ? {
            OR: [
              { fullName: { contains: q, mode: "insensitive" } },
              { email: { contains: q, mode: "insensitive" } },
              { collegeName: { contains: q, mode: "insensitive" } },
            ],
          }
        : {}),
      ...(role ? { role } : {}),
      ...(status ? { approvalStatus: status } : {}),
    },
    include: {
      memberships: { include: { club: true }, take: 5 },
      _count: { select: { referralStatsAsStudent: true, referralStatsAsHeader: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 200,
  });

  return NextResponse.json({ users });
}
