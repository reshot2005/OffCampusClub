import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminPermission } from "@/lib/admin-api-guard";
import { logAudit } from "@/lib/audit";

/** DSAR-style JSON export for a single user (admin CP only). */
export async function GET(_req: Request, { params }: { params: { userId: string } }) {
  const admin = await requireAdminPermission("compliance", "export_data");
  if (admin instanceof NextResponse) return admin;

  const user = await prisma.user.findUnique({
    where: { id: params.userId },
    include: {
      memberships: { include: { club: { select: { id: true, name: true, slug: true } } } },
      posts: { take: 200, orderBy: { createdAt: "desc" }, select: { id: true, caption: true, createdAt: true, clubId: true } },
      gigsApplied: { take: 100, select: { id: true, gigId: true, status: true, createdAt: true } },
      registrations: { take: 100, include: { event: { select: { title: true, id: true } } } },
    },
  });

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const { password: _pw, ...safeUser } = user;

  await logAudit({
    adminId: admin.id,
    adminEmail: admin.email,
    action: "COMPLIANCE_EXPORT_USER",
    entity: "user",
    entityId: user.id,
    details: { email: user.email },
  });

  return NextResponse.json({
    exportedAt: new Date().toISOString(),
    user: safeUser,
  });
}
