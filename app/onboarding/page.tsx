"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "motion/react";
import { Loader2, CheckCircle2, XCircle, ArrowRight, MessageCircle, Globe, Users, GraduationCap } from "lucide-react";
import { toast } from "sonner";

const REFERRAL_SOURCES = [
  { id: "Instagram", icon: Globe },
  { id: "LinkedIn", icon: MessageCircle },
  { id: "From a friend", icon: Users },
  { id: "Official college event", icon: GraduationCap },
  { id: "Google search", icon: Globe },
  { id: "Other", icon: Users },
];

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  
  // Step 1
  const [referralSource, setReferralSource] = useState("");
  
  // Step 2
  const [referralCode, setReferralCode] = useState("");
  const [codeValidating, setCodeValidating] = useState(false);
  const [codeValid, setCodeValid] = useState<boolean | null>(null);
  const [clubInfo, setClubInfo] = useState<{name: string, headerName: string} | null>(null);

  // Debounce referral code validation
  useEffect(() => {
    if (!referralCode) {
      setCodeValid(null);
      setClubInfo(null);
      return;
    }

    const validateCode = async () => {
      setCodeValidating(true);
      try {
        const res = await fetch("/api/referral/validate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ code: referralCode.trim().toUpperCase() }),
        });
        const data = await res.json();
        
        if (data.valid) {
          setCodeValid(true);
          setClubInfo({ name: data.club?.name || "the club", headerName: data.headerName });
        } else {
          setCodeValid(false);
          setClubInfo(null);
        }
      } catch (err) {
        setCodeValid(false);
        setClubInfo(null);
      } finally {
        setCodeValidating(false);
      }
    };

    const timer = setTimeout(validateCode, 500);
    return () => clearTimeout(timer);
  }, [referralCode]);

  const handleNextStep = () => {
    if (!referralSource) {
      toast.error("Please select an option to continue");
      return;
    }
    setStep(2);
  };

  const handleComplete = async (skipCode = false) => {
    setLoading(true);
    try {
      const payload = {
        referralSource,
        referralCode: skipCode ? "" : referralCode.trim().toUpperCase(),
      };

      const res = await fetch("/api/onboarding/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error("Failed to complete onboarding");
      
      // Force refresh to update session and move to dashboard
      router.push("/dashboard");
      router.refresh();
    } catch (err) {
      toast.error("Something went wrong. Please try again.");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white flex items-center justify-center p-6 relative overflow-hidden">
      {/* Background glow effects */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-blue-600/10 blur-[120px]" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-purple-600/10 blur-[120px]" />

      <div className="w-full max-w-xl mx-auto z-10">
        {/* Progress header */}
        <div className="mb-12 flex justify-between items-center text-sm font-medium text-white/40 border-b border-white/10 pb-6">
          <div className="flex space-x-2">
            <span className="text-white">OCC.</span>
          </div>
          <div className="flex space-x-2 items-center">
            <span className={step >= 1 ? "text-white" : ""}>01</span>
            <span className="w-8 h-[1px] bg-white/20 block" />
            <span className={step >= 2 ? "text-white" : ""}>02</span>
          </div>
        </div>

        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.4, ease: "easeOut" }}
              className="space-y-8"
            >
              <div>
                <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4 text-white">
                  Welcome aboard.
                </h1>
                <p className="text-lg text-white/50">
                  How did you reach us? Tell us how you heard about OCC.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {REFERRAL_SOURCES.map((source) => {
                  const Icon = source.icon as any;
                  const isSelected = referralSource === source.id;
                  return (
                    <button
                      key={source.id}
                      onClick={() => setReferralSource(source.id)}
                      className={`flex flex-col items-start p-5 rounded-2xl border transition-all duration-300 ${
                        isSelected 
                        ? "border-blue-500 bg-blue-500/10 shadow-[0_0_20px_rgba(59,130,246,0.15)]" 
                        : "border-white/10 bg-white/[0.02] hover:bg-white/[0.05] hover:border-white/20"
                      }`}
                    >
                      <Icon className={`w-6 h-6 mb-4 ${isSelected ? "text-blue-400" : "text-white/40"}`} />
                      <span className={`font-medium ${isSelected ? "text-white" : "text-white/70"}`}>
                        {source.id}
                      </span>
                    </button>
                  );
                })}
              </div>

              <div className="pt-6">
                <button
                  onClick={handleNextStep}
                  disabled={!referralSource}
                  className="w-full flex items-center justify-center space-x-2 bg-white text-black py-4 rounded-xl font-semibold text-lg hover:bg-gray-100 transition duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <span>Continue</span>
                  {React.createElement(ArrowRight as any, { className: "w-5 h-5" })}
                </button>
              </div>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.4, ease: "easeOut" }}
              className="space-y-8"
            >
              <div>
                <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4 text-white">
                  Got an invite?
                </h1>
                <p className="text-lg text-white/50">
                  Enter your referral code to join a specific club. You can skip this if you don't have one.
                </p>
              </div>

              <div className="space-y-4">
                <label className="text-sm font-medium text-white/60 uppercase tracking-wider">
                  Referral Code
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={referralCode}
                    onChange={(e) => setReferralCode(e.target.value.toUpperCase())}
                    placeholder="e.g. OCC2024"
                    className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-5 py-4 text-white font-medium text-lg focus:outline-none focus:border-white/30 focus:bg-white/[0.05] transition-all placeholder:text-white/20 uppercase"
                  />
                  {codeValidating && (
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 text-white/40">
                      {React.createElement(Loader2 as any, { className: "w-5 h-5 animate-spin" })}
                    </div>
                  )}
                </div>

                <AnimatePresence>
                  {codeValid === true && clubInfo && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="flex items-center space-x-2 text-emerald-400 text-sm font-medium bg-emerald-400/10 px-4 py-3 rounded-lg border border-emerald-400/20 overflow-hidden"
                    >
                      {React.createElement(CheckCircle2 as any, { className: "w-4 h-4 shrink-0" })}
                      <span>Valid code! You'll be joining <strong>{clubInfo.name}</strong> alongside {clubInfo.headerName}.</span>
                    </motion.div>
                  )}
                  {codeValid === false && referralCode.length > 0 && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="flex items-center space-x-2 text-rose-400 text-sm font-medium bg-rose-400/10 px-4 py-3 rounded-lg border border-rose-400/20 overflow-hidden"
                    >
                      {React.createElement(XCircle as any, { className: "w-4 h-4 shrink-0" })}
                      <span>Invalid or expired referral code.</span>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <div className="pt-6 flex flex-col space-y-4">
                <button
                  type="button"
                  onClick={() => handleComplete(false)}
                  disabled={
                    loading ||
                    (referralCode.trim().length > 0 && codeValid !== true)
                  }
                  className="w-full flex items-center justify-center space-x-2 bg-white text-black py-4 rounded-xl font-semibold text-lg hover:bg-gray-100 transition duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                     <>
                        {React.createElement(Loader2 as any, { className: "w-5 h-5 animate-spin" })}
                        <span>Completing...</span>
                     </>
                  ) : (
                    <span>{referralCode.trim() ? "Continue with this code" : "Continue without a code"}</span>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => handleComplete(true)}
                  disabled={loading}
                  className="w-full py-3 text-sm font-medium text-white/50 hover:text-white/80 transition-colors disabled:opacity-30"
                >
                  Skip — I don&apos;t have a referral code
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
