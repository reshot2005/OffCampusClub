"use client";

import { motion } from "framer-motion";
import { TrendingUp, Users, FileText, BarChart3 } from "lucide-react";

type Props = {
  signupsByDay: { date: string; count: number }[];
  postsByDay: { date: string; count: number }[];
  topClubs: { name: string; members: number }[];
  roleDistribution: { role: string; count: number }[];
  funnel: {
    totalUsers: number;
    onboardingComplete: number;
    withClubMembership: number;
    withPost: number;
  };
  referralByClub: { clubName: string; signups: number }[];
};

function MiniChart({ data, color, label }: { data: { date: string; count: number }[]; color: string; label: string }) {
  const max = Math.max(1, ...data.map((d) => d.count));
  const total = data.reduce((s, d) => s + d.count, 0);

  return (
    <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-white">{label}</h3>
        <span className="text-xs font-mono px-2 py-1 rounded-lg bg-white/5 text-white/50">{total} total</span>
      </div>
      <div className="flex items-end gap-[2px] h-20">
        {data.slice(-30).map((d, i) => (
          <motion.div key={d.date} className="flex-1 rounded-t-sm min-w-[2px]"
            initial={{ height: 0 }} animate={{ height: `${Math.max(4, (d.count / max) * 100)}%` }}
            transition={{ duration: 0.5, delay: i * 0.02 }}
            style={{ background: d.count > 0 ? color : "rgba(255,255,255,0.04)" }}
            title={`${d.date}: ${d.count}`}
          />
        ))}
      </div>
      <div className="flex justify-between mt-2 text-[9px] text-white/20 font-mono">
        <span>{data[0]?.date.slice(5)}</span>
        <span>{data[data.length - 1]?.date.slice(5)}</span>
      </div>
    </div>
  );
}

function FunnelStep({ label, value, total }: { label: string; value: number; total: number }) {
  const pct = total > 0 ? ((value / total) * 100).toFixed(1) : "0";
  return (
    <div className="flex items-center justify-between gap-3 py-2 border-b border-white/[0.04] last:border-0">
      <span className="text-xs text-white/60">{label}</span>
      <span className="text-xs font-mono text-[#5227FF]">
        {value} <span className="text-white/25">({pct}%)</span>
      </span>
    </div>
  );
}

export function AnalyticsDashboard({
  signupsByDay,
  postsByDay,
  topClubs,
  roleDistribution,
  funnel,
  referralByClub,
}: Props) {
  const totalRoles = roleDistribution.reduce((s, r) => s + r.count, 0);
  const maxMembers = Math.max(1, ...topClubs.map((c) => c.members));
  const maxRef = Math.max(1, ...referralByClub.map((r) => r.signups));

  return (
    <div className="space-y-6">
      <div>
        <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#5227FF]">Insights</p>
        <h1 className="mt-1 text-2xl font-bold text-white flex items-center gap-3">
          <TrendingUp className="h-6 w-6 text-[#5227FF]" /> Analytics
        </h1>
        <p className="text-sm text-white/40 mt-1">Real platform data — last 30 days</p>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <MiniChart data={signupsByDay} color="#5227FF" label="Signups / day" />
        <MiniChart data={postsByDay} color="#00E87A" label="Posts / day" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5">
          <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
            <FileText className="h-4 w-4 text-[#00E87A]" /> Activation funnel
          </h3>
          <p className="text-[10px] text-white/30 mb-2">Share of all users reaching each milestone</p>
          <FunnelStep label="Registered" value={funnel.totalUsers} total={funnel.totalUsers} />
          <FunnelStep label="Onboarding complete" value={funnel.onboardingComplete} total={funnel.totalUsers} />
          <FunnelStep label="Joined ≥1 club" value={funnel.withClubMembership} total={funnel.totalUsers} />
          <FunnelStep label="Created ≥1 post" value={funnel.withPost} total={funnel.totalUsers} />
        </div>
        <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5">
          <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-[#D4AF37]" /> Referral signups by club
          </h3>
          <div className="space-y-2">
            {referralByClub.length === 0 && (
              <p className="text-xs text-white/25">No referral stats yet</p>
            )}
            {referralByClub.map((r, i) => (
              <div key={r.clubName + i} className="flex items-center gap-2">
                <span className="text-[10px] text-white/40 w-24 truncate">{r.clubName}</span>
                <div className="flex-1 h-1.5 bg-white/[0.04] rounded-full overflow-hidden">
                  <motion.div
                    className="h-full rounded-full bg-gradient-to-r from-[#D4AF37] to-[#FF6B35]"
                    initial={{ width: 0 }}
                    animate={{ width: `${(r.signups / maxRef) * 100}%` }}
                    transition={{ duration: 0.6, delay: i * 0.04 }}
                  />
                </div>
                <span className="text-[10px] font-mono text-white/50 w-8">{r.signups}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Top Clubs */}
        <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5">
          <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-[#5227FF]" /> Top Clubs by Members
          </h3>
          <div className="space-y-2.5">
            {topClubs.map((c, i) => (
              <motion.div key={c.name} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}
                className="flex items-center gap-3">
                <span className="text-[10px] font-bold text-white/25 w-5 text-right">{i + 1}</span>
                <div className="flex-1">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-xs font-medium text-white/80">{c.name}</span>
                    <span className="text-[10px] font-mono text-white/35">{c.members}</span>
                  </div>
                  <div className="h-1.5 w-full bg-white/[0.04] rounded-full overflow-hidden">
                    <motion.div className="h-full rounded-full bg-gradient-to-r from-[#5227FF] to-[#8C6DFD]"
                      initial={{ width: 0 }} animate={{ width: `${(c.members / maxMembers) * 100}%` }}
                      transition={{ duration: 0.8, delay: i * 0.05 }}
                    />
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Role Distribution */}
        <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5">
          <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
            <Users className="h-4 w-4 text-[#5227FF]" /> User Roles
          </h3>
          <div className="space-y-4">
            {roleDistribution.map((r) => {
              const pct = totalRoles > 0 ? ((r.count / totalRoles) * 100).toFixed(1) : "0";
              const color = r.role === "ADMIN" ? "#FF6B35" : r.role === "CLUB_HEADER" ? "#D4AF37" : "#5227FF";
              return (
                <div key={r.role}>
                  <div className="flex justify-between mb-1.5">
                    <span className="text-xs text-white/70">{r.role}</span>
                    <span className="text-xs font-mono text-white/40">{r.count} ({pct}%)</span>
                  </div>
                  <div className="h-2 w-full bg-white/[0.04] rounded-full overflow-hidden">
                    <motion.div className="h-full rounded-full" style={{ background: color }}
                      initial={{ width: 0 }} animate={{ width: `${(r.count / totalRoles) * 100}%` }}
                      transition={{ duration: 0.8 }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
