import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { pusherServer } from "@/lib/pusher";

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const comment = await prisma.comment.findUnique({
    where: { id: params.id },
    include: { post: { include: { club: true } } }
  });

  if (!comment) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const isAuthor = comment.userId === user.id;

  // Strict policy: only the original author can delete their own comment.
  if (!isAuthor) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const postId = comment.postId;
  const clubId = comment.post.clubId;
  await prisma.comment.delete({ where: { id: params.id } });
  const commentsCount = await prisma.comment.count({
    where: { postId },
  });
  await pusherServer.trigger(`club-${clubId}`, "comment-deleted", {
    postId,
    commentId: comment.id,
    commentsCount,
  });
  
  return NextResponse.json({ success: true, message: "Comment deleted" });
}

// REPORT
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const reason = typeof body.reason === "string" ? body.reason.trim() : "General Report";

  const report = await prisma.commentReport.create({
    data: {
      commentId: params.id,
      reporterId: user.id,
      reason
    },
    include: {
      comment: {
        include: {
          post: { include: { club: true } },
          user: { select: { fullName: true } },
        },
      },
      reporter: { select: { fullName: true } },
    },
  });

  const clubName = report.comment.post.club?.name || "Unknown Club";
  const reporterName = report.reporter.fullName || "A user";
  const commentAuthor = report.comment.user.fullName || "Unknown user";
  await pusherServer.trigger("admin-global", "intel-report", {
    reportId: report.id,
    commentId: report.commentId,
    title: "Intel report received",
    message: `${reporterName} flagged a comment in ${clubName}: "${reason}"`,
    details: {
      reporterName,
      commentAuthor,
      clubName,
      reason,
      commentPreview: report.comment.content.slice(0, 120),
    },
    createdAt: new Date().toISOString(),
  });

  return NextResponse.json({ success: true, message: "Report submitted to admin" });
}
