import { NextRequest, NextResponse } from "next/server";
import { requireAdminPermission } from "@/lib/admin-api-guard";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const patchSchema = z.object({
  headerId: z.string().cuid().nullable().optional(),
  postingFrozen: z.boolean().optional(),
});

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const admin = await requireAdminPermission("clubs", "read");
  if (admin instanceof NextResponse) return admin;

  const club = await prisma.club.findUnique({
    where: { id: params.id },
    include: {
      header: { select: { id: true, fullName: true, email: true, referralCode: true } },
      _count: { select: { members: true, posts: true, events: true } },
    },
  });
  if (!club) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ club });
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const admin = await requireAdminPermission("clubs", "update");
  if (admin instanceof NextResponse) return admin;

  const body = patchSchema.parse(await req.json().catch(() => ({})));

  const data: { headerId?: string | null; postingFrozen?: boolean } = {};
  if (body.postingFrozen !== undefined) data.postingFrozen = body.postingFrozen;

  if (body.headerId !== undefined) {
    if (body.headerId === null) {
      data.headerId = null;
    } else {
      const header = await prisma.user.findUnique({ where: { id: body.headerId } });
      if (!header || header.role !== "CLUB_HEADER" || header.approvalStatus !== "APPROVED") {
        return NextResponse.json({ error: "Invalid club header user" }, { status: 400 });
      }
      data.headerId = body.headerId;
    }
  }

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: "No valid fields" }, { status: 400 });
  }

  await prisma.club.update({
    where: { id: params.id },
    data,
  });
  return NextResponse.json({ success: true });
}
