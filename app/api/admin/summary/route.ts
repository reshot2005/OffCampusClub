import { NextResponse } from "next/server";
import { requireAdminPermission } from "@/lib/admin-api-guard";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const admin = await requireAdminPermission("analytics", "read");
  if (admin instanceof NextResponse) return admin;

  const [totalUsers, activeClubs, pendingApprovals, totalPosts, totalReferrals, eventRegs] =
    await Promise.all([
      prisma.user.count(),
      prisma.club.count(),
      prisma.user.count({ where: { role: "CLUB_HEADER", approvalStatus: "PENDING" } }),
      prisma.post.count({ where: { hidden: false } }),
      prisma.referralStat.count(),
      prisma.eventRegistration.count(),
    ]);

  const usersByRole = await prisma.user.groupBy({
    by: ["role"],
    _count: { id: true },
  });

  return NextResponse.json({
    totalUsers,
    activeClubs,
    pendingApprovals,
    totalPosts,
    totalReferrals,
    eventRegs,
    usersByRole: usersByRole.map((r) => ({ role: r.role, count: r._count.id })),
  });
}
