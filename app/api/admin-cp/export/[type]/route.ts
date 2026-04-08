import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { logAudit } from "@/lib/audit";
import { requireAdminPermission } from "@/lib/admin-api-guard";
import type { AdminAction } from "@/lib/admin-permissions";

const typeToAction: Record<string, AdminAction> = {
  users: "csv_users",
  clubs: "csv_clubs",
  posts: "csv_posts",
  events: "csv_events",
  gigs: "csv_gigs",
};

function csvEscape(value: string | number | boolean | null | undefined) {
  let s = value == null ? "" : String(value);
  if (/^[=\-+@]/.test(s)) s = `'${s}`;
  if (/[",\n]/.test(s)) s = `"${s.replace(/"/g, '""')}"`;
  return s;
}

export async function GET(req: NextRequest, { params }: { params: { type: string } }) {
  const type = params.type;
  const action = typeToAction[type];
  if (!action) {
    return NextResponse.json({ error: "Invalid export type" }, { status: 400 });
  }

  const admin = await requireAdminPermission("export", action);
  if (admin instanceof NextResponse) return admin;

  let csv = "";

  if (type === "users") {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        fullName: true,
        email: true,
        phoneNumber: true,
        collegeName: true,
        role: true,
        approvalStatus: true,
        suspended: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
    });
    csv =
      "ID,Name,Email,Phone,College,Role,Status,Suspended,Created\n" +
      users
        .map(
          (u) =>
            [
              csvEscape(u.id),
              csvEscape(u.fullName),
              csvEscape(u.email),
              csvEscape(u.phoneNumber),
              csvEscape(u.collegeName),
              csvEscape(u.role),
              csvEscape(u.approvalStatus),
              csvEscape(u.suspended),
              csvEscape(u.createdAt.toISOString()),
            ].join(","),
        )
        .join("\n");
  } else if (type === "clubs") {
    const clubs = await prisma.club.findMany({
      include: { header: { select: { fullName: true } }, _count: { select: { members: true, posts: true } } },
      orderBy: { createdAt: "desc" },
    });
    csv =
      "ID,Name,Slug,Header,Members,Posts,Created\n" +
      clubs
        .map(
          (c) =>
            [
              csvEscape(c.id),
              csvEscape(c.name),
              csvEscape(c.slug),
              csvEscape(c.header?.fullName || "None"),
              csvEscape(c._count.members),
              csvEscape(c._count.posts),
              csvEscape(c.createdAt.toISOString()),
            ].join(","),
        )
        .join("\n");
  } else if (type === "posts") {
    const posts = await prisma.post.findMany({
      select: {
        id: true,
        caption: true,
        content: true,
        likesCount: true,
        hidden: true,
        createdAt: true,
        club: { select: { name: true } },
        user: { select: { fullName: true } },
      },
      orderBy: { createdAt: "desc" },
    });
    csv =
      "ID,Caption,Club,Author,Likes,Hidden,Created\n" +
      posts
        .map(
          (p) =>
            [
              csvEscape(p.id),
              csvEscape((p.caption || "").slice(0, 100)),
              csvEscape(p.club.name),
              csvEscape(p.user.fullName),
              csvEscape(p.likesCount),
              csvEscape(p.hidden),
              csvEscape(p.createdAt.toISOString()),
            ].join(","),
        )
        .join("\n");
  } else if (type === "events") {
    const events = await prisma.event.findMany({
      include: { club: { select: { name: true } }, _count: { select: { registrations: true } } },
      orderBy: { date: "desc" },
    });
    csv =
      "ID,Title,Club,Venue,Date,Price,Registrations\n" +
      events
        .map(
          (e) =>
            [
              csvEscape(e.id),
              csvEscape(e.title),
              csvEscape(e.club.name),
              csvEscape(e.venue),
              csvEscape(e.date.toISOString()),
              csvEscape(e.price),
              csvEscape(e._count.registrations),
            ].join(","),
        )
        .join("\n");
  } else if (type === "gigs") {
    const gigs = await prisma.gig.findMany({
      include: { club: { select: { name: true } }, _count: { select: { applications: true } } },
      orderBy: { createdAt: "desc" },
    });
    csv =
      "ID,Title,Club,PayMin,PayMax,Applications,Created\n" +
      gigs
        .map(
          (g) =>
            [
              csvEscape(g.id),
              csvEscape(g.title),
              csvEscape(g.club?.name || "None"),
              csvEscape(g.payMin),
              csvEscape(g.payMax),
              csvEscape(g._count.applications),
              csvEscape(g.createdAt.toISOString()),
            ].join(","),
        )
        .join("\n");
  }

  await logAudit({
    adminId: admin.id,
    adminEmail: admin.email,
    action: "EXPORT_CSV",
    entity: "settings",
    details: { type },
  });

  return new NextResponse(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": `attachment; filename="occ-${type}-export-${new Date().toISOString().split("T")[0]}.csv"`,
    },
  });
}
