import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { logAudit } from "@/lib/audit";
import { requireAdminMutationPermission, requireAdminPermission } from "@/lib/admin-api-guard";
import { z } from "zod";

const settingsPatchSchema = z
  .object({
    siteName: z.string().min(1).max(120).optional(),
    announcementBanner: z.string().max(400).optional(),
    announcementActive: z.boolean().optional(),
    maintenanceMode: z.boolean().optional(),
    registrationOpen: z.boolean().optional(),
    landingHeroTitle: z.string().max(180).optional(),
    landingHeroSubtitle: z.string().max(600).optional(),
    featureFlags: z.record(z.string(), z.unknown()).optional(),
    rateLimitPolicy: z.record(z.string(), z.unknown()).optional(),
    legalPrivacyHtml: z.string().max(60_000).optional(),
    legalTermsHtml: z.string().max(60_000).optional(),
    landingCmsExtra: z.record(z.string(), z.unknown()).optional(),
  })
  .strict();

export async function GET() {
  const admin = await requireAdminPermission("settings", "read");
  if (admin instanceof NextResponse) return admin;

  let settings = await prisma.platformSettings.findUnique({ where: { id: "singleton" } });
  if (!settings) {
    settings = await prisma.platformSettings.create({ data: { id: "singleton" } });
  }

  return NextResponse.json({
    settings: {
      ...settings,
      updatedAt: settings.updatedAt.toISOString(),
      featureFlags: settings.featureFlags ?? {},
      rateLimitPolicy: settings.rateLimitPolicy ?? {},
      landingCmsExtra: settings.landingCmsExtra ?? {},
    },
  });
}

export async function PATCH(req: NextRequest) {
  const parsed = settingsPatchSchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid settings payload" }, { status: 400 });
  }
  const body = parsed.data;
  const data: Record<string, unknown> = {};

  const extendedOnlyKeys = [
    "featureFlags",
    "rateLimitPolicy",
    "legalPrivacyHtml",
    "legalTermsHtml",
    "landingCmsExtra",
  ] as const;
  const coreKeys = [
    "siteName",
    "announcementBanner",
    "announcementActive",
    "maintenanceMode",
    "registrationOpen",
    "landingHeroTitle",
    "landingHeroSubtitle",
  ] as const;

  const touchesExtended = extendedOnlyKeys.some((k) => body[k] !== undefined);
  const touchesCore = coreKeys.some((k) => body[k] !== undefined);

  if (!touchesExtended && !touchesCore) {
    return NextResponse.json({ error: "No valid fields" }, { status: 400 });
  }

  let actorId = "";
  let actorEmail = "";

  if (touchesCore) {
    const g = await requireAdminMutationPermission(req, "settings", "update", {
      rateAction: "settings:update:core",
      limit: 20,
      windowMs: 60_000,
    });
    if (g instanceof NextResponse) return g;
    actorId = g.id;
    actorEmail = g.email;
  }

  if (touchesExtended) {
    const g = await requireAdminMutationPermission(req, "settings", "update", {
      rateAction: "settings:update:extended",
      limit: 10,
      windowMs: 60_000,
    });
    if (g instanceof NextResponse) return g;
    if (!actorId) {
      actorId = g.id;
      actorEmail = g.email;
    }
  }

  if (body.siteName !== undefined) data.siteName = body.siteName;
  if (body.announcementBanner !== undefined) data.announcementBanner = body.announcementBanner;
  if (body.announcementActive !== undefined) data.announcementActive = body.announcementActive;
  if (body.maintenanceMode !== undefined) data.maintenanceMode = body.maintenanceMode;
  if (body.registrationOpen !== undefined) data.registrationOpen = body.registrationOpen;
  if (body.landingHeroTitle !== undefined) data.landingHeroTitle = body.landingHeroTitle;
  if (body.landingHeroSubtitle !== undefined) data.landingHeroSubtitle = body.landingHeroSubtitle;
  if (body.featureFlags !== undefined) data.featureFlags = body.featureFlags;
  if (body.rateLimitPolicy !== undefined) data.rateLimitPolicy = body.rateLimitPolicy;
  if (body.legalPrivacyHtml !== undefined) data.legalPrivacyHtml = body.legalPrivacyHtml;
  if (body.legalTermsHtml !== undefined) data.legalTermsHtml = body.legalTermsHtml;
  if (body.landingCmsExtra !== undefined) data.landingCmsExtra = body.landingCmsExtra;

  const settings = await prisma.platformSettings.upsert({
    where: { id: "singleton" },
    create: { id: "singleton", ...data } as any,
    update: data as any,
  });

  await logAudit({
    adminId: actorId,
    adminEmail: actorEmail,
    action: "UPDATE_SETTINGS",
    entity: "settings",
    details: data as Record<string, unknown>,
  });

  return NextResponse.json({
    success: true,
    settings: { ...settings, updatedAt: settings.updatedAt.toISOString() },
  });
}
