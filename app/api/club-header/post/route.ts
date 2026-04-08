import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { postCreateSchema } from "@/lib/validations";
import { pusherServer } from "@/lib/pusher";

export async function POST(req: NextRequest) {
  const user = await getSessionUser();
  if (!user || user.role !== "CLUB_HEADER" || user.approvalStatus !== "APPROVED") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const parsed = postCreateSchema.parse(body);
  const managedClubId = user.clubManaged?.id ?? null;
  if (!managedClubId) {
    return NextResponse.json({ error: "No club assigned" }, { status: 400 });
  }
  if (parsed.clubId !== managedClubId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const clubId = managedClubId;

  const post = await prisma.post.create({
    data: {
      userId: user.id,
      clubId,
      imageUrl: parsed.imageUrl,
      imageUrls: parsed.imageUrls || [],
      caption: parsed.caption,
      content: parsed.content,
      type: parsed.type || "post",
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

  await pusherServer.trigger(`club-${clubId}`, "new-post", { post });
  return NextResponse.json({ success: true, post }, { status: 201 });
}
