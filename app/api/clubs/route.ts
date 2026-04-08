import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { serverCache } from "@/lib/server-cache";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const query = searchParams.get("q") || "";

  if (!process.env.DATABASE_URL) {
    return NextResponse.json({ clubs: [] });
  }

  const cacheKey = `clubs:list:${query}`;
  const clubs = await serverCache.getOrSet(cacheKey, 30_000, () =>
    prisma.club.findMany({
      where: {
        OR: [
          { name: { contains: query, mode: 'insensitive' } },
          { description: { contains: query, mode: 'insensitive' } }
        ]
      },
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
      orderBy: { createdAt: "asc" },
    }),
  );

  return NextResponse.json(
    { clubs },
    {
      headers: {
        "Cache-Control": "public, s-maxage=30, stale-while-revalidate=60",
      },
    },
  );
}
