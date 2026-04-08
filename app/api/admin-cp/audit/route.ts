import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminPermission } from "@/lib/admin-api-guard";

export async function GET(req: Request) {
  const admin = await requireAdminPermission("audit", "read");
  if (admin instanceof NextResponse) return admin;

  const { searchParams } = new URL(req.url);
  const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
  const entity = searchParams.get("entity") || undefined;
  const take = 50;
  const skip = (page - 1) * take;

  const where: Record<string, any> = {};
  if (entity) where.entity = entity;

  const [logs, total] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take,
      skip,
      select: {
        id: true, adminEmail: true, action: true, entity: true,
        entityId: true, details: true, ipAddress: true, createdAt: true,
      },
    }),
    prisma.auditLog.count({ where }),
  ]);

  return NextResponse.json({
    logs: logs.map((l) => ({ ...l, createdAt: l.createdAt.toISOString() })),
    total,
    page,
    totalPages: Math.ceil(total / take),
  });
}
