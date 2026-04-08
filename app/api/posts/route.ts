import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { postCreateSchema } from "@/lib/validations";
import { isPusherServerConfigured, pusherServer } from "@/lib/pusher";
import { serverCache } from "@/lib/server-cache";

export async function GET(req: NextRequest) {
  const clubId = req.nextUrl.searchParams.get("clubId");
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const scopedClubId = clubId || user?.clubManaged?.id || user?.memberships?.[0]?.clubId;
  const isAdmin = user?.role === "ADMIN";

  const posts = await prisma.post.findMany({
    where: {
      ...(scopedClubId ? { clubId: scopedClubId } : {}),
      ...(!isAdmin ? { hidden: false } : {}),
    },
    select: {
      id: true,
      userId: true,
      clubId: true,
      imageUrl: true,
      imageUrls: true,
      caption: true,
      content: true,
      likes: true,
      likesCount: true,
      sharesCount: true,
      type: true,
      hidden: true,
      createdAt: true,
      club: {
        select: {
          id: true,
          slug: true,
          name: true,
          icon: true,
          description: true,
          theme: true,
          coverImage: true,
          memberCount: true,
          createdAt: true,
        },
      },
      user: {
        select: {
          id: true,
          fullName: true,
          avatar: true,
          role: true,
          approvalStatus: true,
          suspended: true,
          createdAt: true,
        },
      },
      comments: {
        select: {
          id: true,
          postId: true,
          userId: true,
          content: true,
          createdAt: true,
        },
      },
      postLikes: {
        select: {
          id: true,
          postId: true,
          userId: true,
          createdAt: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  // Posts are user-scoped — never cache publicly
  return NextResponse.json(
    { posts },
    {
      headers: {
        "Cache-Control": "private, no-cache, no-store, must-revalidate",
      },
    },
  );
}

export async function POST(req: NextRequest) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (user.role !== "CLUB_HEADER" || user.approvalStatus !== "APPROVED") {
    return NextResponse.json({ error: "Only approved club headers can post" }, { status: 403 });
  }

  const body = await req.json();
  const parsed = postCreateSchema.parse(body);
  const { clubId, imageUrls, caption, content, type } = parsed;
  const imageUrl =
    typeof parsed.imageUrl === "string" && parsed.imageUrl.trim().length > 0
      ? parsed.imageUrl.trim()
      : null;

  const resolvedClubId = user.clubManaged?.id || clubId;
  if (!resolvedClubId) return NextResponse.json({ error: "No club selected" }, { status: 400 });

  const clubRow = await prisma.club.findUnique({ where: { id: resolvedClubId } });
  if (clubRow?.postingFrozen) {
    return NextResponse.json({ error: "Posting is frozen for this club" }, { status: 403 });
  }

  const post = await prisma.post.create({
    data: {
      userId: user.id,
      clubId: resolvedClubId,
      imageUrl,
      imageUrls: imageUrls || [],
      caption,
      content,
      type: type || "post",
    },
    select: {
      id: true,
      userId: true,
      clubId: true,
      imageUrl: true,
      imageUrls: true,
      caption: true,
      content: true,
      likes: true,
      likesCount: true,
      sharesCount: true,
      type: true,
      hidden: true,
      createdAt: true,
      user: {
        select: {
          id: true,
          fullName: true,
          avatar: true,
          role: true,
          approvalStatus: true,
          suspended: true,
          createdAt: true,
        },
      },
      club: {
        select: {
          id: true,
          slug: true,
          name: true,
          icon: true,
          description: true,
          theme: true,
          coverImage: true,
          memberCount: true,
          createdAt: true,
        },
      },
    },
  });

  if (isPusherServerConfigured()) {
    try {
      await pusherServer.trigger(`club-${resolvedClubId}`, "new-post", { post });
    } catch (e) {
      console.warn("[posts] Pusher failed (non-critical):", e);
    }
  }

  // Invalidate caches so subsequent reads show fresh data immediately
  serverCache.invalidatePrefix("clubs:");

  return NextResponse.json({ success: true, post }, { status: 201 });
}
