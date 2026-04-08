import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminPermission } from "@/lib/admin-api-guard";
import { logAudit } from "@/lib/audit";

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const admin = await requireAdminPermission("events", "update");
  if (admin instanceof NextResponse) return admin;

  const body = await req.json();
  const data: Record<string, any> = {};

  if (body.title) data.title = body.title;
  if (body.description) data.description = body.description;
  if (body.date) data.date = new Date(body.date);
  if (body.venue) data.venue = body.venue;
  if (body.price !== undefined) data.price = body.price;
  if (body.maxCapacity !== undefined) data.maxCapacity = body.maxCapacity;
  if (body.imageUrl !== undefined) data.imageUrl = body.imageUrl;

  await prisma.event.update({ where: { id: params.id }, data });

  await logAudit({
    adminId: admin.id, adminEmail: admin.email,
    action: "UPDATE_EVENT", entity: "event", entityId: params.id, details: data,
  });

  return NextResponse.json({ success: true });
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const admin = await requireAdminPermission("events", "delete");
  if (admin instanceof NextResponse) return admin;

  await prisma.event.delete({ where: { id: params.id } });

  await logAudit({
    adminId: admin.id, adminEmail: admin.email,
    action: "DELETE_EVENT", entity: "event", entityId: params.id,
  });

  return NextResponse.json({ success: true });
}
