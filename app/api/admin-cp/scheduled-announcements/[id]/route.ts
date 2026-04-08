import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminPermission } from "@/lib/admin-api-guard";
import { logAudit } from "@/lib/audit";
import { z } from "zod";

const patchSchema = z.object({
  title: z.string().max(200).optional(),
  body: z.string().max(4000).optional(),
  startsAt: z.string().optional(),
  endsAt: z.string().optional(),
  active: z.boolean().optional(),
});

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const admin = await requireAdminPermission("announcement_schedule", "update");
  if (admin instanceof NextResponse) return admin;

  const body = patchSchema.parse(await req.json());
  const data: Record<string, unknown> = {};
  if (body.title !== undefined) data.title = body.title;
  if (body.body !== undefined) data.body = body.body;
  if (body.startsAt !== undefined) data.startsAt = new Date(body.startsAt);
  if (body.endsAt !== undefined) data.endsAt = new Date(body.endsAt);
  if (body.active !== undefined) data.active = body.active;

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: "No fields" }, { status: 400 });
  }

  const row = await prisma.adminScheduledAnnouncement.update({
    where: { id: params.id },
    data: data as any,
  });

  await logAudit({
    adminId: admin.id,
    adminEmail: admin.email,
    action: "UPDATE_SETTINGS",
    entity: "settings",
    entityId: row.id,
    details: { type: "scheduled_announcement", action: "update" },
  });

  return NextResponse.json({ success: true, item: row });
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const admin = await requireAdminPermission("announcement_schedule", "delete");
  if (admin instanceof NextResponse) return admin;

  await prisma.adminScheduledAnnouncement.delete({ where: { id: params.id } });

  await logAudit({
    adminId: admin.id,
    adminEmail: admin.email,
    action: "UPDATE_SETTINGS",
    entity: "settings",
    entityId: params.id,
    details: { type: "scheduled_announcement", action: "delete" },
  });

  return NextResponse.json({ success: true });
}
