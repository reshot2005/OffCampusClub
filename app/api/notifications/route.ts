import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const limit = Math.min(
    120,
    Math.max(1, Number(req.nextUrl.searchParams.get("limit")) || 80),
  );
  const notifications = await prisma.notification.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    take: limit,
  });
  return NextResponse.json({ notifications });
}

export async function PATCH(req: NextRequest) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json().catch(() => ({}));
  if (body.id && typeof body.id === "string") {
    await prisma.notification.updateMany({
      where: { userId: user.id, id: body.id },
      data: { read: true },
    });
    return NextResponse.json({ success: true });
  }
  if (body.markAllRead) {
    await prisma.notification.updateMany({
      where: { userId: user.id, read: false },
      data: { read: true },
    });
  }
  return NextResponse.json({ success: true });
}
