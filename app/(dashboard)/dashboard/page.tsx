import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  OCC_PREMIUM_CLUB_IMAGES,
  resolvePostImageUrlForFeed,
} from "@/lib/postImageUrl";
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

  const [clubs, events, posts, gigs] = await Promise.all([
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
      include: { user: true, club: true }, 
      orderBy: { createdAt: "desc" } 
    }),
    prisma.gig.findMany({ take: 3, orderBy: { createdAt: "desc" } }),
  ]);

  const trendingClubs = (clubs.length ? clubs : []).map(c => {
    let clubImg = resolvePostImageUrlForFeed(c.coverImage, c.name);
    if (c.name.includes("Biker")) clubImg = OCC_PREMIUM_CLUB_IMAGES.bikers;
    if (c.name.includes("Music")) clubImg = OCC_PREMIUM_CLUB_IMAGES.music;
    if (c.name.includes("Football")) clubImg = OCC_PREMIUM_CLUB_IMAGES.football;
    if (c.name.includes("Photography")) clubImg = OCC_PREMIUM_CLUB_IMAGES.photography;

    return {
      id: c.id,
      slug: c.slug,
      label: c.name,
      imageUrl: clubImg,
      memberCount: ((c.memberCount || 0) / 1000).toFixed(1) + "k",
    };
  });

  const feedPosts = (posts.length
    ? posts.map((p) => {
        const ago = getTimeAgo(p.createdAt);
        let postImg = resolvePostImageUrlForFeed(p.imageUrl, p.club?.name || "");

        return {
          id: p.id,
          username: p.user.fullName,
          userAvatarUrl: p.user.avatar || "https://i.pravatar.cc/150?u=" + p.user.id,
          timestamp: ago,
          caption: p.caption || p.content || "",
          imageUrl: postImg,
          likeCount: p.likesCount || p.likes || 0,
          sharesCount: p.sharesCount || 0,
          clubId: p.clubId,
          clubName: p.club?.name || "OCC Club",
          commentsCount: 0,
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
            <OCCPostCard key={p.id} post={p} />
          ))}
        </div>
      </div>

      <div className="hidden lg:block w-[min(260px,24vw)] xl:w-[280px] 2xl:w-[300px] shrink-0 space-y-8 xl:space-y-10 min-w-0">
        <OCCRightRail 
          events={events.map(e => {
             let evtImg = resolvePostImageUrlForFeed(e.imageUrl, e.club.name);
             const ecName = (e.club.name || "").toLowerCase();
             if (ecName.includes("biker")) evtImg = OCC_PREMIUM_CLUB_IMAGES.bikers;
             if (ecName.includes("photography")) evtImg = OCC_PREMIUM_CLUB_IMAGES.photography;
             return {
              id: e.id,
              title: e.title,
              when: new Date(e.date).toLocaleString(undefined, { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }),
              club: e.club.name,
              imageUrl: evtImg || "https://images.unsplash.com/photo-1485846234645-a62644f84728?w=200&q=80",
             };
          })}
          trending={trendingClubs.map(c => ({
            id: c.id,
            slug: c.slug,
            name: c.label,
            members: c.memberCount,
            imageUrl: c.imageUrl,
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
