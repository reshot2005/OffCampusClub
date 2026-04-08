import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { pusherServer } from "@/lib/pusher";

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Get comments with user details
  const comments = await prisma.comment.findMany({
    where: { postId: params.id },
    include: {
      user: {
        select: {
          id: true,
          fullName: true,
          avatar: true,
          email: true, // Only for Admin/ClubHeader
          phoneNumber: true, // Only for Admin/ClubHeader
          role: true
        }
      }
    },
    orderBy: { createdAt: "asc" }
  });

  // Check if viewer is Admin or the Club Header of this post's club
  const post = await prisma.post.findUnique({
    where: { id: params.id },
    include: { club: true }
  });

  const isPrivileged = user.role === "ADMIN" || (user.role === "CLUB_HEADER" && post?.club.headerId === user.id);

  const sanitizedComments = comments.map(c => ({
    id: c.id,
    content: c.content,
    createdAt: c.createdAt,
    user: {
      id: c.user.id,
      fullName: c.user.fullName,
      avatar: c.user.avatar,
      // PRIVACY GATE: Name+Email+Phone only for privileged viewers
      email: isPrivileged ? c.user.email : null,
      phoneNumber: isPrivileged ? c.user.phoneNumber : null
    }
  }));

  return NextResponse.json(sanitizedComments);
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  
  const body = await req.json();
  const content = typeof body.content === "string" ? body.content.trim() : "";
  if (!content) return NextResponse.json({ error: "Content required" }, { status: 400 });

  const comment = await prisma.comment.create({
    data: { 
      postId: params.id, 
      userId: user.id, 
      content 
    },
    include: {
      user: {
        select: {
          id: true,
          fullName: true,
          avatar: true,
          email: true,
          phoneNumber: true
        }
      }
    }
  });

  const post = await prisma.post.findUnique({
    where: { id: params.id },
    include: { club: true }
  });
  const commentsCount = await prisma.comment.count({
    where: { postId: params.id },
  });

  if (pusherServer) {
    await pusherServer.trigger(`club-${post?.clubId}`, "new-comment", {
      postId: params.id,
      commentsCount,
      comment: {
        id: comment.id,
        content: comment.content,
        createdAt: comment.createdAt,
        user: {
          id: comment.user.id,
          fullName: comment.user.fullName,
          avatar: comment.user.avatar,
          // In real-time broadcast, we don't send private info unless it's a private channel,
          // but for simplicity here we'll let the client-side list re-fetch or filter.
          // Better: only send name/avatar in public broadcast.
        }
      }
    });
  }

  return NextResponse.json({ success: true, comment, commentsCount }, { status: 201 });
}
