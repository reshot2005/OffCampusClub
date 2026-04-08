import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminPermission } from "@/lib/admin-api-guard";
import { logAudit } from "@/lib/audit";

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const admin = await requireAdminPermission("orbit", "update");
  if (admin instanceof NextResponse) return admin;

  const body = await req.json();
  const data: Record<string, any> = {};

  if (body.title !== undefined) data.title = body.title;
  if (body.category !== undefined) data.category = body.category;
  if (body.description !== undefined) data.description = body.description;
  if (body.imageUrl !== undefined) data.imageUrl = body.imageUrl;
  if (body.sortOrder !== undefined) data.sortOrder = body.sortOrder;
  if (body.active !== undefined) data.active = body.active;

  await prisma.orbitProject.update({ where: { id: params.id }, data });

  await logAudit({
    adminId: admin.id,
    adminEmail: admin.email,
    action: "UPDATE_EVENT" as any,
    entity: "event" as any,
    entityId: params.id,
    details: { ...data, type: "orbit_project" },
  });

  return NextResponse.json({ success: true });
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const admin = await requireAdminPermission("orbit", "delete");
  if (admin instanceof NextResponse) return admin;

  await prisma.orbitProject.delete({ where: { id: params.id } });

  await logAudit({
    adminId: admin.id,
    adminEmail: admin.email,
    action: "DELETE_EVENT" as any,
    entity: "event" as any,
    entityId: params.id,
    details: { type: "orbit_project" },
  });

  return NextResponse.json({ success: true });
}
