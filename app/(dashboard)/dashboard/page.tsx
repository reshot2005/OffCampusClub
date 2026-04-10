import { requireUser } from "@/lib/auth";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { gigWhereNotLegacyDummy } from "@/lib/legacyDummyGigs";
import {
  OCC_PREMIUM_CLUB_IMAGES,
  resolvePostImageUrlForFeed,
  resolveClubAvatar,
} from "@/lib/postImageUrl";
import { displayClubMembers, displayPostLikes, formatSocialCount } from "@/lib/socialDisplay";
import { OCCTrendingClubs } from "@/components/occ-dashboard/OCCStoriesRow";
import { OCCRightRail } from "@/components/occ-dashboard/OCCRightRail";
import { RealtimeFeedTabs } from "@/components/dashboard/RealtimeFeedTabs";

function getTimeAgo(date: Date): string {
  const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d`;
  const weeks = Math.floor(days / 7);
  return `${weeks}w`;
}

export default async function DashboardPage() {
  const user = await requireUser();

  let clubs: Awaited<ReturnType<typeof prisma.club.findMany>> = [];
  let events: Array<
    Prisma.EventGetPayload<{
      include: { club: true };
    }>
  > = [];
  let posts: Array<
    Prisma.PostGetPayload<{
      include: { user: true; club: true; _count: { select: { comments: true } } };
    }>
  > = [];
  let gigs: Awaited<ReturnType<typeof prisma.gig.findMany>> = [];
  let memberships: Array<{ clubId: string }> = [];

  try {
    [clubs, events, posts, gigs, memberships] = await Promise.all([
      prisma.club.findMany({ take: 8, orderBy: { createdAt: "asc" } }),
      prisma.event.findMany({ take: 3, include: { club: true }, orderBy: { date: "asc" } }),
      // FILTER: Only show posts from users who are CLUB_HEADER or have a valid imageUrl
      prisma.post.findMany({
        where: {
          OR: [{ user: { role: "CLUB_HEADER" } }, { imageUrl: { not: "" } }],
        },
        take: 6,
        include: { user: true, club: true, _count: { select: { comments: true } } },
        orderBy: { createdAt: "desc" },
      }),
      prisma.gig.findMany({
        where: { ...gigWhereNotLegacyDummy },
        take: 3,
        orderBy: { createdAt: "desc" },
      }),
      prisma.clubMembership.findMany({
        where: { userId: user.id },
        select: { clubId: true },
      }),
    ]);
  } catch (error) {
    console.error("[dashboard] data load failed:", error);
  }

  const gigIds = gigs.map((g) => g.id);
  let gigApplicationByGigId = new Map<string, string>();
  if (gigIds.length) {
    try {
      const myApps = await prisma.gigApplication.findMany({
        where: { userId: user.id, gigId: { in: gigIds } },
        select: { gigId: true, status: true },
      });
      gigApplicationByGigId = new Map(myApps.map((a) => [a.gigId, a.status]));
    } catch (e) {
      console.error("[dashboard] gig applications load failed:", e);
    }
  }

  const joinedClubIds = new Set(memberships.map(m => m.clubId));

  const trendingClubs = (clubs.length ? clubs : []).map(c => {
    return {
      id: c.id,
      slug: c.slug,
      label: c.name,
      imageUrl: resolvePostImageUrlForFeed(c.coverImage, c.name),
      memberCount: formatSocialCount(
        displayClubMembers(c.id, c.memberCount || 0, c.memberDisplayBase),
      ),
      joined: joinedClubIds.has(c.id),
    };
  });

  const feedPosts = (posts.length
    ? posts.map((p) => {
        let postImg = resolvePostImageUrlForFeed(p.imageUrl, p.club?.name || "");
        const postImages =
          Array.isArray(p.imageUrls) && p.imageUrls.length > 0
            ? p.imageUrls.map((img) => resolvePostImageUrlForFeed(img, p.club?.name || ""))
            : [postImg];

        const avatar = resolveClubAvatar(p.user.avatar, p.club?.name || "OCC");
        const memberCountRaw = p.club
          ? displayClubMembers(p.club.id, p.club.memberCount || 0, p.club.memberDisplayBase)
          : 0;
        return {
          id: p.id,
          username: p.user.fullName,
          userAvatarUrl: avatar,
          timestamp: getTimeAgo(p.createdAt),
          caption: p.caption || "",
          content: p.content || "",
          imageUrl: postImg,
          imageUrls: postImages,
          likeCount: displayPostLikes(p.id, p.likesCount || p.likes || 0),
          sharesCount: p.sharesCount || 0,
          clubId: p.clubId,
          clubName: p.club?.name || "OCC Club",
          clubMembersLabel: `${formatSocialCount(memberCountRaw)} Members`,
          commentsCount: p._count.comments || 0,
        };
      })
    : []);

  return (
    <div className="flex flex-col lg:flex-row gap-5 lg:gap-6 xl:gap-8">
      <div className="flex-1 min-w-0 flex flex-col pt-2">
        
        {/* REFINED PREMIUM TRENDING CLUBS */}
        <OCCTrendingClubs clubs={trendingClubs} />

        <RealtimeFeedTabs initialPosts={feedPosts} currentUserId={user.id} />
      </div>

      <div className="hidden lg:block w-[min(260px,24vw)] xl:w-[280px] 2xl:w-[300px] shrink-0 space-y-8 xl:space-y-10 min-w-0">
        <OCCRightRail 
          currentUserId={user.id}
          events={events.map(e => {
             return {
              id: e.id,
              title: e.title,
              when: new Date(e.date).toLocaleString(undefined, { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }),
              club: e.club.name,
              imageUrl: resolvePostImageUrlForFeed(e.imageUrl, e.club.name),
             };
          })}
          trending={trendingClubs.map(c => ({
            id: c.id,
            slug: c.slug,
            name: c.label,
            members: c.memberCount,
            imageUrl: c.imageUrl,
            joined: c.joined,
          }))}
          opportunities={gigs.map(g => ({
            id: g.id,
            title: g.title,
            description: g.description,
            brand: "OCC ELITE",
            applicationStatus: gigApplicationByGigId.get(g.id) ?? null,
          }))}
        />
      </div>
    </div>
  );
}
