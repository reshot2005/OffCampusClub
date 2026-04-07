"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  Users,
  PenSquare,
  CalendarDays,
  Ticket,
  Sparkles,
  ChevronRight,
  ArrowRight,
  Copy,
} from "lucide-react";
import { useEffect, useState } from "react";
import { pusherClient } from "@/lib/pusher";

interface Props {
  headerId: string;
  membersCount: number;
  postsCount: number;
  clubName: string;
  referralCode: string;
  hasClub: boolean;
}

export function HeaderOverviewClient({
  headerId,
  membersCount,
  postsCount,
  clubName,
  referralCode,
  hasClub,
}: Props) {
  const router = useRouter();
  const [codeCopied, setCodeCopied] = useState(false);

  useEffect(() => {
    const client = pusherClient;
    if (!client || !headerId) return;
    const channelName = `header-${headerId}`;
    const channel = client.subscribe(channelName);
    const onNewMember = () => {
      router.refresh();
    };
    channel.bind("new-member", onNewMember);
    return () => {
      channel.unbind("new-member", onNewMember);
      client.unsubscribe(channelName);
    };
  }, [headerId, router]);

  const stats = [
    { label: "Members via code", value: membersCount, href: "/header/members", icon: Users, highlight: membersCount > 0 },
    { label: "Posts published", value: postsCount, href: "/header/post", icon: PenSquare },
    { label: "Event registrations", value: 0, href: "/header/events", icon: Ticket },
    { label: "Upcoming events", value: 0, href: "/header/events", icon: CalendarDays },
  ];

  const copyCode = async () => {
    await navigator.clipboard.writeText(referralCode);
    setCodeCopied(true);
    setTimeout(() => setCodeCopied(false), 1500);
  };

  return (
    <div className="space-y-8 pb-12">
      {/* Hero Banner */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
        className="relative overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-[#12183A]/80 to-[#0A0D20] p-10 lg:p-14 border border-white/[0.04] shadow-2xl backdrop-blur-3xl"
      >
        <div className="absolute top-[-20%] right-[-10%] h-[300px] w-[300px] rounded-full bg-[#5227FF]/30 blur-[120px]" />
        <div className="absolute bottom-[-10%] left-[-10%] h-[200px] w-[200px] rounded-full bg-[#D4AF37]/20 blur-[100px]" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-8">
          <div className="max-w-2xl">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 mb-6"
            >
              <Sparkles className="h-4 w-4 text-[#5227FF]" />
              <span className="text-xs font-semibold uppercase tracking-widest text-white/70">
                Club Leader Panel
              </span>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-white mb-4"
            >
              Manage{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-br from-[#5227FF] to-[#8C6DFD]">
                {clubName}
              </span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="text-lg text-white/60 font-medium max-w-xl leading-relaxed"
            >
              Post content, track referrals, manage members, and grow your club community.
            </motion.p>
          </div>

          {/* Quick Status */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5 }}
            className="flex flex-col gap-4 min-w-[240px]"
          >
            <div className="flex items-center justify-between p-4 rounded-2xl bg-white/[0.04] border border-white/[0.06] backdrop-blur-xl">
              <div className="flex items-center gap-3">
                <div className="h-2 w-2 rounded-full bg-[#00E87A] shadow-[0_0_10px_rgba(0,232,122,0.8)]" />
                <span className="text-sm font-semibold text-white/90">Status</span>
              </div>
              <span className="text-xs font-mono px-2 py-1 bg-[#00E87A]/10 border border-[#00E87A]/20 rounded-lg text-[#00E87A]">
                Approved
              </span>
            </div>
          </motion.div>
        </div>
      </motion.div>

      {/* Stats Grid + Sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {/* Stats Cards */}
        <motion.div
          initial="hidden"
          animate="visible"
          variants={{
            hidden: { opacity: 0 },
            visible: { opacity: 1, transition: { staggerChildren: 0.1, delayChildren: 0.2 } },
          }}
          className="lg:col-span-2 xl:col-span-3 grid grid-cols-1 sm:grid-cols-2 gap-6"
        >
          {stats.map((stat, idx) => (
            <motion.div
              key={stat.label}
              variants={{
                hidden: { opacity: 0, y: 20 },
                visible: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 300, damping: 24 } },
              }}
            >
              <Link
                href={stat.href}
                className={`group block relative overflow-hidden rounded-[2rem] p-8 transition-all duration-500 hover:-translate-y-1 ${
                  stat.highlight
                    ? "bg-gradient-to-br from-[#5227FF]/20 via-[#111122]/80 to-[#111122] border border-[#5227FF]/40 shadow-[0_20px_60px_-15px_rgba(82,39,255,0.4)]"
                    : "bg-white/[0.02] border border-white/[0.05] hover:bg-white/[0.04] hover:border-white/[0.1] shadow-2xl"
                }`}
              >
                <div className={`absolute top-0 right-0 h-32 w-32 rounded-full opacity-20 blur-[60px] pointer-events-none ${
                  stat.highlight ? "bg-[#5227FF] opacity-40" : "bg-white group-hover:bg-[#5227FF]"
                }`} />

                <div className="flex justify-between items-start mb-10 relative z-10">
                  <div className={`p-4 rounded-2xl ${stat.highlight ? "bg-[#5227FF]" : "bg-white/5 group-hover:bg-white/10"} transition-colors`}>
                    <stat.icon className={`h-6 w-6 ${stat.highlight ? "text-white" : "text-white/80"}`} />
                  </div>
                  <div className="h-10 w-10 rounded-full flex items-center justify-center bg-white/[0.03] border border-white/[0.05]">
                    <ArrowRight className={`h-4 w-4 ${stat.highlight ? "text-[#5227FF]" : "text-white/30 group-hover:text-white/80"}`} />
                  </div>
                </div>

                <div className="relative z-10">
                  <p className="text-sm font-semibold uppercase tracking-widest text-white/40 mb-2">{stat.label}</p>
                  <p className="text-4xl md:text-5xl font-bold tracking-tight text-white mb-4 tabular-nums">{stat.value}</p>
                  <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.min(100, Math.max(15, stat.value * 3))}%` }}
                      transition={{ duration: 1, delay: 0.5 + idx * 0.1 }}
                      className={`h-full rounded-full ${stat.highlight ? "bg-gradient-to-r from-[#5227FF] to-[#8C6DFD]" : "bg-white/30"}`}
                    />
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </motion.div>

        {/* Right Sidebar */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="flex flex-col gap-6"
        >
          {/* Referral Code */}
          <div className="rounded-[2rem] bg-gradient-to-b from-[#1E2659] to-[#0D1024] border border-[#5227FF]/20 p-7 relative overflow-hidden shadow-[0_20px_40px_-15px_rgba(82,39,255,0.2)]">
            <div className="absolute top-0 bg-[#5227FF] h-[100px] w-[100px] blur-[80px] rounded-full left-1/2 -translate-x-1/2 opacity-30 pointer-events-none" />
            <div className="flex justify-between items-center mb-4 relative z-10">
              <h3 className="text-white font-semibold text-lg tracking-tight">Referral Code</h3>
            </div>
            <div className="relative z-10 rounded-xl border border-[#5227FF]/30 bg-[#5227FF]/10 px-4 py-5 text-center mb-4">
              <p className="font-mono text-2xl md:text-3xl tracking-[0.3em] font-bold text-[#8C6DFD]">
                {referralCode || "PENDING"}
              </p>
            </div>
            <p className="text-xs text-white/50 relative z-10 mb-4">
              Share this code to invite students into {clubName}.
            </p>
            <button
              onClick={copyCode}
              className="relative z-10 w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-white/10 hover:bg-[#5227FF] text-sm font-semibold transition-all text-white/80 hover:text-white"
            >
              <Copy className="h-4 w-4" />
              {codeCopied ? "Copied!" : "Copy Code"}
            </button>
          </div>

          {/* Activity Chart */}
          <div className="rounded-[2rem] bg-[#0A0D20] border border-white/[0.05] p-7 shadow-2xl relative overflow-hidden">
            <div className="flex justify-between items-center mb-8 relative z-10">
              <h3 className="text-white font-semibold text-lg tracking-tight">Growth</h3>
              <Link
                href="/header/analytics"
                className="px-4 py-1.5 rounded-full bg-gradient-to-r from-[#5227FF] to-[#2B4BFF] shadow-[0_0_15px_rgba(82,39,255,0.3)]"
              >
                <span className="text-xs font-semibold text-white flex items-center gap-1">
                  Details <ChevronRight className="h-3 w-3" />
                </span>
              </Link>
            </div>
            <div className="relative h-32 flex items-end justify-between gap-1 z-10 px-2">
              {[30, 50, 40, 70, 85, 45, 60, 90, 65, 80].map((val, i) => (
                <motion.div
                  initial={{ height: 0 }}
                  animate={{ height: `${val}%` }}
                  transition={{ duration: 1, delay: 0.6 + i * 0.05 }}
                  key={i}
                  className="w-full flex justify-center relative group"
                >
                  <div
                    className={`w-1.5 rounded-t-full transition-all duration-300 group-hover:bg-[#5227FF] ${
                      i === 7 ? "bg-[#5227FF] shadow-[0_0_10px_#5227FF]" : "bg-white/[0.08]"
                    }`}
                  />
                </motion.div>
              ))}
            </div>
            <div className="flex justify-between mt-4 px-2 text-[10px] font-bold text-white/30 uppercase">
              <span>Jan</span><span>Feb</span><span>Mar</span>
              <span className="text-white/80">Apr</span><span>May</span><span>Jun</span>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
