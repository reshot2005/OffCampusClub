import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminPermission } from "@/lib/admin-api-guard";
import { logAudit } from "@/lib/audit";
import { z } from "zod";

const patchSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  slug: z.string().min(2).max(50).regex(/^[a-z0-9-]+$/).optional(),
  description: z.string().min(5).max(1000).optional(),
  icon: z.string().min(1).max(10).optional(),
  theme: z.string().min(1).max(30).optional(),
  coverImage: z.string().nullable().optional(),
  headerId: z.string().nullable().optional(),
  postingFrozen: z.boolean().optional(),
});

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const admin = await requireAdminPermission("clubs", "read");
  if (admin instanceof NextResponse) return admin;

  const club = await prisma.club.findUnique({
    where: { id: params.id },
    include: {
      header: { select: { id: true, fullName: true, email: true, referralCode: true } },
      _count: { select: { members: true, posts: true, events: true, gigs: true } },
    },
  });
  if (!club) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ club });
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const admin = await requireAdminPermission("clubs", "update");
  if (admin instanceof NextResponse) return admin;

  const body = patchSchema.parse(await req.json().catch(() => ({})));
  const data: Record<string, any> = {};

  if (body.name !== undefined) data.name = body.name;
  if (body.slug !== undefined) data.slug = body.slug;
  if (body.description !== undefined) data.description = body.description;
  if (body.icon !== undefined) data.icon = body.icon;
  if (body.theme !== undefined) data.theme = body.theme;
  if (body.coverImage !== undefined) data.coverImage = body.coverImage;
  if (body.postingFrozen !== undefined) data.postingFrozen = body.postingFrozen;
  if (body.headerId !== undefined) data.headerId = body.headerId;

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: "No fields to update" }, { status: 400 });
  }

  const club = await prisma.club.update({ where: { id: params.id }, data });

  await logAudit({
    adminId: admin.id, adminEmail: admin.email,
    action: "UPDATE_CLUB", entity: "club", entityId: params.id,
    details: data,
  });

  return NextResponse.json({ success: true, club });
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const admin = await requireAdminPermission("clubs", "delete");
  if (admin instanceof NextResponse) return admin;

  const club = await prisma.club.findUnique({ where: { id: params.id }, select: { name: true } });
  if (!club) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await prisma.club.delete({ where: { id: params.id } });

  await logAudit({
    adminId: admin.id, adminEmail: admin.email,
    action: "DELETE_CLUB", entity: "club", entityId: params.id,
    details: { name: club.name },
  });

  return NextResponse.json({ success: true });
}
