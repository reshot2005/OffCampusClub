import { NextResponse } from "next/server";
import { requireAdminPermission } from "@/lib/admin-api-guard";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const user = await requireAdminPermission("approvals", "read");
  if (user instanceof NextResponse) return user;

  const rows = await prisma.user.findMany({
    where: { role: "CLUB_HEADER", approvalStatus: "PENDING" },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      fullName: true,
      email: true,
      phoneNumber: true,
      collegeName: true,
      role: true,
      approvalStatus: true,
      createdAt: true,
      pendingLeadClubId: true,
      clubManaged: { select: { name: true, slug: true, icon: true } },
      pendingLeadClub: { select: { name: true, slug: true, icon: true } },
    },
  });

  const approvals = rows.map((a) => ({
    id: a.id,
    fullName: a.fullName,
    email: a.email,
    phoneNumber: a.phoneNumber,
    collegeName: a.collegeName,
    role: a.role,
    approvalStatus: a.approvalStatus,
    createdAt: a.createdAt,
    pendingLeadClubId: a.pendingLeadClubId,
    clubManaged: a.clubManaged ?? a.pendingLeadClub ?? null,
  }));

  return NextResponse.json({ approvals });
}
