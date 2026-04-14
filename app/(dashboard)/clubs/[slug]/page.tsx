import { notFound } from "next/navigation";
import Link from "next/link";
import { ClubTabs } from "@/components/dashboard/ClubTabs";
import { JoinClubButton } from "@/components/dashboard/JoinClubButton";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { gigWhereNotLegacyDummy } from "@/lib/legacyDummyGigs";
import { displayClubMembers, displayPostLikes, formatSocialCount } from "@/lib/socialDisplay";
import { resolveClubAvatar, resolvePostImageUrlForFeed, premiumClubImageForName } from "@/lib/postImageUrl";
import { clubHeroAvatarUrls } from "@/lib/clubHeroAvatars";
import { ClubHeroMemberStack } from "@/components/dashboard/ClubHeroMemberStack";
import { ClubWelcomeMessage } from "@/components/dashboard/ClubWelcomeMessage";

function getTimeAgo(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
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

const CINEMATIC_SLUGS: Record<string, { route: string; label: string; gradient: string }> = {
  bikers:      { route: "/bikers",      label: "Bikers Ride",    gradient: "from-amber-900/40 via-[#0C0C0A] to-orange-950/30" },
  sports:      { route: "/football",    label: "Sports & Football",  gradient: "from-green-900/40 via-[#060606] to-emerald-950/30" },
  photography: { route: "/photography", label: "Photography",    gradient: "from-yellow-900/30 via-[#0a0a0a] to-amber-950/20" },
  fashion:     { route: "/fashion",     label: "Fashion Club",   gradient: "from-indigo-900/30 via-[#050505] to-purple-950/20" },
};

export default async function ClubDetailPage({
  params,
}: {
  params: { slug: string };
}) {
  const user = await requireUser();

  const club = await prisma.club.findFirst({
    where: { slug: params.slug },
    include: {
      header: {
        select: { id: true, avatar: true, role: true, clubManagedId: true, fullName: true },
      },
      members: {
        orderBy: { joinedAt: "desc" },
        take: 48,
        include: {
          user: {
            select: { id: true, avatar: true, role: true, clubManagedId: true, fullName: true },
          },
        },
      },
      events: {
        include: {
          club: true,
          registrations: {
            where: { userId: user.id },
            select: { id: true },
          },
        },
        orderBy: { date: "asc" },
      },
      posts: {
        include: {
          club: true,
          user: true,
          _count: { select: { comments: true } },
        },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!club) {
    notFound();
  }

  const joined = await prisma.clubMember.findUnique({
    where: {
      userId_clubId: {
        userId: user.id,
        clubId: club.id,
      },
    },
  }).then(Boolean);
  const gigs = await prisma.gig.findMany({
    where: {
      AND: [
        { ...gigWhereNotLegacyDummy },
        { clubId: club.id }, // Only club-specific gigs as requested
      ],
    },
    include: {
      applications: {
        where: { userId: user.id },
        select: { id: true },
      },
    },
    orderBy: { createdAt: "desc" },
    take: 8,
  });

  const clubMembersLabel = `${formatSocialCount(
    displayClubMembers(club.id, club.memberCount || club.members.length, club.memberDisplayBase),
  )} Members`;

  const heroAvatarUrls = clubHeroAvatarUrls(
    { id: club.id, name: club.name, header: club.header },
    club.members,
  );

  return (
    <div className="space-y-8 pb-10">
      <ClubWelcomeMessage clubName={club.name} />
      {CINEMATIC_SLUGS[club.slug] ? (
        <Link
          href={CINEMATIC_SLUGS[club.slug].route}
          className={`group flex items-center justify-between rounded-[24px] border border-black/5 bg-gradient-to-br from-indigo-50 to-white p-6 sm:p-8 transition-all hover:border-black/10 hover:scale-[1.005] shadow-sm`}
        >
          <div>
            <p className="text-[10px] uppercase tracking-[0.5em] text-[#5227FF] mb-2 font-bold">Scroll Cinema</p>
            <h3 className="text-xl sm:text-2xl text-slate-900 font-black tracking-tight">
              Experience {CINEMATIC_SLUGS[club.slug].label}
            </h3>
            <p className="mt-1 text-xs text-slate-400 font-medium">Full-screen scroll animation & cinematic intro</p>
          </div>
          <span className="text-[#5227FF] text-2xl transition-transform group-hover:translate-x-1">→</span>
        </Link>
      ) : null}

      {/* Hero Section */}
      <section className="relative overflow-hidden rounded-[2rem] sm:rounded-[3rem] border border-black/5 bg-white shadow-xl shadow-black/5">
        <div className="absolute inset-0 z-0">
          <img 
            src={club.coverImage || premiumClubImageForName(club.name)} 
            className="h-full w-full object-cover opacity-100 transition-opacity duration-1000"
            alt=""
          />
          <div className="absolute inset-0 bg-gradient-to-r from-white via-white/40 to-transparent" />
        </div>

        <div className="relative z-10 flex flex-col gap-6 p-6 sm:p-12">
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#5227FF]/10 text-[#5227FF] font-bold">
                {club.icon === "👗" ? "F" : club.icon}
              </span>
              <p className="text-[11px] font-bold uppercase tracking-[0.45em] text-[#5227FF]">Official Club</p>
            </div>
            
            <div className="max-w-3xl">
              <h1 className="text-3xl sm:text-5xl lg:text-7xl font-black text-slate-900 tracking-tighter">
                {club.name}
              </h1>
              <p className="mt-4 sm:mt-5 text-base sm:text-lg lg:text-xl font-medium text-slate-500 max-w-2xl leading-relaxed">
                {club.description || "A cornerstone of community and excellence at OCC."}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-6 pt-10 border-t border-black/5">
            <ClubHeroMemberStack
              key={club.id}
              clubId={club.id}
              initialAvatarUrls={heroAvatarUrls}
              initialMemberCount={club.memberCount || club.members.length}
              memberDisplayBase={club.memberDisplayBase ?? null}
            />
            <JoinClubButton slug={club.slug} joined={joined} />
          </div>
        </div>
      </section>

      <ClubTabs
        currentUserId={user.id}
        posts={club.posts.map((p) => {
          const avatar = p.user.avatar;
          const postImg = resolvePostImageUrlForFeed(p.imageUrl, club.name);
          const postImgs =
            Array.isArray(p.imageUrls) && p.imageUrls.length > 0
              ? p.imageUrls.map((img) => resolvePostImageUrlForFeed(img, club.name))
              : [postImg];
          return {
            id: p.id,
            username: p.user.fullName,
            userAvatarUrl: resolveClubAvatar(avatar, club.name),
            timestamp: getTimeAgo(p.createdAt),
            caption: p.caption || "",
            content: p.content || "",
            imageUrl: postImg,
            imageUrls: postImgs,
            likeCount: displayPostLikes(p.id, p.likesCount ?? p.likes ?? 0),
            sharesCount: p.sharesCount ?? 0,
            clubId: club.id,
            clubName: club.name,
            clubMembersLabel,
            commentsCount: p._count.comments,
          };
        })}
        events={club.events.map((event) => ({
          id: event.id,
          title: event.title,
          description: event.description,
          venue: event.venue,
          date: event.date.toISOString(),
          imageUrl: event.imageUrl,
          price: event.price,
          registered: event.registrations.length > 0,
          club: { name: club.name, icon: club.icon }
        }))}
        gigs={gigs.map((gig) => ({
          id: gig.id,
          title: gig.title,
          description: gig.description,
          payMin: gig.payMin,
          payMax: gig.payMax,
          deadline: gig.deadline?.toISOString() ?? null,
          applied: gig.applications.length > 0,
        }))}
      />
    </div>
  );
}
