import { NextResponse } from "next/server";
import { requireAdminPermission } from "@/lib/admin-api-guard";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const user = await requireAdminPermission("approvals", "read");
  if (user instanceof NextResponse) return user;

  const rows = await prisma.user.findMany({
    where: { role: "CLUB_HEADER", approvalStatus: "PENDING" },
    orderBy: { createdAt: "desc" },
    include: {
      clubManaged: true,
      pendingLeadClub: { select: { name: true, slug: true, icon: true } },
    },
  });

  const approvals = rows.map((a) => ({
    ...a,
    clubManaged: a.clubManaged
      ? {
          name: a.clubManaged.name,
          slug: a.clubManaged.slug,
          icon: a.clubManaged.icon,
        }
      : a.pendingLeadClub
        ? {
            name: a.pendingLeadClub.name,
            slug: a.pendingLeadClub.slug,
            icon: a.pendingLeadClub.icon,
          }
        : null,
  }));

  return NextResponse.json({ approvals });
}
