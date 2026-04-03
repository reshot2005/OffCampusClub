import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { postCreateSchema } from "@/lib/validations";
import { isPusherServerConfigured, pusherServer } from "@/lib/pusher";
import { serverCache } from "@/lib/server-cache";

export async function GET(req: NextRequest) {
  const clubId = req.nextUrl.searchParams.get("clubId");
  const user = await getSessionUser();
  const scopedClubId = clubId || user?.clubManaged?.id || user?.memberships?.[0]?.clubId;
  const isAdmin = user?.role === "ADMIN";

  const posts = await prisma.post.findMany({
    where: {
      ...(scopedClubId ? { clubId: scopedClubId } : {}),
      ...(!isAdmin ? { hidden: false } : {}),
    },
    include: {
      club: true,
      user: true,
      comments: true,
      postLikes: true,
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
    include: { user: true, club: true },
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
