import { NextRequest, NextResponse } from "next/server";
import { requireAdminPermission } from "@/lib/admin-api-guard";
import { prisma } from "@/lib/prisma";
import { clampActivityWindowDays, DEFAULT_ACTIVITY_WINDOW_DAYS } from "@/lib/activity-events";

export async function GET(req: NextRequest) {
  const admin = await requireAdminPermission("audit", "read");
  if (admin instanceof NextResponse) return admin;

  const sp = req.nextUrl.searchParams;
  const category = sp.get("category")?.trim() || "";
  const actorRole = sp.get("actorRole")?.trim() || "";
  const eventType = sp.get("eventType")?.trim() || "";
  const search = sp.get("q")?.trim() || "";
  const days = clampActivityWindowDays(
    Number(sp.get("days") || String(DEFAULT_ACTIVITY_WINDOW_DAYS)),
  );
  const take = Math.max(10, Math.min(100, Number(sp.get("take") || "30")));
  const cursor = sp.get("cursor")?.trim() || "";

  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  const where = {
    createdAt: { gte: since },
    ...(category ? { category } : {}),
    ...(actorRole ? { actorRole } : {}),
    ...(eventType ? { eventType } : {}),
    ...(search
      ? {
          OR: [
            { actorName: { contains: search, mode: "insensitive" as const } },
            { summary: { contains: search, mode: "insensitive" as const } },
            { entityType: { contains: search, mode: "insensitive" as const } },
          ],
        }
      : {}),
  };

  const rows = await (prisma as any).activityEvent.findMany({
    where,
    take: take + 1,
    orderBy: { createdAt: "desc" },
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
  });

  const hasMore = rows.length > take;
  const items = hasMore ? rows.slice(0, take) : rows;
  const nextCursor = hasMore ? items[items.length - 1]?.id ?? null : null;

  return NextResponse.json({
    items: items.map((r) => ({
      ...r,
      createdAt: r.createdAt.toISOString(),
    })),
    pagination: { hasMore, nextCursor },
  });
}

