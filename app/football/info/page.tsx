"use client";

import React from "react";
import { Link } from "@/lib/router-compat";
import { motion } from "motion/react";
import { ArrowLeft, ChevronRight, Trophy, Users, Calendar, ShieldCheck } from "lucide-react";

const FC = {
  bg: "#0B1224",
  card: "#111828",
  accent: "#E5453C",
  text: "#FFFFFF",
  muted: "#8A8E9B",
};

export default function FootballInfoPage() {
  return (
    <div className="min-h-screen text-white font-sans selection:bg-red-500/30" style={{ background: FC.bg }}>
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 py-8 md:px-12 backdrop-blur-md bg-black/10">
        <Link 
          to="/football" 
          className="flex items-center gap-2 text-[10px] tracking-[0.4em] uppercase transition-all hover:gap-4" 
          style={{ color: FC.text }}
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Pitch</span>
        </Link>
        <div className="font-headline text-2xl tracking-[0.2em]">OCC FOOTBALL</div>
      </nav>

      {/* Hero Section */}
      <section className="relative h-[80vh] w-full overflow-hidden flex items-center justify-center pt-20">
        <div className="absolute inset-0 z-0">
          <img 
            src="/football_hero.png" 
            alt="Football Stadium" 
            className="w-full h-full object-cover scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0B1224] via-[#0B1224]/40 to-transparent" />
        </div>

        <div className="relative z-10 text-center px-6 max-w-4xl">
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-[12px] tracking-[0.8em] uppercase mb-6"
            style={{ color: FC.accent }}
          >
            Elite College Athletics
          </motion.p>
          <motion.h1 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="text-[clamp(2.5rem,10vw,6rem)] font-black leading-tight tracking-normal mb-8"
            style={{ fontFamily: "'Bebas Neue', Impact, sans-serif" }}
          >
            MORE THAN A CLUB.<br/>A LEGACY.
          </motion.h1>
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1, delay: 0.5 }}
            className="flex flex-wrap justify-center gap-6"
          >
            <div className="flex items-center gap-2 px-6 py-3 rounded-full bg-white/5 border border-white/10 backdrop-blur-sm">
              <Trophy className="w-4 h-4 text-amber-500" />
              <span className="text-[11px] font-bold tracking-widest uppercase">3x City Champions</span>
            </div>
            <div className="flex items-center gap-2 px-6 py-3 rounded-full bg-white/5 border border-white/10 backdrop-blur-sm">
              <Users className="w-4 h-4 text-blue-400" />
              <span className="text-[11px] font-bold tracking-widest uppercase">450+ Active Players</span>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Main Content */}
      <section className="relative z-10 px-6 py-24 md:px-12 max-w-[76rem] mx-auto grid grid-cols-1 lg:grid-cols-[1.5fr_1fr] gap-16">
        <div className="space-y-16">
          <div className="space-y-6">
            <h2 className="text-4xl font-bold tracking-tight" style={{ fontFamily: "'Bebas Neue', sans-serif" }}>About OCC Football</h2>
            <div className="h-1 w-24" style={{ background: FC.accent }} />
            <p className="text-lg leading-relaxed text-white/70">
              OCC Athletics is Bangalore's premier inter-college football network. We bridge the gap between casual turf matches and high-stakes competitive play. Whether you're a seasoned striker or a tactical enthusiast, our community provides the infrastructure for you to excel.
            </p>
            <p className="text-lg leading-relaxed text-white/70">
              Our sessions are held at state-of-the-art facilities across the city, featuring FIFA-standard artificial grass and professional coaching staff. We focus on physical conditioning, technical drills, and tactical game awareness.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="p-8 rounded-2xl bg-white/[0.03] border border-white/10 space-y-4">
              <ShieldCheck className="w-10 h-10" style={{ color: FC.accent }} />
              <h3 className="text-xl font-bold tracking-wider uppercase">Elite Training</h3>
              <p className="text-sm text-white/50 leading-relaxed">
                Professional coaching regimes designed for college athletes. Focus on agility, strength, and spatial awareness.
              </p>
            </div>
            <div className="p-8 rounded-2xl bg-white/[0.03] border border-white/10 space-y-4">
              <Calendar className="w-10 h-10" style={{ color: FC.accent }} />
              <h3 className="text-xl font-bold tracking-wider uppercase">Match Days</h3>
              <p className="text-sm text-white/50 leading-relaxed">
                Bi-weekly competitive matches and monthly inter-collegiate tournaments with live scouting opportunities.
              </p>
            </div>
          </div>
        </div>

        <aside className="space-y-12">
          <div className="rounded-3xl overflow-hidden border border-white/10 shadow-2xl">
            <img 
              src="/football_action.png" 
              alt="Action Shot" 
              className="w-full object-cover"
            />
          </div>
          
          <div className="bg-gradient-to-br from-red-600 to-red-900 p-8 rounded-3xl space-y-6">
            <h3 className="text-2xl font-black tracking-tight leading-tight">READY TO JOIN THE RANKS?</h3>
            <p className="text-white/80 text-sm">
              We are currently accepting registrations for the Spring Season. Limited slots available for the Elite Squad.
            </p>
            <Link 
              to="/register" 
              className="flex items-center justify-between w-full bg-white px-6 py-5 rounded-xl transition-all hover:bg-gray-100 group"
            >
              <span className="text-black font-black tracking-[0.2em] uppercase text-xs">Apply Now</span>
              <ChevronRight className="w-5 h-5 text-black transition-transform group-hover:translate-x-1" />
            </Link>
          </div>
        </aside>
      </section>

      {/* Footer Space */}
      <footer className="py-20 text-center border-t border-white/5">
        <p className="text-xs tracking-[0.4em] uppercase text-white/30">Â© 2026 OffCampusClub Athletics</p>
      </footer>
    </div>
  );
}
