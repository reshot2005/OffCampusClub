"use client";

import { ChevronLeft, ChevronRight, Plus, Sparkles } from "lucide-react";
import { motion } from "framer-motion";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { pusherClient } from "@/lib/pusher";
import { displayClubMembers, formatSocialCount } from "@/lib/socialDisplay";
import { cn } from "@/app/components/ui/utils";
import { clubDiveInHref } from "@/lib/clubDiveInHref";

export type OCCTrendingClub = {
  id: string;
  slug: string;
  label: string;
  imageUrl: string;
  memberCount?: string;
  joined?: boolean;
};

export function OCCTrendingClubs({ clubs }: { clubs: OCCTrendingClub[] }) {
  const router = useRouter();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [showLeft, setShowLeft] = useState(false);
  const [showRight, setShowRight] = useState(true);
  const [joiningId, setJoiningId] = useState<string | null>(null);
  const [localClubs, setLocalClubs] = useState(clubs);

  useEffect(() => {
    setLocalClubs(clubs);
  }, [clubs]);

  useEffect(() => {
    if (!pusherClient) return;
    localClubs.forEach(club => {
      const channel = pusherClient?.subscribe(`club-${club.id}`);
      if (channel) {
        channel.bind("member-joined", (data: any) => {
          const display =
            data.displayMemberCount ??
            displayClubMembers(data.clubId, data.memberCount, data.memberDisplayBase);
          setLocalClubs((prev) => prev.map((c) => c.id === data.clubId ? { ...c, memberCount: formatSocialCount(display) } : c));
        });
      }
    });
    return () => localClubs.forEach(club => pusherClient?.unsubscribe(`club-${club.id}`));
  }, [localClubs.length]);

  const checkScroll = () => {
    if (!scrollRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
    setShowLeft(scrollLeft > 20);
    setShowRight(scrollLeft < scrollWidth - clientWidth - 20);
  };

  const scroll = (direction: "left" | "right") => {
    if (!scrollRef.current) return;
    const { clientWidth } = scrollRef.current;
    const amount = direction === "left" ? -clientWidth * 0.72 : clientWidth * 0.72;
    scrollRef.current.scrollBy({ left: amount, behavior: "smooth" });
  };

  const handleJoin = async (slug: string, id: string) => {
    setJoiningId(id);
    try {
      const res = await fetch(`/api/clubs/${slug}/join`, { method: "POST" });
      const data = await res.json();
      if (data.success || data.error === "Already a member") {
        if (data.success) toast.success("Joined Cluster!");
        setLocalClubs(prev => prev.map(c => c.id === id ? { ...c, joined: true } : c));
      }
    } catch (e) {
      toast.error("Error joining.");
    } finally {
      setJoiningId(null);
    }
  };

  // Horizontal, staggered "big then small" rhythm.
  const cardStyles = [
    "w-[420px] h-[340px]",
    "w-[320px] h-[420px]",
    "w-[410px] h-[330px]",
    "w-[310px] h-[410px]",
    "w-[430px] h-[350px]",
    "w-[315px] h-[405px]",
  ];

  return (
    <div className="flex flex-col gap-5 mb-12 relative w-full group/row overflow-hidden">
      <div className="flex items-center justify-between px-2">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-[#5227FF]/10 text-[#5227FF]">
            <Sparkles className="h-5 w-5" fill="currentColor" />
          </div>
          <h2 className="text-[18px] sm:text-[20px] font-black text-slate-900 tracking-tight leading-none uppercase">Trending Hubs</h2>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => scroll("left")}
            className={cn(
              "p-2.5 rounded-full border border-black/5 bg-white shadow-sm transition-all hover:bg-black hover:text-white",
              !showLeft && "pointer-events-none opacity-0",
            )}
          >
            <ChevronLeft className="h-4 w-4" strokeWidth={3} />
          </button>
          <button
            type="button"
            onClick={() => scroll("right")}
            className={cn(
              "p-2.5 rounded-full border border-black/5 bg-white shadow-sm transition-all hover:bg-black hover:text-white",
              !showRight && "pointer-events-none opacity-0",
            )}
          >
            <ChevronRight className="h-4 w-4" strokeWidth={3} />
          </button>
        </div>
      </div>

      <div
        ref={scrollRef}
        onScroll={checkScroll}
        className="flex items-center overflow-x-auto scrollbar-hide py-5 -mx-2 px-2 scroll-smooth"
      >
        <div className="flex items-center gap-4 min-w-max pr-40">
          {localClubs.map((club, idx) => (
            <motion.div 
              key={club.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, delay: idx * 0.05 }}
              className={`relative flex-shrink-0 group rounded-[2.5rem] sm:rounded-[3rem] overflow-hidden bg-slate-50 cursor-pointer shadow-[0_10px_40px_rgb(0,0,0,0.05)] hover:shadow-[0_40px_80px_rgb(0,0,0,0.15)] transition-all duration-700 ${cardStyles[idx % cardStyles.length]}`}
              onClick={() => router.push(clubDiveInHref(club.slug))}
            >
              <img
                src={club.imageUrl}
                alt={club.label}
                className="h-full w-full object-cover transition-transform duration-[3s] group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/20 to-transparent opacity-80 group-hover:opacity-100 transition-opacity duration-700" />
              
              <div className="absolute bottom-0 left-0 right-0 p-8 flex items-end justify-between gap-4">
                <div className="flex flex-col">
                  <h3 className="text-[19px] sm:text-[23px] font-black text-white tracking-tight leading-tight mb-1">
                    {club.label}
                  </h3>
                  <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-white/50 group-hover:text-white transition-colors duration-500">
                    {club.memberCount || "1.2K"} Members
                  </p>
                </div>

                <button 
                   onClick={(e) => {
                     e.stopPropagation();
                     handleJoin(club.slug, club.id);
                   }}
                   disabled={joiningId === club.id || club.joined}
                   className={cn(
                     "flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-2xl transform transition-all duration-500",
                     club.joined
                      ? "bg-white/10 backdrop-blur-xl text-white border border-white/20"
                      : "bg-[#5227FF] text-white shadow-2xl hover:scale-110 hover:bg-[#401ED9]"
                   )}
                >
                  {club.joined ? (
                    <Sparkles className="h-5 w-5 sm:h-6 sm:w-6" fill="currentColor" />
                  ) : joiningId === club.id ? (
                    <div className="h-4 w-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                  ) : (
                    <Plus className="h-5 w-5 sm:h-6 sm:w-6" strokeWidth={3} />
                  )}
                </button>
              </div>

              <div className="absolute inset-0 pointer-events-none bg-gradient-to-tr from-white/0 via-white/5 to-white/0 opacity-0 group-hover:opacity-100 group-hover:animate-shine" />
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
