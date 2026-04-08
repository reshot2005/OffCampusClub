import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminPermission } from "@/lib/admin-api-guard";
import { logAudit } from "@/lib/audit";
import { z } from "zod";

const createSchema = z.object({
  title: z.string().min(2).max(200),
  description: z.string().min(5).max(2000),
  payMin: z.number().min(0),
  payMax: z.number().min(0),
  clubId: z.string(),
  deadline: z.string().optional(),
});

export async function POST(req: NextRequest) {
  const admin = await requireAdminPermission("gigs", "create");
  if (admin instanceof NextResponse) return admin;

  const body = createSchema.parse(await req.json());

  const gig = await prisma.gig.create({
    data: {
      title: body.title,
      description: body.description,
      payMin: body.payMin,
      payMax: body.payMax,
      clubId: body.clubId,
      postedById: admin.id,
      deadline: body.deadline ? new Date(body.deadline) : null,
    },
  });

  await logAudit({
    adminId: admin.id, adminEmail: admin.email,
    action: "CREATE_GIG", entity: "gig", entityId: gig.id,
    details: { title: body.title, club: body.clubId },
  });

  return NextResponse.json({ success: true, gig });
}
