
"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Download, Users, Grid3X3, UserCog, ShieldCheck, Mail, Lock, X, Loader2 } from "lucide-react";
import { toast } from "sonner";

const exportCategories = [
  { type: "users", label: "Users Details", desc: "Full directory including phone, email, college, and referral history", icon: Users, color: "#5227FF" },
  { type: "headers", label: "Club Headers", desc: "List of all club headers, their assigned clubs, and active referral codes", icon: UserCog, color: "#00E87A" },
  { type: "clubs", label: "Club Overview", desc: "Summary of all active clubs, member counts, and header assignments", icon: Grid3X3, color: "#8C6DFD" },
];

export default function ExportPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [step, setStep] = useState<"email" | "otp">("email");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [exportToken, setExportToken] = useState<string | null>(null);
  const [pendingType, setPendingType] = useState<string | null>(null);

  const startExport = (type: string) => {
    if (exportToken) {
      executeDownload(type, exportToken);
    } else {
      setPendingType(type);
      setIsModalOpen(true);
    }
  };

  const requestOtp = async () => {
    if (!email) { toast.error("Please enter your admin email"); return; }
    setLoading(true);
    try {
      const res = await fetch("/api/admin-cp/export/request-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to send OTP");
      toast.success("6-digit verification code sent to your email");
      setStep("otp");
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const verifyOtp = async () => {
    if (otp.length !== 6) { toast.error("Enter valid 6-digit OTP"); return; }
    setLoading(true);
    try {
      const res = await fetch("/api/admin-cp/export/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Verification failed");
      
      setExportToken(data.exportToken);
      setIsModalOpen(false);
      toast.success("Identity verified. Starting download...");
      if (pendingType) {
        executeDownload(pendingType, data.exportToken);
      }
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const executeDownload = async (type: string, token: string) => {
    toast.info(`Generating ${type} Excel report...`);
    try {
      const res = await fetch(`/api/admin-cp/export/${type}`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (!res.ok) {
        const errData = await res.json();
        if (res.status === 401) setExportToken(null);
        throw new Error(errData.error || "Export failed");
      }
      
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `occ-${type}-${new Date().toISOString().split("T")[0]}.xlsx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success(`${type} report downloaded successfully`);
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#5227FF]">Maintenance & Records</p>
        <h1 className="mt-1 text-2xl font-bold text-white flex items-center gap-3">
          <Download className="h-6 w-6 text-[#5227FF]" /> Advanced Export
        </h1>
        <p className="text-sm text-white/40 mt-1">Download secure Excel reports (Requires Email/OTP Verification)</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {exportCategories.map((ex, i) => (
          <motion.button
            key={ex.type}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            onClick={() => startExport(ex.type)}
            className="group flex flex-col items-start gap-4 p-6 rounded-2xl border border-white/[0.06] bg-white/[0.02] hover:border-[#5227FF]/20 text-left transition-all hover:bg-white/[0.04] relative overflow-hidden"
          >
            <div className="p-3 rounded-xl" style={{ background: `${ex.color}15` }}>
              <ex.icon className="h-6 w-6" style={{ color: ex.color }} />
            </div>
            <div>
              <p className="font-bold text-white text-lg">{ex.label}</p>
              <p className="text-xs text-white/35 mt-2 leading-relaxed">{ex.desc}</p>
            </div>
            <div className="mt-4 flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-[#5227FF] group-hover:text-white transition-colors">
              <Download className="h-3.5 w-3.5" /> Start Download
            </div>
          </motion.button>
        ))}
      </div>

      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-md bg-[#0F111A] border border-white/[0.08] rounded-3xl p-8 relative shadow-2xl"
            >
              <button onClick={() => setIsModalOpen(false)} className="absolute top-6 right-6 p-2 text-white/20 hover:text-white">
                <X className="h-5 w-5" />
              </button>

              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#5227FF]/20 mb-6">
                <ShieldCheck className="h-6 w-6 text-[#5227FF]" />
              </div>

              <h2 className="text-xl font-bold text-white">Security Verification</h2>
              <p className="text-sm text-white/40 mt-1 mb-6">
                {step === "email" 
                  ? "Enter your personal email address to receive a one-time verification code for this export." 
                  : `Please enter the 6-digit code sent to ${email}`}
              </p>

              {step === "email" ? (
                <div className="space-y-4">
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-white/20" />
                    <input
                      type="email"
                      placeholder="Personal Email Address"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full h-12 bg-white/[0.03] border border-white/10 rounded-xl pl-12 pr-4 text-white outline-none focus:border-[#5227FF]/50"
                    />
                  </div>
                  <button
                    disabled={loading}
                    onClick={requestOtp}
                    className="w-full h-12 bg-[#5227FF] hover:bg-[#4316FF] text-white font-bold rounded-xl transition-all flex items-center justify-center gap-2"
                  >
                    {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : "Send Authorization Code"}
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-white/20" />
                    <input
                      type="text"
                      maxLength={6}
                      placeholder="Enter 6-digit OTP"
                      value={otp}
                      onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                      className="w-full h-12 bg-white/[0.03] border border-white/10 rounded-xl pl-12 pr-4 text-white font-mono tracking-[0.5em] text-center outline-none focus:border-[#5227FF]/50"
                    />
                  </div>
                  <button
                    disabled={loading}
                    onClick={verifyOtp}
                    className="w-full h-12 bg-[#00E87A] hover:bg-[#00D16E] text-[#070914] font-black rounded-xl transition-all flex items-center justify-center gap-2"
                  >
                    {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : "Verify & Download"}
                  </button>
                  <button 
                    onClick={() => setStep("email")}
                    className="w-full text-center text-xs text-white/20 hover:text-white"
                  >
                    Use a different email address
                  </button>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
