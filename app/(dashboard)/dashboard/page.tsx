import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { gigWhereNotLegacyDummy } from "@/lib/legacyDummyGigs";
import {
  OCC_PREMIUM_CLUB_IMAGES,
  resolvePostImageUrlForFeed,
  resolveClubAvatar,
} from "@/lib/postImageUrl";
import { displayClubMembers, displayPostLikes, formatSocialCount } from "@/lib/socialDisplay";
import { OCCTrendingClubs } from "@/components/occ-dashboard/OCCStoriesRow";
import { OCCPostCard } from "@/components/occ-dashboard/OCCPostCard";
import { OCCRightRail } from "@/components/occ-dashboard/OCCRightRail";
import { SlidersHorizontal } from "lucide-react";

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

  const [clubs, events, posts, gigs, memberships] = await Promise.all([
    prisma.club.findMany({ take: 8, orderBy: { createdAt: "asc" } }),
    prisma.event.findMany({ take: 3, include: { club: true }, orderBy: { date: "asc" } }),
    // FILTER: Only show posts from users who are CLUB_HEADER or have a valid imageUrl
    prisma.post.findMany({ 
      where: {
        OR: [
          { user: { role: 'CLUB_HEADER' } },
          { imageUrl: { not: "" } }
        ]
      },
      take: 6, 
      include: { user: true, club: true, _count: { select: { comments: true } } }, 
      orderBy: { createdAt: "desc" } 
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

  const joinedClubIds = new Set(memberships.map(m => m.clubId));

  const trendingClubs = (clubs.length ? clubs : []).map(c => {
    return {
      id: c.id,
      slug: c.slug,
      label: c.name,
      imageUrl: resolvePostImageUrlForFeed(c.coverImage, c.name),
      memberCount: formatSocialCount(displayClubMembers(c.id, c.memberCount || 0)),
      joined: joinedClubIds.has(c.id),
    };
  });

  const feedPosts = (posts.length
    ? posts.map((p) => {
        const ago = getTimeAgo(p.createdAt);
        let postImg = resolvePostImageUrlForFeed(p.imageUrl, p.club?.name || "");

        const avatar = resolveClubAvatar(p.user.avatar, p.club?.name || "OCC");
        return {
          id: p.id,
          username: p.user.fullName,
          userAvatarUrl: avatar,
          timestamp: ago,
          caption: p.caption || p.content || "",
          imageUrl: postImg,
          likeCount: displayPostLikes(p.id, p.likesCount || p.likes || 0),
          sharesCount: p.sharesCount || 0,
          clubId: p.clubId,
          clubName: p.club?.name || "OCC Club",
          commentsCount: p._count.comments || 0,
        };
      })
    : []);

  return (
    <div className="flex flex-col lg:flex-row gap-5 lg:gap-6 xl:gap-8">
      <div className="flex-1 min-w-0 flex flex-col pt-2">
        
        {/* REFINED PREMIUM TRENDING CLUBS */}
        <OCCTrendingClubs clubs={trendingClubs} />

        <div className="flex items-center justify-between mb-6 sm:mb-8 pb-3 sm:pb-4 border-b border-black/5 mt-2 sm:mt-4 gap-4 px-4 sm:px-0">
          <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide pb-1 lg:pb-0">
            {["For You", "Following", "All Clubs"].map((tab, i) => (
              <button 
                key={tab} 
                className={`px-4 sm:px-5 py-2 sm:py-2.5 rounded-xl text-[11px] sm:text-[13px] font-medium tracking-wide uppercase transition-all shrink-0 ${
                  i === 0 
                    ? "bg-black text-white shadow-xl shadow-black/10" 
                    : "text-black/30 hover:text-black/60 hover:bg-black/5"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
          
          <button className="flex items-center gap-2 px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl border border-black/5 bg-white text-[10px] sm:text-[12px] font-medium uppercase tracking-widest text-black/60 hover:bg-black/5 transition-all shadow-sm shrink-0">
            <SlidersHorizontal className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            <span className="hidden xs:inline">Latest</span>
          </button>
        </div>


        <div className="flex flex-col gap-6">
          {feedPosts.map((p) => (
            <OCCPostCard key={p.id} post={p} currentUserId={user.id} />
          ))}
        </div>
      </div>

      <div className="hidden lg:block w-[min(260px,24vw)] xl:w-[280px] 2xl:w-[300px] shrink-0 space-y-8 xl:space-y-10 min-w-0">
        <OCCRightRail 
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
          }))}
        />
      </div>
    </div>
  );
}
