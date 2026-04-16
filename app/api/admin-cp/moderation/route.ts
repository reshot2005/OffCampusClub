import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminMutationPermission, requireAdminPermission } from "@/lib/admin-api-guard";
import { logAudit } from "@/lib/audit";
import { z } from "zod";

export async function GET() {
  const admin = await requireAdminPermission("moderation", "read");
  if (admin instanceof NextResponse) return admin;

  const [reports, applications, tickets] = await Promise.all([
    prisma.commentReport.findMany({
      take: 80,
      orderBy: { createdAt: "desc" },
      include: {
        reporter: { select: { id: true, fullName: true, email: true } },
        comment: {
          include: {
            user: { select: { id: true, fullName: true } },
            post: {
              select: {
                id: true,
                caption: true,
                club: { select: { name: true, id: true } },
              },
            },
          },
        },
      },
    }),
    prisma.gigApplication.findMany({
      where: { status: "PENDING" },
      take: 80,
      orderBy: { createdAt: "desc" },
      include: {
        gig: { select: { id: true, title: true, clubId: true } },
        user: { select: { id: true, fullName: true, email: true } },
      },
    }),
    prisma.moderationTicket.findMany({
      take: 120,
      orderBy: { updatedAt: "desc" },
      include: { assignee: { select: { id: true, fullName: true } } },
    }),
  ]);

  return NextResponse.json({
    commentReports: reports.map((r: any) => ({
      id: r.id,
      reason: r.reason,
      createdAt: r.createdAt.toISOString(),
      reporter: r.reporter,
      comment: r.comment
        ? {
            id: r.comment.id,
            content: r.comment.content.slice(0, 280),
            author: r.comment.user,
            post: r.comment.post,
          }
        : null,
    })),
    gigApplications: applications.map((a: any) => ({
      id: a.id,
      message: a.message,
      applicantName: a.applicantName,
      createdAt: a.createdAt.toISOString(),
      gig: a.gig,
      user: a.user,
    })),
    tickets: tickets.map((t: any) => ({
      id: t.id,
      resourceType: t.resourceType,
      resourceId: t.resourceId,
      status: t.status,
      dueAt: t.dueAt?.toISOString() ?? null,
      notes: t.notes,
      assignee: t.assignee,
      updatedAt: t.updatedAt.toISOString(),
    })),
  });
}

const postTicketSchema = z.object({
  resourceType: z.enum(["COMMENT_REPORT", "GIG_APPLICATION"]),
  resourceId: z.string(),
});

export async function POST(req: NextRequest) {
  const admin = await requireAdminMutationPermission(req, "moderation", "update", {
    rateAction: "moderation:create_ticket",
    limit: 30,
    windowMs: 60_000,
  });
  if (admin instanceof NextResponse) return admin;

  const parsed = postTicketSchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ error: "Invalid moderation payload" }, { status: 400 });
  const body = parsed.data;

  const ticket = await prisma.moderationTicket.upsert({
    where: {
      resourceType_resourceId: {
        resourceType: body.resourceType,
        resourceId: body.resourceId,
      },
    },
    create: {
      resourceType: body.resourceType,
      resourceId: body.resourceId,
      status: "OPEN",
      assigneeId: admin.id,
    },
    update: { status: "IN_PROGRESS", assigneeId: admin.id },
  });

  await logAudit({
    adminId: admin.id,
    adminEmail: admin.email,
    action: "MODERATION_TICKET",
    entity: "moderation",
    entityId: ticket.id,
    details: { resourceType: body.resourceType, resourceId: body.resourceId },
  });

  return NextResponse.json({ success: true, ticket });
}

const patchTicketSchema = z.object({
  ticketId: z.string(),
  status: z.enum(["OPEN", "IN_PROGRESS", "RESOLVED"]).optional(),
  assigneeId: z.string().nullable().optional(),
  dueAt: z.string().nullable().optional(),
  notes: z.string().max(2000).optional(),
});

export async function PATCH(req: NextRequest) {
  const admin = await requireAdminMutationPermission(req, "moderation", "update", {
    rateAction: "moderation:update_ticket",
    limit: 30,
    windowMs: 60_000,
  });
  if (admin instanceof NextResponse) return admin;

  const parsed = patchTicketSchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ error: "Invalid moderation payload" }, { status: 400 });
  const body = parsed.data;
  const data: Record<string, unknown> = {};
  if (body.status !== undefined) data.status = body.status;
  if (body.assigneeId !== undefined) data.assigneeId = body.assigneeId;
  if (body.dueAt !== undefined) data.dueAt = body.dueAt ? new Date(body.dueAt) : null;
  if (body.notes !== undefined) data.notes = body.notes;

  const ticket = await prisma.moderationTicket.update({
    where: { id: body.ticketId },
    data: data as any,
  });

  await logAudit({
    adminId: admin.id,
    adminEmail: admin.email,
    action: "MODERATION_TICKET",
    entity: "moderation",
    entityId: ticket.id,
    details: data as Record<string, unknown>,
  });

  return NextResponse.json({ success: true, ticket });
}
