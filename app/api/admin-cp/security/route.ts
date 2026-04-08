import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminPermission } from "@/lib/admin-api-guard";
import { logAudit } from "@/lib/audit";

export async function GET(req: Request) {
  const admin = await requireAdminPermission("security", "read");
  if (admin instanceof NextResponse) return admin;

  const { searchParams } = new URL(req.url);
  const resolved = searchParams.get("resolved") === "true" ? true : searchParams.get("resolved") === "false" ? false : undefined;

  const [alerts, otpLast24h, otpByPurpose] = await Promise.all([
    prisma.suspiciousAccess.findMany({
      where: resolved !== undefined ? { resolved } : {},
      orderBy: { createdAt: "desc" },
      take: 100,
    }),
    prisma.emailOtpToken.count({
      where: { createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } },
    }),
    prisma.emailOtpToken.groupBy({
      by: ["purpose"],
      _count: { _all: true },
      where: { createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } },
    }),
  ]);

  return NextResponse.json({
    alerts: alerts.map((a) => ({ ...a, createdAt: a.createdAt.toISOString() })),
    otpStats: {
      tokensCreatedLast24h: otpLast24h,
      byPurposeLast7d: otpByPurpose.map((g) => ({ purpose: g.purpose, count: g._count._all })),
    },
  });
}

export async function PATCH(req: NextRequest) {
  const admin = await requireAdminPermission("security", "resolve");
  if (admin instanceof NextResponse) return admin;

  const { id } = await req.json();
  if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 });

  await prisma.suspiciousAccess.update({ where: { id }, data: { resolved: true } });

  await logAudit({
    adminId: admin.id, adminEmail: admin.email,
    action: "RESOLVE_ALERT", entity: "security", entityId: id,
  });

  return NextResponse.json({ success: true });
}
