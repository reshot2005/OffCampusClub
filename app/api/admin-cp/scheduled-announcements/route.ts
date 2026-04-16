import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminMutationPermission, requireAdminPermission } from "@/lib/admin-api-guard";
import { logAudit } from "@/lib/audit";
import { z } from "zod";

export async function GET() {
  const admin = await requireAdminPermission("announcement_schedule", "read");
  if (admin instanceof NextResponse) return admin;

  const rows = await prisma.adminScheduledAnnouncement.findMany({
    orderBy: { startsAt: "desc" },
    take: 50,
  });

  return NextResponse.json({
    items: rows.map((r: any) => ({
      ...r,
      startsAt: r.startsAt.toISOString(),
      endsAt: r.endsAt.toISOString(),
      createdAt: r.createdAt.toISOString(),
      updatedAt: r.updatedAt.toISOString(),
    })),
  });
}

const postSchema = z.object({
  title: z.string().max(200).optional().default(""),
  body: z.string().min(1).max(4000),
  startsAt: z.string(),
  endsAt: z.string(),
  active: z.boolean().optional().default(true),
});

export async function POST(req: NextRequest) {
  const admin = await requireAdminMutationPermission(req, "announcement_schedule", "create", {
    rateAction: "announcement_schedule:create",
    limit: 15,
    windowMs: 60_000,
  });
  if (admin instanceof NextResponse) return admin;

  const parsed = postSchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ error: "Invalid schedule payload" }, { status: 400 });
  const body = parsed.data;
  const row = await prisma.adminScheduledAnnouncement.create({
    data: {
      title: body.title,
      body: body.body,
      startsAt: new Date(body.startsAt),
      endsAt: new Date(body.endsAt),
      active: body.active,
    },
  });

  await logAudit({
    adminId: admin.id,
    adminEmail: admin.email,
    action: "UPDATE_SETTINGS",
    entity: "settings",
    entityId: row.id,
    details: { type: "scheduled_announcement", action: "create" },
  });

  return NextResponse.json({ success: true, item: row });
}
