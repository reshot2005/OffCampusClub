"use client";

import { motion } from "framer-motion";
import { Users, PenSquare, TrendingUp, ArrowUpRight } from "lucide-react";

type OnboardingInsight = {
  key: string;
  prompt: string;
  total: number;
  options: {
    label: string;
    count: number;
    percentage: number;
  }[];
};

export function AnalyticsClient({
  totalMembers,
  totalPosts,
  onboardingInsights,
  clubName,
}: {
  totalMembers: number;
  totalPosts: number;
  onboardingInsights: OnboardingInsight[];
  clubName: string;
}) {
  const metrics = [
    { label: "Members via Referral", value: totalMembers, icon: Users, change: "+12%", color: "#5227FF" },
    { label: "Posts Published", value: totalPosts, icon: PenSquare, change: "+8%", color: "#8C6DFD" },
    { label: "Engagement Rate", value: "78%", icon: TrendingUp, change: "+5%", color: "#00E87A" },
  ];

  return (
    <div className="space-y-8">
      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        {metrics.map((m, idx) => (
          <motion.div
            key={m.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
            className="rounded-[2rem] border border-white/[0.05] bg-white/[0.02] backdrop-blur-xl p-7 relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 h-24 w-24 rounded-full blur-[50px] pointer-events-none" style={{ backgroundColor: m.color, opacity: 0.15 }} />
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-6">
                <div className="p-3 rounded-xl bg-white/5">
                  <m.icon className="h-5 w-5 text-white/70" />
                </div>
                <div className="flex items-center gap-1 text-xs font-semibold" style={{ color: m.color }}>
                  <ArrowUpRight className="h-3 w-3" />
                  {m.change}
                </div>
              </div>
              <p className="text-3xl font-bold text-white tabular-nums">{m.value}</p>
              <p className="text-xs text-white/40 mt-1 uppercase tracking-widest">{m.label}</p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Growth Chart */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="rounded-[2rem] border border-white/[0.05] bg-white/[0.02] backdrop-blur-xl p-8 relative overflow-hidden"
      >
        <div className="absolute top-0 left-0 h-40 w-40 rounded-full bg-[#5227FF]/10 blur-[80px] pointer-events-none" />
        <h3 className="text-lg font-semibold text-white mb-8 relative z-10">Growth Over Time</h3>
        <div className="relative h-48 flex items-end justify-between gap-2 z-10">
          {[20, 35, 28, 45, 55, 40, 65, 75, 60, 85, 70, 90].map((val, i) => (
            <motion.div
              initial={{ height: 0 }}
              animate={{ height: `${val}%` }}
              transition={{ duration: 1, delay: 0.4 + i * 0.05 }}
              key={i}
              className="w-full flex justify-center relative group cursor-pointer"
            >
              <div className={`w-full max-w-[20px] rounded-t-lg transition-all duration-300 group-hover:bg-[#5227FF] ${
                i === 11 ? "bg-gradient-to-t from-[#5227FF] to-[#8C6DFD] shadow-[0_0_15px_rgba(82,39,255,0.5)]" : "bg-white/[0.06] group-hover:shadow-[0_0_10px_rgba(82,39,255,0.3)]"
              }`} />
              {i === 11 && (
                <div className="absolute -top-8 px-2 py-0.5 bg-[#5227FF] text-white text-[10px] font-bold rounded-lg shadow-lg">
                  {val}%
                </div>
              )}
            </motion.div>
          ))}
        </div>
        <div className="flex justify-between mt-4 text-[10px] font-semibold text-white/30 uppercase">
          {["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"].map(m => (
            <span key={m}>{m}</span>
          ))}
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.45 }}
        className="rounded-[2rem] border border-white/[0.05] bg-white/[0.02] backdrop-blur-xl p-8 relative overflow-hidden"
      >
        <div className="absolute bottom-0 right-0 h-40 w-40 rounded-full bg-[#D4AF37]/10 blur-[90px] pointer-events-none" />
        <div className="relative z-10">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h3 className="text-lg font-semibold text-white">Onboarding Signals</h3>
              <p className="mt-1 text-sm text-white/45">
                Answer breakdown from referred members entering {clubName}.
              </p>
            </div>
            <p className="text-[10px] uppercase tracking-[0.28em] text-white/30">
              Referred cohort only
            </p>
          </div>

          {onboardingInsights.length === 0 || onboardingInsights.every((item) => item.total === 0) ? (
            <div className="mt-8 rounded-[1.5rem] border border-white/[0.05] bg-white/[0.02] px-5 py-6 text-sm text-white/45">
              No onboarding responses saved yet for your referred members.
            </div>
          ) : (
            <div className="mt-8 space-y-8">
              {onboardingInsights.map((question) => (
                <div key={question.key} className="space-y-4">
                  <div className="flex flex-col gap-1">
                    <h4 className="text-base font-semibold text-white">{question.prompt}</h4>
                    <p className="text-[11px] uppercase tracking-[0.22em] text-white/25">
                      {question.total} responses
                    </p>
                  </div>

                  <div className="space-y-3">
                    {question.options.map((option) => (
                      <div key={option.label} className="space-y-1.5">
                        <div className="flex items-center justify-between gap-4 text-sm text-white/78">
                          <span>{option.label}</span>
                          <span className="tabular-nums text-white/40">
                            {option.count} · {option.percentage}%
                          </span>
                        </div>
                        <div className="h-2 overflow-hidden rounded-full bg-white/[0.05]">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${option.percentage}%` }}
                            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                            className="h-full rounded-full bg-gradient-to-r from-[#5227FF] via-[#8C6DFD] to-[#D4AF37]"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
