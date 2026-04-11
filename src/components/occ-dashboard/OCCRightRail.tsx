"use client";

import { Calendar, Users, Briefcase, Plus, ChevronRight, MapPin, ExternalLink, BadgeCheck } from "lucide-react";
import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { pusherClient } from "@/lib/pusher";
import { displayClubMembers, formatSocialCount } from "@/lib/socialDisplay";
import { ECLUBS_PUSHER_CHANNEL, type EClubsPusherPayload } from "@/lib/gigs-realtime";
import { clubDiveInHref } from "@/lib/clubDiveInHref";

export type OCCEventItem = {
  id: string;
  title: string;
  when: string;
  /** Host club display name */
  club: string;
  /** Host club slug — used to open the club hub / dive-in experience */
  clubSlug: string;
  imageUrl: string;
};

export type OCCClubItem = {
  id: string;
  slug?: string;
  name: string;
  members: string;
  imageUrl: string;
  joined?: boolean;
};

export type OCCOpportunity = {
  id: string;
  title: string;
  description: string;
  brand: string;
  /** PENDING | APPROVED | REJECTED when the signed-in user has applied */
  applicationStatus?: string | null;
};

function gigApplicationStatusLabel(status: string | null | undefined): string | null {
  if (!status) return null;
  if (status === "PENDING") return "Pending review";
  if (status === "APPROVED") return "Approved";
  if (status === "REJECTED") return "Not selected";
  return null;
}

interface OCCRightRailProps {
  events: OCCEventItem[];
  trending: OCCClubItem[];
  opportunities: OCCOpportunity[];
  currentUserId: string;
}

const sectionVariants: any = {
  hidden: { opacity: 0, y: 15 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { duration: 0.6, ease: [0.23, 1, 0.32, 1] }
  }
};

