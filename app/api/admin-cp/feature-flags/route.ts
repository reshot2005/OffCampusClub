import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminPermission } from "@/lib/admin-api-guard";
import { logAudit } from "@/lib/audit";

export async function GET() {
  const admin = await requireAdminPermission("feature_flags", "read");
  if (admin instanceof NextResponse) return admin;

  let s = await prisma.platformSettings.findUnique({ where: { id: "singleton" } });
  if (!s) s = await prisma.platformSettings.create({ data: { id: "singleton" } });

  return NextResponse.json({
    featureFlags: s.featureFlags ?? {},
    rateLimitPolicy: s.rateLimitPolicy ?? {},
    legalPrivacyHtml: s.legalPrivacyHtml,
    legalTermsHtml: s.legalTermsHtml,
    landingCmsExtra: s.landingCmsExtra ?? {},
    updatedAt: s.updatedAt.toISOString(),
  });
}

export async function PATCH(req: NextRequest) {
  const admin = await requireAdminPermission("feature_flags", "update");
  if (admin instanceof NextResponse) return admin;

  const body = await req.json();
  const data: Record<string, unknown> = {};
  if (body.featureFlags !== undefined) data.featureFlags = body.featureFlags;
  if (body.rateLimitPolicy !== undefined) data.rateLimitPolicy = body.rateLimitPolicy;
  if (body.legalPrivacyHtml !== undefined) data.legalPrivacyHtml = body.legalPrivacyHtml;
  if (body.legalTermsHtml !== undefined) data.legalTermsHtml = body.legalTermsHtml;
  if (body.landingCmsExtra !== undefined) data.landingCmsExtra = body.landingCmsExtra;

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: "No valid fields" }, { status: 400 });
  }

  const s = await prisma.platformSettings.upsert({
    where: { id: "singleton" },
    create: { id: "singleton", ...data } as any,
    update: data as any,
  });

  await logAudit({
    adminId: admin.id,
    adminEmail: admin.email,
    action: "UPDATE_SETTINGS",
    entity: "settings",
    details: { featureFlagsPatch: true, keys: Object.keys(data) },
  });

  return NextResponse.json({ success: true, updatedAt: s.updatedAt.toISOString() });
}
