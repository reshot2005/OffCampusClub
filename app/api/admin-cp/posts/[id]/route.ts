import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminPermission } from "@/lib/admin-api-guard";
import { logAudit } from "@/lib/audit";
import { z } from "zod";

const patchSchema = z.object({
  hidden: z.boolean().optional(),
  pinned: z.boolean().optional(),
  caption: z.string().nullable().optional(),
  content: z.string().nullable().optional(),
  imageUrl: z.string().nullable().optional(),
  clubId: z.string().optional(),
});

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const admin = await requireAdminPermission("posts", "update");
  if (admin instanceof NextResponse) return admin;

  const body = patchSchema.parse(await req.json().catch(() => ({})));
  const data: Record<string, any> = {};

  if (body.hidden !== undefined) data.hidden = body.hidden;
  if (body.pinned !== undefined) data.pinned = body.pinned;
  if (body.caption !== undefined) data.caption = body.caption;
  if (body.content !== undefined) data.content = body.content;
  if (body.imageUrl !== undefined) data.imageUrl = body.imageUrl;
  if (body.clubId !== undefined) data.clubId = body.clubId;

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: "No fields" }, { status: 400 });
  }

  await prisma.post.update({ where: { id: params.id }, data });

  const action = body.hidden !== undefined ? "HIDE_POST"
    : body.pinned !== undefined ? "PIN_POST"
    : "UPDATE_POST";

  await logAudit({
    adminId: admin.id, adminEmail: admin.email,
    action: action as any, entity: "post", entityId: params.id, details: data,
  });

  return NextResponse.json({ success: true });
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const admin = await requireAdminPermission("posts", "delete");
  if (admin instanceof NextResponse) return admin;

  await prisma.post.delete({ where: { id: params.id } });

  await logAudit({
    adminId: admin.id, adminEmail: admin.email,
    action: "DELETE_POST", entity: "post", entityId: params.id,
  });

  return NextResponse.json({ success: true });
}
