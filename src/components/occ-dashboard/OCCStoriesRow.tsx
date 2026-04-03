"use client";

import { ChevronLeft, ChevronRight, Plus, Sparkles, Users } from "lucide-react";
import { motion, useScroll, useTransform } from "framer-motion";
import { useRef, useState, useEffect } from "react";
import { toast } from "sonner";
import { pusherClient } from "@/lib/pusher";

export type OCCTrendingClub = {
  id: string;
  slug: string;
  label: string;
  imageUrl: string;
  memberCount?: string;
};

export function OCCTrendingClubs({ clubs }: { clubs: OCCTrendingClub[] }) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [showLeft, setShowLeft] = useState(false);
  const [showRight, setShowRight] = useState(true);
  const [joiningId, setJoiningId] = useState<string | null>(null);
  const [localClubs, setLocalClubs] = useState(clubs);

  // Sync initial clubs
  useEffect(() => {
    setLocalClubs(clubs);
  }, [clubs]);

  // REALTIME REALTIME REALTIME
  useEffect(() => {
    if (!pusherClient) return;

    // Listen to each club's channel for member updates
    localClubs.forEach(club => {
      const channel = pusherClient?.subscribe(`club-${club.id}`);
      if (channel) {
        channel.bind("member-joined", (data: { clubId: string; memberCount: number }) => {
          setLocalClubs(prev => prev.map(c => 
            c.id === data.clubId 
              ? { ...c, memberCount: (data.memberCount / 1000).toFixed(1) + "k" } 
              : c
          ));
        });
      }
    });

    return () => {
      localClubs.forEach(club => pusherClient?.unsubscribe(`club-${club.id}`));
    };
  }, [localClubs.length]);

  const checkScroll = () => {
    if (scrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
      setShowLeft(scrollLeft > 20);
      setShowRight(scrollLeft < scrollWidth - clientWidth - 20);
    }
  };

  useEffect(() => {
    const el = scrollRef.current;
    if (el) {
      el.addEventListener('scroll', checkScroll);
      checkScroll();
      return () => el.removeEventListener('scroll', checkScroll);
    }
  }, []);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const { clientWidth } = scrollRef.current;
      const scrollAmount = direction === 'left' ? -clientWidth * 0.4 : clientWidth * 0.4;
      scrollRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  const handleJoin = async (slug: string, id: string) => {
    setJoiningId(id);
    try {
      const res = await fetch(`/api/clubs/${slug}/join`, { method: "POST" });
      const data = await res.json();
      if (data.success) {
        toast.success("Joined the Elite Cluster!");
      }
    } catch (e) {
      toast.error("Failed to join.");
    } finally {
      setJoiningId(null);
    }
  };

  return (
    <div className="flex flex-col gap-4 sm:gap-6 mb-8 sm:mb-12 relative group/row">
      <div className="flex items-center justify-between px-4 sm:px-2">
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="p-2 sm:p-2.5 rounded-xl bg-[#5227FF]/10 text-[#5227FF]">
            <Sparkles className="h-4 w-4 sm:h-5 sm:w-5" fill="currentColor" />
          </div>
          <h2 className="text-[17px] sm:text-[20px] font-semibold text-black tracking-tight font-sans">Trending Clubs</h2>
        </div>

        <button className="flex items-center gap-2 text-[10px] sm:text-[11px] font-medium uppercase tracking-[0.25em] sm:tracking-[0.35em] text-black/30 hover:text-black transition-all group font-sans">
          View all
          <ChevronRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" strokeWidth={3} />
        </button>
      </div>

      <div className="relative group/scroll">
        {/* Navigation Contols - Only visible on desktop/hover */}
        <div className="absolute top-1/2 -left-4 -translate-y-1/2 z-20 hidden lg:group-hover/scroll:flex">
          <button 
            onClick={() => scroll('left')}
            disabled={!showLeft}
            className={`h-12 w-12 rounded-full bg-white shadow-2xl border border-black/5 flex items-center justify-center transition-all ${showLeft ? 'opacity-100 scale-100 hover:bg-black hover:text-white' : 'opacity-0 scale-90 pointer-events-none'}`}
          >
            <ChevronLeft className="h-6 w-6" strokeWidth={3} />
          </button>
        </div>
        
        <div className="absolute top-1/2 -right-4 -translate-y-1/2 z-20 hidden lg:group-hover/scroll:flex">
          <button 
            onClick={() => scroll('right')}
            disabled={!showRight}
            className={`h-12 w-12 rounded-full bg-white shadow-2xl border border-black/5 flex items-center justify-center transition-all ${showRight ? 'opacity-100 scale-100 hover:bg-black hover:text-white' : 'opacity-0 scale-90 pointer-events-none'}`}
          >
            <ChevronRight className="h-6 w-6" strokeWidth={3} />
          </button>
        </div>

        <motion.div 
          ref={scrollRef}
          drag="x"
          dragConstraints={scrollRef}
          onScroll={checkScroll}
          className="flex items-center gap-4 sm:gap-6 overflow-x-auto pb-4 sm:pb-8 scrollbar-hide -mx-0 px-2 sm:px-0 snap-x snap-mandatory lg:snap-none scroll-smooth cursor-grab active:cursor-grabbing"
        >
          {localClubs.map((club) => (
            <motion.div 
              key={club.id} 
              whileHover={{ y: -8 }}
              className="group flex w-[220px] sm:w-[260px] xl:w-[280px] shrink-0 flex-col bg-white rounded-[2rem] sm:rounded-[2.5rem] border border-black/[0.04] overflow-hidden transition-all duration-700 shadow-sm hover:shadow-[0_30px_60px_-12px_rgba(0,0,0,0.12)] snap-start"
            >
              <div className="relative h-[140px] sm:h-[180px] w-full overflow-hidden bg-black">
                <img
                  alt={club.label}
                  src={club.imageUrl}
                  className="h-full w-full object-cover transition-transform duration-[1.5s] group-hover:scale-110 opacity-90 group-hover:opacity-100"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                <div className="absolute bottom-3 left-4 sm:bottom-4 sm:left-6 flex items-center gap-2">
                   <div className="h-1.5 w-1.5 sm:h-2 sm:w-2 rounded-full bg-[#00E87A] animate-pulse shadow-[0_0_10px_#00E87A]" />
                   <span className="text-[9px] sm:text-[10px] font-medium uppercase tracking-[0.2em] sm:tracking-[0.3em] text-white">Live Now</span>
                </div>
              </div>

              <div className="p-5 sm:p-8 flex flex-col gap-4 sm:gap-6">
                <div className="flex flex-col gap-1">
                  <h3 className="line-clamp-1 text-[15px] sm:text-[17px] font-semibold text-black tracking-tight group-hover:text-[#5227FF] transition-colors font-sans uppercase">
                    {club.label}
                  </h3>
                  <div className="flex items-center gap-2 text-black/30">
                    <Users className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                    <span className="text-[10px] sm:text-[11px] font-medium uppercase tracking-wider font-sans">
                      {club.memberCount || "2.4k"} Elite
                    </span>
                  </div>
                </div>
                
                <button 
                  onClick={() => handleJoin(club.slug, club.id)}
                  disabled={joiningId === club.id}
                  className="w-full flex items-center justify-center gap-2 py-3 sm:py-4 bg-black !text-white rounded-xl sm:rounded-2xl text-[9px] sm:text-[11px] font-semibold uppercase tracking-[0.2em] sm:tracking-[0.3em] transition-all hover:bg-[#5227FF] hover:shadow-xl active:scale-95 font-sans disabled:opacity-50"
                >
                  {joiningId === club.id ? (
                    <div className="h-3 w-3 sm:h-4 sm:w-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                  ) : (
                    <Plus className="h-3.5 w-3.5 sm:h-4 sm:w-4" strokeWidth={4} />
                  )}
                  <span>{joiningId === club.id ? 'Joining...' : 'Join Cluster'}</span>
                </button>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </div>

  );
}
