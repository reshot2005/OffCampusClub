"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { ShieldAlert, CheckCircle2, AlertTriangle, XCircle } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

type Alert = { id: string; userId: string | null; ipAddress: string; userAgent: string | null; path: string; reason: string; severity: string; resolved: boolean; createdAt: string };

type OtpStats = {
  tokensCreatedLast24h: number;
  byPurposeLast7d: { purpose: string; count: number }[];
};

export default function SecurityPage() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [otpStats, setOtpStats] = useState<OtpStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("false");

  const fetchAlerts = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin-cp/security?resolved=${filter}`);
      const data = await res.json();
      setAlerts(data.alerts);
      if (data.otpStats) setOtpStats(data.otpStats);
    } catch {} finally { setLoading(false); }
  };

  useEffect(() => { fetchAlerts(); }, [filter]);

  const resolve = async (id: string) => {
    try {
      await fetch("/api/admin-cp/security", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) });
      setAlerts((p) => p.map((a) => a.id === id ? { ...a, resolved: true } : a));
      toast.success("Alert resolved");
    } catch { toast.error("Failed"); }
  };

  const severityIcon = (s: string) => {
    if (s === "CRITICAL") return <XCircle className="h-4 w-4 text-red-500" />;
    if (s === "HIGH") return <AlertTriangle className="h-4 w-4 text-orange-400" />;
    return <ShieldAlert className="h-4 w-4 text-amber-400" />;
  };

  const severityBg = (s: string) => {
    if (s === "CRITICAL") return "border-red-500/30 bg-red-500/5";
    if (s === "HIGH") return "border-orange-400/20 bg-orange-500/5";
    return "border-amber-400/20 bg-amber-500/5";
  };

  return (
    <div className="space-y-6">
      <div>
        <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-red-400">Monitoring</p>
        <h1 className="mt-1 text-2xl font-bold text-white flex items-center gap-3">
          <ShieldAlert className="h-6 w-6 text-red-400" /> Security Alerts
        </h1>
      </div>

      {otpStats && (
        <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5">
          <p className="text-[11px] font-bold uppercase tracking-wider text-white/40 mb-3">Email OTP (abuse signal)</p>
          <div className="flex flex-wrap gap-6 text-sm">
            <div>
              <span className="text-white/30 text-xs block">Tokens created (24h)</span>
              <span className="font-mono text-white font-semibold">{otpStats.tokensCreatedLast24h}</span>
            </div>
            <div className="flex flex-wrap gap-3">
              {otpStats.byPurposeLast7d.map((p) => (
                <span key={p.purpose} className="text-xs text-white/50">
                  {p.purpose}: <span className="text-[#5227FF] font-mono">{p.count}</span> <span className="text-white/25">(7d)</span>
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="flex gap-2">
        {[{ v: "false", l: "Unresolved" }, { v: "true", l: "Resolved" }].map(({ v, l }) => (
          <button key={v} onClick={() => setFilter(v)}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${filter === v ? "bg-[#5227FF] text-white" : "bg-white/5 text-white/40"}`}>
            {l}
          </button>
        ))}
      </div>

      <div className="space-y-2">
        {loading && <div className="py-12 text-center text-white/20">Loading...</div>}
        {!loading && alerts.map((a) => (
          <motion.div key={a.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className={`flex items-start gap-4 p-4 rounded-xl border ${severityBg(a.severity)} ${a.resolved ? "opacity-50" : ""}`}>
            <div className="pt-0.5">{severityIcon(a.severity)}</div>
            <div className="flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded-full ${a.severity === "CRITICAL" ? "bg-red-500/20 text-red-400" : a.severity === "HIGH" ? "bg-orange-500/20 text-orange-300" : "bg-amber-500/20 text-amber-200"}`}>{a.severity}</span>
                <span className="text-xs font-mono text-white/50">{a.reason}</span>
              </div>
              <p className="text-[11px] text-white/60 mt-1">{a.path}</p>
              <div className="flex items-center gap-3 mt-1 text-[10px] text-white/25">
                <span>IP: {a.ipAddress}</span>
                {a.userId && <span>User: {a.userId.slice(0, 8)}...</span>}
                <span>{formatDistanceToNow(new Date(a.createdAt), { addSuffix: true })}</span>
              </div>
            </div>
            {!a.resolved && (
              <button onClick={() => resolve(a.id)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#00E87A]/10 text-[#00E87A] text-xs font-bold hover:bg-[#00E87A]/20">
                <CheckCircle2 className="h-3.5 w-3.5" /> Resolve
              </button>
            )}
          </motion.div>
        ))}
        {!loading && alerts.length === 0 && <div className="py-12 text-center text-white/20">No alerts</div>}
      </div>
    </div>
  );
}
