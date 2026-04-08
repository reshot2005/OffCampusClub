import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { displayPostLikes } from "@/lib/socialDisplay";

const MAX_LIMIT = 50;
const DEFAULT_LIMIT = 30;

/** Realtime search for Explore: club header posts, keyword matches caption, content, club name/slug (e.g. “bikers”). */
export async function GET(req: NextRequest) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const q = (req.nextUrl.searchParams.get("q") || "").trim();
  const cursor = (req.nextUrl.searchParams.get("cursor") || "").trim() || undefined;
  const limitRaw = Number(req.nextUrl.searchParams.get("limit"));
  const limit = Number.isFinite(limitRaw)
    ? Math.min(MAX_LIMIT, Math.max(1, Math.floor(limitRaw)))
    : DEFAULT_LIMIT;

  const baseWhere = {
    hidden: false,
    user: { role: "CLUB_HEADER" as const },
    ...(q
      ? {
          OR: [
            { caption: { contains: q, mode: "insensitive" as const } },
            { content: { contains: q, mode: "insensitive" as const } },
            { club: { name: { contains: q, mode: "insensitive" as const } } },
            { club: { slug: { contains: q, mode: "insensitive" as const } } },
          ],
        }
      : {}),
  };

  const rows = await prisma.post.findMany({
    where: baseWhere,
    take: limit + 1,
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      userId: true,
      clubId: true,
      caption: true,
      content: true,
      imageUrl: true,
      likesCount: true,
      likes: true,
      sharesCount: true,
      _count: {
        select: { comments: true },
      },
      createdAt: true,
      user: {
        select: { id: true, fullName: true, avatar: true, role: true },
      },
      club: {
        select: { id: true, name: true, slug: true, icon: true, coverImage: true },
      },
    },
  });

  const hasMore = rows.length > limit;
  const page = hasMore ? rows.slice(0, limit) : rows;
  const nextCursor = hasMore ? page[page.length - 1]?.id ?? null : null;

  const payload = {
    posts: page.map((p) => ({
      id: p.id,
      userId: p.userId,
      clubId: p.clubId,
      caption: p.caption,
      content: p.content,
      imageUrl: p.imageUrl,
      likesCount: displayPostLikes(p.id, p.likesCount ?? p.likes ?? 0),
      sharesCount: p.sharesCount ?? 0,
      commentsCount: p._count.comments ?? 0,
      createdAt: p.createdAt.toISOString(),
      user: {
        id: p.user.id,
        fullName: p.user.fullName,
        avatar: p.user.avatar,
        role: p.user.role,
      },
      club: p.club
        ? { id: p.club.id, name: p.club.name, slug: p.club.slug, icon: p.club.icon, coverImage: p.club.coverImage }
        : null,
    })),
    nextCursor,
  };

  return NextResponse.json(payload, {
    headers: {
      // Authenticated feed: private cache only (avoid shared-cache cross-user leakage).
      "Cache-Control": "private, max-age=15, stale-while-revalidate=60",
    },
  });
}
