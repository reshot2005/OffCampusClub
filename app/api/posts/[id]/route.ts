import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { postUpdateSchema } from "@/lib/validations";
import { removeStoredPostImage } from "@/lib/postImageCleanup";
import { pusherServer } from "@/lib/pusher";
import { serverCache } from "@/lib/server-cache";

async function canEditPost(
  user: NonNullable<Awaited<ReturnType<typeof getSessionUser>>>,
  post: { userId: string; clubId: string },
) {
  if (user.role === "ADMIN") return true;
  if (user.role !== "CLUB_HEADER" || user.approvalStatus !== "APPROVED") return false;
  if (!user.clubManaged || user.clubManaged.id !== post.clubId) return false;
  return post.userId === user.id;
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const post = await prisma.post.findUnique({ where: { id: params.id } });
  if (!post) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (!(await canEditPost(user, post))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const raw = await req.json().catch(() => ({}));
  const parsed = postUpdateSchema.safeParse(raw);
  if (!parsed.success) {
    const first = parsed.error.flatten().fieldErrors;
    const msg =
      Object.entries(first)
        .map(([k, v]) => (Array.isArray(v) ? `${k}: ${v[0]}` : k))
        .join("; ") || "Invalid request body";
    return NextResponse.json({ error: msg, issues: parsed.error.flatten() }, { status: 400 });
  }
  const patch = parsed.data;

  const prevImage = post.imageUrl;
  const nextImage =
    patch.imageUrl === undefined ? undefined : patch.imageUrl === "" ? null : patch.imageUrl;

  const updated = await prisma.post.update({
    where: { id: params.id },
    data: {
      ...(patch.caption !== undefined && { caption: patch.caption }),
      ...(patch.content !== undefined && { content: patch.content }),
      ...(nextImage !== undefined && { imageUrl: nextImage }),
      ...(patch.type !== undefined && { type: patch.type }),
    },
    include: { user: true, club: true },
  });

  if (nextImage !== undefined && prevImage && prevImage !== nextImage) {
    await removeStoredPostImage(prevImage);
  }

  try {
    await pusherServer.trigger(`club-${post.clubId}`, "post-updated", { post: updated });
  } catch (e) {
    console.warn("[posts PATCH] pusher:", e);
  }
  serverCache.invalidatePrefix("clubs:");

  return NextResponse.json({ success: true, post: updated });
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const post = await prisma.post.findUnique({ where: { id: params.id } });
  if (!post) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (!(await canEditPost(user, post))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await removeStoredPostImage(post.imageUrl);
  await prisma.post.delete({ where: { id: params.id } });

  try {
    await pusherServer.trigger(`club-${post.clubId}`, "post-deleted", { postId: params.id });
  } catch (e) {
    console.warn("[posts DELETE] pusher:", e);
  }
  serverCache.invalidatePrefix("clubs:");

  return NextResponse.json({ success: true });
}
