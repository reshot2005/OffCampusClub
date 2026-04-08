import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminPermission } from "@/lib/admin-api-guard";
import { logAudit } from "@/lib/audit";
import { z } from "zod";

export async function GET() {
  const admin = await requireAdminPermission("broadcasts", "read");
  if (admin instanceof NextResponse) return admin;

  const rows = await prisma.adminBroadcast.findMany({
    orderBy: { createdAt: "desc" },
    take: 50,
    select: {
      id: true,
      title: true,
      message: true,
      audienceType: true,
      recipientCount: true,
      createdAt: true,
      completedAt: true,
    },
  });

  return NextResponse.json({
    broadcasts: rows.map((b) => ({
      ...b,
      createdAt: b.createdAt.toISOString(),
      completedAt: b.completedAt?.toISOString() ?? null,
    })),
  });
}

const postSchema = z.object({
  title: z.string().min(2).max(120),
  message: z.string().min(1).max(2000),
  audienceType: z.enum(["all", "students", "club_headers", "club_members"]),
  clubId: z.string().optional(),
});

export async function POST(req: NextRequest) {
  const admin = await requireAdminPermission("broadcasts", "create");
  if (admin instanceof NextResponse) return admin;

  const body = postSchema.parse(await req.json());

  let userIds: string[] = [];

  if (body.audienceType === "all") {
    const u = await prisma.user.findMany({ select: { id: true } });
    userIds = u.map((x) => x.id);
  } else if (body.audienceType === "students") {
    const u = await prisma.user.findMany({
      where: { role: "STUDENT" },
      select: { id: true },
    });
    userIds = u.map((x) => x.id);
  } else if (body.audienceType === "club_headers") {
    const u = await prisma.user.findMany({
      where: { role: "CLUB_HEADER" },
      select: { id: true },
    });
    userIds = u.map((x) => x.id);
  } else if (body.audienceType === "club_members" && body.clubId) {
    const m = await prisma.clubMembership.findMany({
      where: { clubId: body.clubId },
      select: { userId: true },
    });
    userIds = [...new Set(m.map((x) => x.userId))];
  } else {
    return NextResponse.json({ error: "clubId required for club_members" }, { status: 400 });
  }

  const broadcast = await prisma.adminBroadcast.create({
    data: {
      title: body.title,
      message: body.message,
      audienceType: body.audienceType,
      audienceFilter: body.clubId ? { clubId: body.clubId } : undefined,
      createdById: admin.id,
      recipientCount: userIds.length,
      completedAt: new Date(),
    },
  });

  const chunk = 200;
  for (let i = 0; i < userIds.length; i += chunk) {
    const slice = userIds.slice(i, i + chunk);
    await prisma.notification.createMany({
      data: slice.map((userId) => ({
        userId,
        type: "admin_broadcast",
        title: body.title,
        message: body.message,
        read: false,
        data: { broadcastId: broadcast.id },
      })),
    });
  }

  await logAudit({
    adminId: admin.id,
    adminEmail: admin.email,
    action: "ADMIN_BROADCAST",
    entity: "broadcast",
    entityId: broadcast.id,
    details: { audienceType: body.audienceType, recipients: userIds.length },
  });

  return NextResponse.json({
    success: true,
    sent: userIds.length,
    broadcastId: broadcast.id,
  });
}
