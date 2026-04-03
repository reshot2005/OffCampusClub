"use client";

import { Calendar, Users, Briefcase, Plus, ChevronRight, MapPin, ExternalLink, BadgeCheck } from "lucide-react";
import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { pusherClient } from "@/lib/pusher";

export type OCCEventItem = {
  id: string;
  title: string;
  when: string;
  club: string;
  imageUrl: string;
};

export type OCCClubItem = {
  id: string;
  slug?: string;
  name: string;
  members: string;
  imageUrl: string;
};

export type OCCOpportunity = {
  id: string;
  title: string;
  description: string;
  brand: string;
};

interface OCCRightRailProps {
  events: OCCEventItem[];
  trending: OCCClubItem[];
  opportunities: OCCOpportunity[];
}

const sectionVariants: any = {
  hidden: { opacity: 0, y: 15 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { duration: 0.6, ease: [0.23, 1, 0.32, 1] }
  }
};

export function OCCRightRail({ events, trending, opportunities }: OCCRightRailProps) {
  const [localTrending, setLocalTrending] = useState(trending);
  const [joiningId, setJoiningId] = useState<string | null>(null);

  useEffect(() => {
    setLocalTrending(trending);
  }, [trending]);

  // REALTIME JOIN UPDATES
  useEffect(() => {
    if (!pusherClient) return;
    
    localTrending.forEach(club => {
      const channel = pusherClient?.subscribe(`club-${club.id}`);
      if (channel) {
        channel.bind("member-joined", (data: { clubId: string; memberCount: number }) => {
          setLocalTrending(prev => prev.map(c => 
            c.id === data.clubId 
              ? { ...c, members: (data.memberCount / 1000).toFixed(1) + "k" } 
              : c
          ));
        });
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
      if (data.success) {
        toast.success(`Welcome to ${slug}!`);
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
          <button className="text-[11px] font-semibold text-[#5227FF] hover:scale-105 transition-transform uppercase tracking-widest text-black/40">See all</button>
        </div>
        <div className="flex flex-col gap-4">
          {events.map((event) => (
            <motion.div 
              key={event.id} 
              whileHover={{ x: 4, transform: 'translateY(-2px)' }}
              className="flex gap-4 group cursor-pointer p-2.5 rounded-2xl border border-transparent hover:bg-white hover:shadow-2xl hover:shadow-black/[0.04] transition-all duration-500"
            >
              <div className="h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-black/5 ring-1 ring-black/5 shadow-sm">
                <img src={event.imageUrl} alt={event.title} className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110" />
              </div>
              <div className="flex flex-col flex-1 min-w-0 justify-center">
                <h4 className="text-[14px] font-semibold text-black/80 line-clamp-1 group-hover:text-[#5227FF] transition-colors tracking-tight">{event.title}</h4>
                <div className="flex flex-col mt-1">
                  <span className="text-[11px] font-semibold text-[#5227FF] uppercase tracking-widest leading-none mb-1.5">{event.club}</span>
                  <div className="flex items-center gap-1.5 text-[11px] font-medium text-black/20 italic">
                    <MapPin className="h-3 w-3" />
                    {event.when}
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
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
          <button className="text-[11px] font-semibold text-black/10 hover:text-[#5227FF] transition-colors uppercase tracking-widest">More</button>
        </div>
        <div className="flex flex-col gap-3">
          {localTrending.map((club) => (
            <motion.div 
              key={club.id} 
              whileHover={{ x: 4, backgroundColor: "rgba(0,0,0,0.02)" }}
              className="flex items-center justify-between group cursor-pointer p-2.5 rounded-2xl transition-all"
            >
              <div className="flex items-center gap-3.5">
                <div className="h-11 w-11 shrink-0 overflow-hidden rounded-xl bg-black/5 ring-2 ring-black/[0.02] shadow-sm">
                  <img src={club.imageUrl} alt={club.name} className="h-full w-full object-cover group-hover:scale-105 transition-transform" />
                </div>
                <div className="flex flex-col leading-tight">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[14px] font-semibold text-black/80">{club.name}</span>
                    <BadgeCheck className="h-3.5 w-3.5 text-[#5227FF]" />
                  </div>
                  <span className="text-[11px] font-medium text-black/20 tracking-tight">{club.members} Members</span>
                </div>
              </div>
              <button 
                onClick={() => handleJoin(club.id, club.slug)}
                disabled={joiningId === club.id}
                className="text-[11px] font-semibold text-[#5227FF] h-9 px-4 rounded-xl bg-[#5227FF]/5 hover:bg-[#5227FF] hover:text-white transition-all duration-300 border border-[#5227FF]/10 disabled:opacity-50"
              >
                {joiningId === club.id ? '...' : 'Join'}
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
          <button className="text-[11px] font-semibold text-[#D4AF37] hover:scale-105 transition-transform uppercase tracking-widest">See all</button>
        </div>
        <div className="flex flex-col gap-4">
          {opportunities.map((opp) => (
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
                <ExternalLink className="h-4.5 w-4.5 text-black/10 group-hover:text-[#5227FF] transition-colors" />
              </div>
              <p className="text-[12px] font-medium text-black/30 leading-relaxed line-clamp-2 italic pr-2">
                "{opp.description}"
              </p>
              <button className="w-full py-3 bg-white text-black text-[12px] font-semibold rounded-xl border border-black/5 hover:bg-black hover:text-white transition-all shadow-sm">
                Apply Now
              </button>
            </motion.div>
          ))}
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
