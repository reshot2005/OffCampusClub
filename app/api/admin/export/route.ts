import { NextRequest, NextResponse } from "next/server";
import { requireAdminPermission } from "@/lib/admin-api-guard";
import { prisma } from "@/lib/prisma";
import type { AdminAction } from "@/lib/admin-permissions";

function csvEscape(s: string | number | boolean | null | undefined) {
  let v = s == null ? "" : String(s);
  if (/^[=\-+@]/.test(v)) v = `'${v}`;
  if (/[",\n]/.test(v)) return `"${v.replace(/"/g, '""')}"`;
  return v;
}

export async function GET(req: NextRequest) {
  const type = req.nextUrl.searchParams.get("type") || "summary";
  const typeToAction: Record<string, AdminAction> = {
    users: "csv_users",
    posts: "csv_posts",
    clubs: "csv_clubs",
    events: "csv_events",
    gigs: "csv_gigs",
  };
  const admin =
    typeToAction[type]
      ? await requireAdminPermission("export", typeToAction[type])
      : await requireAdminPermission("analytics", "read");
  if (admin instanceof NextResponse) return admin;

  if (type === "users") {
    const users = await prisma.user.findMany({
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        fullName: true,
        email: true,
        role: true,
        approvalStatus: true,
        suspended: true,
        createdAt: true,
        collegeName: true,
        referralCode: true,
      },
      take: 2000,
    });
    const header = ["id", "fullName", "email", "role", "approvalStatus", "suspended", "createdAt", "collegeName", "referralCode"];
    const lines = [
      header.join(","),
      ...users.map((u) =>
        [
          csvEscape(u.id),
          csvEscape(u.fullName),
          csvEscape(u.email),
          csvEscape(u.role),
          csvEscape(u.approvalStatus),
          csvEscape(u.suspended),
          csvEscape(u.createdAt.toISOString()),
          csvEscape(u.collegeName),
          csvEscape(u.referralCode),
        ].join(","),
      ),
    ];
    return new NextResponse(lines.join("\n"), {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": 'attachment; filename="occ-users-export.csv"',
      },
    });
  }

  if (type === "posts") {
    const posts = await prisma.post.findMany({
      orderBy: { createdAt: "desc" },
      take: 2000,
      include: {
        user: { select: { email: true, fullName: true } },
        club: { select: { slug: true, name: true } },
      },
    });
    const header = ["id", "createdAt", "type", "hidden", "pinned", "club", "author", "preview"];
    const lines = [
      header.join(","),
      ...posts.map((p) => {
        const preview = (p.content || p.caption || "").slice(0, 120).replace(/\s+/g, " ");
        return [
          csvEscape(p.id),
          csvEscape(p.createdAt.toISOString()),
          csvEscape(p.type),
          csvEscape(p.hidden),
          csvEscape(p.pinned),
          csvEscape(p.club.slug),
          csvEscape(p.user.email),
          csvEscape(preview),
        ].join(",");
      }),
    ];
    return new NextResponse(lines.join("\n"), {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": 'attachment; filename="occ-posts-export.csv"',
      },
    });
  }

  const [users, clubs, posts, memberships, events, referrals, pending] = await Promise.all([
    prisma.user.count(),
    prisma.club.count(),
    prisma.post.count(),
    prisma.clubMembership.count(),
    prisma.eventRegistration.count(),
    prisma.referralStat.count(),
    prisma.user.count({ where: { role: "CLUB_HEADER", approvalStatus: "PENDING" } }),
  ]);

  const lines = [
    "metric,value",
    `users,${users}`,
    `clubs,${clubs}`,
    `posts,${posts}`,
    `memberships,${memberships}`,
    `eventRegistrations,${events}`,
    `referrals,${referrals}`,
    `pendingHeaderApprovals,${pending}`,
    `exportedAt,${new Date().toISOString()}`,
  ];
  return new NextResponse(lines.join("\n"), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="occ-analytics-summary.csv"',
    },
  });
}
