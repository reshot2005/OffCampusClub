
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminMutationPermission, requireAdminPermission } from "@/lib/admin-api-guard";
import { logAudit } from "@/lib/audit";
import { z } from "zod";

const securityResolveSchema = z.object({ id: z.string().min(1).max(191) }).strict();

export async function GET(req: Request) {
  const admin = await requireAdminPermission("security", "read");
  if (admin instanceof NextResponse) return admin;

  const { searchParams } = new URL(req.url);
  const resolved = searchParams.get("resolved") === "true" ? true : searchParams.get("resolved") === "false" ? false : undefined;

  // Use raw queries for OTP stats to prevent "Value 'EXPORT' not found in enum" errors 
  // when the local Prisma client is out of sync with the database schema.
  const statsQuery = async () => {
    try {
      const otpLast24h: any[] = await prisma.$queryRaw`
        SELECT COUNT(*)::int as count FROM email_otp_tokens 
        WHERE "createdAt" >= NOW() - INTERVAL '24 hours'
      `;
      
      const otpByPurpose: any[] = await prisma.$queryRaw`
        SELECT purpose, COUNT(*)::int as count FROM email_otp_tokens 
        WHERE "createdAt" >= NOW() - INTERVAL '7 days'
        GROUP BY purpose
      `;

      return {
        tokensCreatedLast24h: otpLast24h[0]?.count || 0,
        byPurposeLast7d: otpByPurpose.map(p => ({ purpose: String(p.purpose), count: p.count }))
      };
    } catch (e) {
      console.error("Security Stats Error:", e);
      return { tokensCreatedLast24h: 0, byPurposeLast7d: [] };
    }
  };

  const [alerts, stats] = await Promise.all([
    prisma.suspiciousAccess.findMany({
      where: resolved !== undefined ? { resolved } : {},
      orderBy: { createdAt: "desc" },
      take: 100,
    }),
    statsQuery(),
  ]);

  return NextResponse.json({
    alerts: alerts.map((a) => ({ ...a, createdAt: a.createdAt.toISOString() })),
    otpStats: stats,
  });
}

export async function PATCH(req: NextRequest) {
  const admin = await requireAdminMutationPermission(req, "security", "resolve", {
    rateAction: "security:resolve",
    limit: 20,
    windowMs: 60_000,
  });
  if (admin instanceof NextResponse) return admin;

  const parsed = securityResolveSchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  const { id } = parsed.data;

  await prisma.suspiciousAccess.update({ where: { id }, data: { resolved: true } });

  await logAudit({
    adminId: admin.id, adminEmail: admin.email,
    action: "RESOLVE_ALERT", entity: "security", entityId: id,
  });

  return NextResponse.json({ success: true });
}
