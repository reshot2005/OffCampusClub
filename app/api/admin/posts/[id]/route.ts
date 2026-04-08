import { NextRequest, NextResponse } from "next/server";
import { requireAdminPermission } from "@/lib/admin-api-guard";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { pusherServer } from "@/lib/pusher";
import { removeStoredPostImage } from "@/lib/postImageCleanup";
import { postStoredImageUrlSchema } from "@/lib/validations";

const patchSchema = z.object({
  hidden: z.boolean().optional(),
  pinned: z.boolean().optional(),
  caption: z.string().max(2000).optional().nullable(),
  content: z.string().max(5000).optional().nullable(),
  imageUrl: z.union([postStoredImageUrlSchema, z.null()]).optional(),
  type: z.string().optional(),
});

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const admin = await requireAdminPermission("posts", "update");
  if (admin instanceof NextResponse) return admin;

  const parsed = patchSchema.parse(await req.json().catch(() => ({})));
  const existing = await prisma.post.findUnique({
    where: { id: params.id },
    select: { imageUrl: true, clubId: true },
  });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const nextImage =
    parsed.imageUrl === undefined ? undefined : parsed.imageUrl === "" ? null : parsed.imageUrl;
  if (nextImage !== undefined && existing.imageUrl && existing.imageUrl !== nextImage) {
    await removeStoredPostImage(existing.imageUrl);
  }

  const post = await prisma.post.update({
    where: { id: params.id },
    data: {
      ...(parsed.hidden !== undefined && { hidden: parsed.hidden }),
      ...(parsed.pinned !== undefined && { pinned: parsed.pinned }),
      ...(parsed.caption !== undefined && { caption: parsed.caption }),
      ...(parsed.content !== undefined && { content: parsed.content }),
      ...(nextImage !== undefined && { imageUrl: nextImage }),
      ...(parsed.type !== undefined && { type: parsed.type }),
    },
    select: { id: true, clubId: true, hidden: true },
  });

  await pusherServer.trigger(`club-${post.clubId}`, "post-updated", { postId: post.id, hidden: post.hidden });
  return NextResponse.json({ success: true, post });
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const admin = await requireAdminPermission("posts", "delete");
  if (admin instanceof NextResponse) return admin;

  const existing = await prisma.post.findUnique({
    where: { id: params.id },
    select: { clubId: true, imageUrl: true },
  });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await removeStoredPostImage(existing.imageUrl);
  await prisma.post.delete({ where: { id: params.id } });
  await pusherServer.trigger(`club-${existing.clubId}`, "post-deleted", { postId: params.id });
  return NextResponse.json({ success: true });
}