export function OCCRightRail({ events, trending, opportunities, currentUserId }: OCCRightRailProps) {
  const [localTrending, setLocalTrending] = useState(trending);
  const [joiningId, setJoiningId] = useState<string | null>(null);
  /** Live overrides from Pusher (apply / approve / reject) */
  const [liveAppStatusByGig, setLiveAppStatusByGig] = useState<Record<string, string>>({});

  const oppRealtimeKey = opportunities
    .map((o) => `${o.id}:${o.applicationStatus ?? ""}`)
    .sort()
    .join("|");

  useEffect(() => {
    setLiveAppStatusByGig({});
  }, [oppRealtimeKey]);

  useEffect(() => {
    setLocalTrending(trending);
  }, [trending]);

  useEffect(() => {
    if (!pusherClient || !currentUserId) return;
    const ch = pusherClient.subscribe(ECLUBS_PUSHER_CHANNEL);
    const onUpdate = (raw: unknown) => {
      const data = raw as EClubsPusherPayload;
      if (data.type === "gig-application" && data.userId === currentUserId) {
        setLiveAppStatusByGig((prev) => ({ ...prev, [data.gigId]: "PENDING" }));
      }
      if (data.type === "gig-application-status" && data.userId === currentUserId) {
        setLiveAppStatusByGig((prev) => ({ ...prev, [data.gigId]: data.status }));
      }
    };
    ch.bind("update", onUpdate);
    return () => {
      ch.unbind("update", onUpdate);
      pusherClient?.unsubscribe(ECLUBS_PUSHER_CHANNEL);
    };
  }, [currentUserId]);

  // REALTIME JOIN UPDATES
  useEffect(() => {
    if (!pusherClient) return;
    
    localTrending.forEach(club => {
      const channel = pusherClient?.subscribe(`club-${club.id}`);
      if (channel) {
        channel.bind(
          "member-joined",
          (data: {
            clubId: string;
            memberCount: number;
            displayMemberCount?: number;
            memberDisplayBase?: number | null;
          }) => {
            const display =
              data.displayMemberCount ??
              displayClubMembers(data.clubId, data.memberCount, data.memberDisplayBase);
            setLocalTrending((prev) =>
              prev.map((c) =>
                c.id === data.clubId ? { ...c, members: formatSocialCount(display) } : c,
              ),
            );
          },
        );
      }
    });

    return () => {
      localTrending.forEach(club => pusherClient?.unsubscribe(`club-${club.id}`));
    };
  }, [localTrending.length]);

  const handleJoin = async (id: string, slug?: string) => {
    if (!slug) return;
    setJoiningId(id);
    try {
      const res = await fetch(`/api/clubs/${slug}/join`, { method: "POST" });
      const data = await res.json();
      if (data.success || data.error === "Already a member") {
        if (data.success) toast.success(`Welcome to ${slug}!`);
        setLocalTrending(prev => prev.map(c => c.id === id ? { ...c, joined: true } : c));
      } else {
        toast.error("Cluster access denied.");
      }
    } catch (e) {
      toast.error("Cluster access denied.");
    } finally {
      setJoiningId(null);
    }
  };

  return (
    <div className="flex flex-col gap-10 pr-0 pl-0 overflow-y-auto scrollbar-hide pb-12 xl:pr-1">
      {/* Upcoming Events Section */}
      <motion.section 
        variants={sectionVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        className="flex flex-col gap-6"
      >
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-xl bg-[#5227FF]/5 flex items-center justify-center">
              <Calendar className="h-4.5 w-4.5 text-[#5227FF]" strokeWidth={3} />
            </div>
            <h3 className="text-[17px] font-semibold tracking-tight text-black/90">Upcoming Events</h3>
          </div>
          <Link
            href="/events"
            className="text-[11px] font-semibold text-[#5227FF] hover:scale-105 transition-transform uppercase tracking-widest text-black/40"
          >
            See all
          </Link>
        </div>
        <div className="flex flex-col gap-4">
          {events.map((event) => {
            const clubHref = clubDiveInHref(event.clubSlug);
            return (
              <Link
                key={event.id}
                href={clubHref}
                className="block rounded-2xl outline-none ring-[#5227FF]/30 focus-visible:ring-2"
              >
                <motion.div
                  whileHover={{ x: 4, y: -2 }}
                  className="flex gap-4 group cursor-pointer p-2.5 rounded-2xl border border-transparent hover:bg-white hover:shadow-2xl hover:shadow-black/[0.04] transition-all duration-500"
                >
                  <div className="h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-black/5 ring-1 ring-black/5 shadow-sm">
                    <img
                      src={event.imageUrl}
                      alt={event.title}
                      className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
                    />
                  </div>
                  <div className="flex flex-col flex-1 min-w-0 justify-center">
                    <h4 className="text-[14px] font-semibold text-black/80 line-clamp-1 group-hover:text-[#5227FF] transition-colors tracking-tight">
                      {event.title}
                    </h4>
                    <div className="flex flex-col mt-1">
                      <span className="text-[11px] font-semibold text-[#5227FF] uppercase tracking-widest leading-none mb-1.5">
                        {event.club}
                      </span>
                      <div className="flex items-center gap-1.5 text-[11px] font-medium text-black/20 italic">
                        <MapPin className="h-3 w-3 shrink-0" aria-hidden />
                        {event.when}
                      </div>
                    </div>
                  </div>
                </motion.div>
              </Link>
            );
          })}
        </div>
      </motion.section>

      {/* Recommended Clubs Section */}
      <motion.section 
        variants={sectionVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        className="flex flex-col gap-6"
      >
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-xl bg-[#5227FF]/5 flex items-center justify-center">
              <Users className="h-4.5 w-4.5 text-[#5227FF]" strokeWidth={3} />
            </div>
            <h3 className="text-[17px] font-semibold tracking-tight text-black/90">Trending Clubs</h3>
          </div>
          <Link
            href="/clubs"
            className="text-[11px] font-semibold text-black/40 hover:text-[#5227FF] transition-colors uppercase tracking-widest"
          >
            More
          </Link>
        </div>
        <div className="flex flex-col gap-3">
          {localTrending.map((club) => (
            <motion.div 
              key={club.id} 
              whileHover={{ x: 4, backgroundColor: "rgba(0,0,0,0.02)" }}
              className="flex items-center justify-between group p-2.5 rounded-2xl transition-all"
            >
              <Link
                href={clubDiveInHref(club.slug)}
                className="flex min-w-0 flex-1 items-center gap-3.5 rounded-xl py-0.5 pr-2 text-left outline-none ring-[#5227FF]/30 focus-visible:ring-2"
              >
                <div className="h-11 w-11 shrink-0 overflow-hidden rounded-xl bg-black/5 ring-2 ring-black/[0.02] shadow-sm">
                  <img src={club.imageUrl} alt={club.name} className="h-full w-full object-cover transition-transform group-hover:scale-105" />
                </div>
                <div className="min-w-0 flex flex-col leading-tight">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[14px] font-semibold text-black/80 group-hover:text-[#5227FF] transition-colors">{club.name}</span>
                    <BadgeCheck className="h-3.5 w-3.5 shrink-0 text-[#5227FF]" aria-hidden />
                  </div>
                  <span className="text-[11px] font-medium text-black/20 tracking-tight">{club.members} Members</span>
                </div>
              </Link>
              <button 
                type="button"
                onClick={() => handleJoin(club.id, club.slug)}
                disabled={joiningId === club.id || club.joined}
                className={club.joined 
                  ? "text-[11px] font-semibold text-[#5227FF] h-9 px-4 rounded-xl bg-[#5227FF]/5 transition-all duration-300 border border-[#5227FF]/10 cursor-default opacity-80 shrink-0" 
                  : "text-[11px] font-semibold text-[#5227FF] h-9 px-4 rounded-xl bg-[#5227FF]/5 hover:bg-[#5227FF] hover:text-white transition-all duration-300 border border-[#5227FF]/10 disabled:opacity-50 shrink-0"}
              >
                {club.joined ? 'Joined ✓' : joiningId === club.id ? '...' : 'Join'}
              </button>
            </motion.div>
          ))}
        </div>
      </motion.section>

      {/* Opportunities Section */}
      <motion.section 
        variants={sectionVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        className="flex flex-col gap-6"
      >
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-xl bg-[#5227FF]/5 flex items-center justify-center">
              <Briefcase className="h-4.5 w-4.5 text-[#5227FF]" strokeWidth={3} />
            </div>
            <h3 className="text-[17px] font-semibold tracking-tight text-black/90">Gigs & Labs</h3>
          </div>
          <Link
            href="/e-clubs"
            className="inline-flex items-center gap-0.5 text-[11px] font-semibold text-[#D4AF37] hover:opacity-90 transition-opacity uppercase tracking-widest"
          >
            See all
            <ChevronRight className="h-3.5 w-3.5" strokeWidth={2.5} aria-hidden />
          </Link>
        </div>
        <div className="flex flex-col gap-4">
          {opportunities.map((opp) => {
            const rawStatus = liveAppStatusByGig[opp.id] ?? opp.applicationStatus ?? null;
            const statusLabel = gigApplicationStatusLabel(rawStatus);
            const statusTone =
              rawStatus === "APPROVED"
                ? "border-emerald-500/25 bg-emerald-500/[0.06] text-emerald-800"
                : rawStatus === "REJECTED"
                  ? "border-black/10 bg-black/[0.04] text-black/45"
                  : rawStatus === "PENDING"
                    ? "border-amber-500/30 bg-amber-500/[0.08] text-amber-900"
                    : "";

            return (
            <motion.div 
              key={opp.id} 
              whileHover={{ y: -4 }}
              className="flex flex-col gap-4 p-5 rounded-3xl bg-black/[0.015] border border-black/[0.025] group hover:border-[#5227FF]/20 hover:bg-white hover:shadow-xl hover:shadow-black/[0.03] transition-all duration-500"
            >
              <div className="flex items-start justify-between">
                <div className="flex flex-col gap-1">
                  <h4 className="text-[15px] font-semibold text-black/85 group-hover:text-black tracking-tight">{opp.title}</h4>
                  <span className="text-[12px] font-semibold text-[#D4AF37] tracking-widest uppercase bg-[#D4AF37]/5 px-2.5 py-0.5 rounded-lg border border-[#D4AF37]/10 self-start">{opp.brand}</span>
                </div>
                <Link
                  href="/e-clubs"
                  className="rounded-md p-1 text-black/10 transition-colors hover:text-[#5227FF]"
                  aria-label={`View ${opp.title} on E-Clubs`}
                >
                  <ExternalLink className="h-4.5 w-4.5" />
                </Link>
              </div>
              <p className="text-[12px] font-medium text-black/30 leading-relaxed line-clamp-2 italic pr-2">
                "{opp.description}"
              </p>
              {statusLabel ? (
                <div
                  className={`block w-full rounded-xl border py-3 text-center text-[12px] font-semibold shadow-sm ${statusTone}`}
                >
                  {statusLabel}
                </div>
              ) : (
                <Link
                  href="/football"
                  className="block w-full rounded-xl border border-black/5 bg-white py-3 text-center text-[12px] font-semibold text-black shadow-sm transition-all hover:bg-black hover:text-white"
                >
                  Apply Now
                </Link>
              )}
            </motion.div>
            );
          })}
        </div>
      </motion.section>

      {/* Simplified Footer */}
      <div className="mt-4 pt-10 border-t border-black/[0.02]">
        <div className="flex flex-wrap gap-4 px-2 mb-8 items-center">
          {['About', 'Privacy', 'Help', 'API'].map(link => (
            <button key={link} className="text-[10px] font-medium text-black/15 hover:text-[#5227FF] transition-colors tracking-widest uppercase">{link}</button>
          ))}
        </div>
        <div className="flex flex-col gap-1 px-2 mb-4">
          <span className="text-[11px] font-medium text-black/10 tracking-[0.25em] uppercase leading-none">© 2026 OffCampusClub</span>
          <span className="text-[9px] font-medium text-black/10 leading-none mt-2 opacity-50">LUSION DEPTH V3.0</span>
        </div>
      </div>
    </div>
  );
}
