import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminPermission } from "@/lib/admin-api-guard";
import { logAudit } from "@/lib/audit";
import { z } from "zod";

const patchSchema = z.object({
  name: z.string().min(2).max(80).optional(),
  description: z.string().max(500).optional(),
  permissions: z.record(z.string(), z.array(z.string())).optional(),
});

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const admin = await requireAdminPermission("roles", "update");
  if (admin instanceof NextResponse) return admin;

  const body = patchSchema.parse(await req.json());
  const data: Record<string, unknown> = {};
  if (body.name !== undefined) data.name = body.name;
  if (body.description !== undefined) data.description = body.description;
  if (body.permissions !== undefined) data.permissions = body.permissions;

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: "No fields" }, { status: 400 });
  }

  const t = await prisma.adminRoleTemplate.update({
    where: { id: params.id },
    data: data as any,
  });

  await logAudit({
    adminId: admin.id,
    adminEmail: admin.email,
    action: "ADMIN_ROLE_UPDATE",
    entity: "admin_role",
    entityId: t.id,
    details: data as Record<string, unknown>,
  });

  return NextResponse.json({ success: true, template: t });
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const admin = await requireAdminPermission("roles", "delete");
  if (admin instanceof NextResponse) return admin;

  const users = await prisma.user.count({ where: { adminRoleTemplateId: params.id } });
  if (users > 0) {
    return NextResponse.json(
      { error: `Reassign ${users} admin user(s) before deleting this role.` },
      { status: 400 },
    );
  }

  await prisma.adminRoleTemplate.delete({ where: { id: params.id } });

  await logAudit({
    adminId: admin.id,
    adminEmail: admin.email,
    action: "ADMIN_ROLE_DELETE",
    entity: "admin_role",
    entityId: params.id,
    details: {},
  });

  return NextResponse.json({ success: true });
}
