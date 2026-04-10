import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { displayClubMembers, displayPostLikes, formatSocialCount } from "@/lib/socialDisplay";

const MAX_LIMIT = 50;
const DEFAULT_LIMIT = 30;

type FeedFilter = "for-you" | "following" | "all-clubs";

function parseFilter(raw: string | null): FeedFilter {
  if (raw === "following" || raw === "all-clubs") return raw;
  return "for-you";
}

function isMissingHiddenColumnError(error: unknown): boolean {
  if (!(error instanceof Prisma.PrismaClientKnownRequestError)) return false;
  if (error.code !== "P2022") return false;
  const missingColumn = String(error.meta?.column || "");
  return missingColumn.includes("hidden");
}

export async function GET(req: NextRequest) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const filter = parseFilter(req.nextUrl.searchParams.get("filter"));
  const limitRaw = Number(req.nextUrl.searchParams.get("limit"));
  const limit = Number.isFinite(limitRaw)
    ? Math.min(MAX_LIMIT, Math.max(1, Math.floor(limitRaw)))
    : DEFAULT_LIMIT;

  const memberships = await prisma.clubMembership.findMany({
    where: { userId: user.id },
    select: { clubId: true },
  });
  const followingClubIds = memberships.map((m) => m.clubId);

  if (filter === "following" && followingClubIds.length === 0) {
    return NextResponse.json(
      {
        filter,
        followingClubIds,
        posts: [],
      },
      {
        headers: {
          "Cache-Control": "private, no-cache, no-store, must-revalidate",
        },
      },
    );
  }

  const select = {
    id: true,
    userId: true,
    clubId: true,
    caption: true,
    content: true,
    imageUrl: true,
    imageUrls: true,
    likesCount: true,
    likes: true,
    sharesCount: true,
    _count: {
      select: { comments: true },
    },
    createdAt: true,
    user: {
      select: { id: true, fullName: true, avatar: true },
    },
    club: {
      select: {
        id: true,
        name: true,
        memberCount: true,
        memberDisplayBase: true,
      },
    },
  } as const;

  const whereWithHidden =
    filter === "following"
      ? { hidden: false, clubId: { in: followingClubIds } }
      : filter === "all-clubs"
        ? { hidden: false }
        : {
            hidden: false,
            OR: [{ user: { role: "CLUB_HEADER" as const } }, { imageUrl: { not: "" } }],
          };

  const whereWithoutHidden =
    filter === "following"
      ? { clubId: { in: followingClubIds } }
      : filter === "all-clubs"
        ? {}
        : { OR: [{ user: { role: "CLUB_HEADER" as const } }, { imageUrl: { not: "" } }] };

  let rows: Array<Prisma.PostGetPayload<{ select: typeof select }>>;
  try {
    rows = await prisma.post.findMany({
      where: whereWithHidden,
      take: limit,
      orderBy: { createdAt: "desc" },
      select,
    });
  } catch (error) {
    if (!isMissingHiddenColumnError(error)) throw error;
    rows = await prisma.post.findMany({
      where: whereWithoutHidden,
      take: limit,
      orderBy: { createdAt: "desc" },
      select,
    });
  }

  const posts = rows.map((p) => {
    const memberCountRaw = p.club
      ? displayClubMembers(p.club.id, p.club.memberCount ?? 0, p.club.memberDisplayBase)
      : 0;
    return {
      id: p.id,
      userId: p.userId,
      clubId: p.clubId,
      caption: p.caption,
      content: p.content,
      imageUrl: p.imageUrl,
      imageUrls: p.imageUrls,
      likesCount: displayPostLikes(p.id, p.likesCount ?? p.likes ?? 0),
      sharesCount: p.sharesCount ?? 0,
      commentsCount: p._count.comments ?? 0,
      createdAt: p.createdAt.toISOString(),
      user: {
        id: p.user.id,
        fullName: p.user.fullName,
        avatar: p.user.avatar,
      },
      club: p.club
        ? {
            id: p.club.id,
            name: p.club.name,
            clubMembersLabel: `${formatSocialCount(memberCountRaw)} Members`,
          }
        : null,
    };
  });

  return NextResponse.json(
    {
      filter,
      followingClubIds,
      posts,
    },
    {
      headers: {
        "Cache-Control": "private, no-cache, no-store, must-revalidate",
      },
    },
  );
}
