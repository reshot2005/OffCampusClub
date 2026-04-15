import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { displayClubMembers } from "@/lib/socialDisplay";
import { pusherServer } from "@/lib/pusher";

export async function POST(_req: NextRequest, { params }: { params: { slug: string } }) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const club = await prisma.club.findUnique({
    where: { slug: params.slug },
  });

  if (!club) {
    return NextResponse.json({ error: "Club not found" }, { status: 404 });
  }

  // Find membership
  const membership = await prisma.clubMembership.findUnique({
    where: {
      userId_clubId: {
        userId: user.id,
        clubId: club.id,
      },
    },
  });

  // If already not a member
  if (!membership) {
    return NextResponse.json({ success: true, message: "Not a member" });
  }

  // Delete membership
  await prisma.clubMembership.delete({
    where: {
      userId_clubId: {
        userId: user.id,
        clubId: club.id,
      },
    },
  });

  // Update club memberCount
  const updatedClub = await prisma.club.update({
    where: { id: club.id },
    data: {
      memberCount: await prisma.clubMembership.count({
        where: { clubId: club.id },
      }),
    },
  });

  const displayMemberCount = displayClubMembers(
    club.id,
    updatedClub.memberCount,
    updatedClub.memberDisplayBase,
  );

  // Trigger pusher for UI update
  await pusherServer.trigger(`club-${club.id}`, "member-joined", {
    clubId: club.id,
    memberCount: updatedClub.memberCount,
    memberDisplayBase: updatedClub.memberDisplayBase,
    displayMemberCount,
  });

  // Track in ActivityEvent for admins
  await (prisma as any).activityEvent.create({
    data: {
      actorUserId: user.id,
      actorName: user.fullName || "Unknown User",
      actorRole: user.role || "STUDENT",
      eventType: "CLUB_UNJOIN",
      category: "COMMUNITY",
      entityType: "CLUB",
      entityId: club.id,
      summary: `${user.fullName} left the club ${club.name}`,
    } as any
  });

  return NextResponse.json({
    success: true,
    memberCount: updatedClub.memberCount,
    displayMemberCount,
  });
}
