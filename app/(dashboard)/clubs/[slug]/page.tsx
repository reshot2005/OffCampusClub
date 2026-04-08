import { notFound } from "next/navigation";
import Link from "next/link";
import { ClubTabs } from "@/components/dashboard/ClubTabs";
import { JoinClubButton } from "@/components/dashboard/JoinClubButton";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { gigWhereNotLegacyDummy } from "@/lib/legacyDummyGigs";
import { displayClubMembers, displayPostLikes, formatSocialCount } from "@/lib/socialDisplay";
import { resolveClubAvatar, resolvePostImageUrlForFeed } from "@/lib/postImageUrl";

const CINEMATIC_SLUGS: Record<string, { route: string; label: string; gradient: string }> = {
  bikers:      { route: "/bikers",      label: "Bikers Ride",    gradient: "from-amber-900/40 via-[#0C0C0A] to-orange-950/30" },
  sports:      { route: "/football",    label: "Football Club",  gradient: "from-green-900/40 via-[#060606] to-emerald-950/30" },
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
      members: {
        include: {
          user: true,
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
        },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!club) {
    return (
      <div className="p-20 bg-red-100 text-red-900 rounded-3xl">
        <h1 className="text-3xl font-black">CLUB NOT FOUND</h1>
        <p className="mt-4">Slug received: <span className="font-mono bg-white px-2 py-1\">{params.slug}</span></p>
        <p className="mt-2 text-sm opacity-60">Redirecting in 3 seconds...</p>
      </div>
    );
  }

  const joined = club.members.some((membership) => membership.userId === user.id);
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

  const INDIAN_PROFILE_PICS = [
    "https://images.unsplash.com/photo-1507152832244-10d45c7eda57?w=100&q=80",
    "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&q=80",
    "https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=100&q=80",
    "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=100&q=80",
  ];

  return (
    <div className="space-y-8 pb-10">
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
      <section className="relative overflow-hidden rounded-[3rem] border border-black/5 bg-gradient-to-br from-indigo-50/50 to-white shadow-xl shadow-black/5">
        <div className="absolute inset-0 z-0">
          <img 
            src={club.coverImage || "/premium-assets/club_fashion_premium_169_1775157327855.png"} 
            className="h-full w-full object-cover opacity-5 transition-opacity duration-1000"
            alt=""
          />
        </div>

        <div className="relative z-10 flex flex-col gap-6 p-8 lg:p-12">
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#5227FF]/10 text-[#5227FF] font-bold">
                {club.icon === "👗" ? "F" : club.icon}
              </span>
              <p className="text-[11px] font-bold uppercase tracking-[0.45em] text-[#5227FF]">Official Club</p>
            </div>
            
            <div className="max-w-3xl">
              <h1 className="text-4xl lg:text-7xl font-black text-slate-900 tracking-tighter">
                {club.name}
              </h1>
              <p className="mt-5 text-xl font-medium text-slate-500 max-w-2xl leading-relaxed">
                {club.description || "A cornerstone of community and excellence at OCC."}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-6 pt-10 border-t border-black/5">
            <div className="flex items-center -space-x-3">
              {[0, 1, 2].map((i) => (
                <div key={i} className="h-10 w-10 rounded-full border-2 border-white bg-slate-100 overflow-hidden shadow-sm">
                   <img src={INDIAN_PROFILE_PICS[i]} className="h-full w-full object-cover" />
                </div>
              ))}
              <span className="pl-6 text-[13px] font-bold text-slate-400">
                {formatSocialCount(displayClubMembers(club.id, club.memberCount || club.members.length))}{" "}
                members active
              </span>
            </div>
            <JoinClubButton slug={club.slug} joined={joined} />
          </div>
        </div>
      </section>

      <ClubTabs
        posts={club.posts.map((p) => {
          const avatar = p.user.avatar || INDIAN_PROFILE_PICS[Math.floor(Math.random() * INDIAN_PROFILE_PICS.length)];
          const postImg = resolvePostImageUrlForFeed(p.imageUrl, club.name);
          const postImgs =
            Array.isArray(p.imageUrls) && p.imageUrls.length > 0
              ? p.imageUrls.map((img) => resolvePostImageUrlForFeed(img, club.name))
              : [postImg];
          return {
            id: p.id,
            imageUrl: postImg,
            imageUrls: postImgs,
            caption: p.caption || p.content || "",
            likes: displayPostLikes(p.id, p.likesCount ?? p.likes ?? 1240),
            createdAt: p.createdAt.toISOString(),
            club: {
              name: club.name,
              icon: club.icon,
            },
            user: {
              fullName: p.user.fullName,
              avatar: avatar,
            }
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
