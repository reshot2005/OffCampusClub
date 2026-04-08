import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(_req: NextRequest, { params }: { params: { slug: string } }) {
  const club = await prisma.club.findUnique({
    where: { slug: params.slug },
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
      events: {
        select: {
          id: true,
          title: true,
          description: true,
          date: true,
          venue: true,
          price: true,
          imageUrl: true,
          maxCapacity: true,
          createdAt: true,
        },
      },
      posts: {
        where: { hidden: false },
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
          createdAt: true,
        },
        orderBy: { createdAt: "desc" },
      },
      members: {
        select: {
          id: true,
          userId: true,
          clubId: true,
          joinedAt: true,
          role: true,
        },
      },
    },
  });

  if (!club) {
    return NextResponse.json({ error: "Club not found" }, { status: 404 });
  }

  return NextResponse.json({ club });
}
