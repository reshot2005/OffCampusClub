"use client";

import Link from "next/link";
import { GlassCard } from "@/components/ui/GlassCard";
import { Users, ChevronRight, CheckCircle2 } from "lucide-react";
import { clubDiveInHref } from "@/lib/clubDiveInHref";

const clubImages: Record<string, string> = {
  amber: "/clubs/biker.png",
  purple: "/clubs/music.png",
  green: "/clubs/lifestyle.png",
  blue: "/clubs/sports.png",
  charcoal: "/clubs/lifestyle.png",
  rose: "/clubs/music.png",
};

const themeColors: Record<string, string> = {
  amber: "#D4AF37",
  purple: "#8C6DFD",
  green: "#00E87A",
  blue: "#5227FF",
  charcoal: "#64748B",
  rose: "#FF6B6B",
};

export function ClubCard({
  club,
  joined = false,
  action,
}: {
  club: {
    slug: string;
    name: string;
    icon: string;
    description: string;
    theme: string;
    memberCount: number;
    coverImage?: string; // ADDED: For premium generated images
  };
  joined?: boolean;
  action?: React.ReactNode;
}) {
  // Use coverImage if provided, otherwise fallback to theme mapping
  const bgImg = club.coverImage || clubImages[club.theme] || clubImages.charcoal;
  const accentColor = themeColors[club.theme] || themeColors.charcoal;

  return (
    <GlassCard className="group relative overflow-hidden rounded-[3.5rem] border-0 bg-white shadow-[0_15px_40px_-15px_rgba(0,0,0,0.15)] transition-all duration-700 hover:scale-[1.03] hover:shadow-[0_50px_90px_-20px_rgba(0,0,0,0.4)]">
      {/* High-Fidelity Background Visual */}
      <div className="absolute inset-x-0 top-0 h-[85%] overflow-hidden bg-black">
        <img 
          src={bgImg} 
          alt={club.name} 
          className="h-full w-full object-cover transition-transform duration-[1.5s] ease-out group-hover:scale-110"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
        <div className="absolute inset-0 bg-black/5" />
      </div>

      {/* Premium Badge */}
      <div className="absolute left-6 sm:left-10 top-6 sm:top-10 z-20 flex items-center gap-2 sm:gap-3 rounded-full border border-white/30 bg-black/60 px-4 sm:px-6 py-1.5 sm:py-2.5 backdrop-blur-2xl shadow-2xl">
        <div className="relative flex h-1.5 w-1.5 sm:h-2 sm:w-2">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#D4AF37] opacity-75"></span>
          <span className="relative inline-flex h-1.5 w-1.5 sm:h-2 sm:w-2 rounded-full bg-[#D4AF37]"></span>
        </div>
        <span className="text-[10px] sm:text-[12px] font-black uppercase tracking-[0.2em] sm:tracking-[0.3em] text-white">
          {club.memberCount} Elite
        </span>
      </div>

      <div className="relative z-10 flex h-[400px] sm:h-[520px] flex-col justify-end p-6 sm:p-12">
        <div className="space-y-4 sm:space-y-6">
          <div className="space-y-2 sm:space-y-3">
            <h3 className="font-sans text-[1.75rem] sm:text-[3rem] font-bold leading-[1.1] tracking-tight text-white drop-shadow-[0_10px_30px_rgba(0,0,0,1)] uppercase">
              {club.name}
            </h3>
            <p className="line-clamp-2 max-w-[280px] sm:max-w-[320px] text-[13px] sm:text-[16px] font-medium leading-relaxed text-white opacity-80 drop-shadow-[0_5px_15px_rgba(0,0,0,0.8)]">
              {club.description}
            </p>
          </div>

          <div className="flex items-center justify-between pt-1 sm:pt-2">
            <Link
              href={clubDiveInHref(club.slug)}
              className="group/link flex items-center gap-2 text-[10px] sm:text-[12px] font-black uppercase tracking-[0.3em] sm:tracking-[0.4em] text-white/60 transition-all hover:text-white"
            >
              <span className="border-b border-white/20 group-hover:border-white transition-all">Dive In</span>
              <ChevronRight className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            </Link>
            
            <div className="scale-100 sm:scale-110">
              {action}
            </div>
          </div>
        </div>
      </div>

      
      {/* Dynamic Theme Glow */}
      <div 
        className="absolute -bottom-10 -right-10 h-64 w-64 rounded-full blur-[90px] opacity-0 transition-all duration-1000 group-hover:opacity-40" 
        style={{ backgroundColor: accentColor }}
      />
    </GlassCard>
  );
}
