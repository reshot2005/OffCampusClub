import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminPermission } from "@/lib/admin-api-guard";
import { logAudit } from "@/lib/audit";
import { z } from "zod";

const createSchema = z.object({
  clubId: z.string(),
  title: z.string().min(2).max(200),
  description: z.string().min(5).max(2000),
  date: z.string(),
  venue: z.string().min(2).max(200),
  price: z.number().min(0).default(0),
  maxCapacity: z.number().min(0).nullable().optional(),
  imageUrl: z.string().optional(),
});

export async function GET() {
  const admin = await requireAdminPermission("events", "read");
  if (admin instanceof NextResponse) return admin;

  const events = await prisma.event.findMany({
    include: {
      club: { select: { id: true, name: true, slug: true } },
      _count: { select: { registrations: true } },
    },
    orderBy: { date: "desc" },
  });

  return NextResponse.json({
    events: events.map((e) => ({
      ...e,
      date: e.date.toISOString(),
      createdAt: e.createdAt.toISOString(),
    })),
  });
}

export async function POST(req: NextRequest) {
  const admin = await requireAdminPermission("events", "create");
  if (admin instanceof NextResponse) return admin;

  const body = createSchema.parse(await req.json());

  const event = await prisma.event.create({
    data: {
      clubId: body.clubId,
      title: body.title,
      description: body.description,
      date: new Date(body.date),
      venue: body.venue,
      price: body.price,
      maxCapacity: body.maxCapacity ?? null,
      imageUrl: body.imageUrl || "",
    },
  });

  await logAudit({
    adminId: admin.id, adminEmail: admin.email,
    action: "CREATE_EVENT", entity: "event", entityId: event.id,
    details: { title: body.title, club: body.clubId },
  });

  return NextResponse.json({ success: true, event: { ...event, date: event.date.toISOString(), createdAt: event.createdAt.toISOString() } });
}
