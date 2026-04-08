import { NextRequest, NextResponse } from "next/server";
import { requireAdminPermission } from "@/lib/admin-api-guard";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const admin = await requireAdminPermission("posts", "read");
  if (admin instanceof NextResponse) return admin;

  const clubId = req.nextUrl.searchParams.get("clubId");
  const take = Math.min(Number(req.nextUrl.searchParams.get("take") || 50), 100);

  const posts = await prisma.post.findMany({
    where: {
      ...(clubId ? { clubId } : {}),
    },
    include: {
      user: { select: { id: true, fullName: true, email: true } },
      club: { select: { id: true, name: true, slug: true } },
      _count: { select: { comments: true, postLikes: true } },
    },
    orderBy: [{ pinned: "desc" }, { createdAt: "desc" }],
    take,
  });

  return NextResponse.json({ posts });
}
