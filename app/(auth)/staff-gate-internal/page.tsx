"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "motion/react";
import { Loader2, Shield } from "lucide-react";
import Link from "next/link";
import { STAFF_PUBLIC_PREFIX } from "@/lib/staff-paths";

function StaffGateInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextPath = searchParams.get("next") || STAFF_PUBLIC_PREFIX;

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [stage, setStage] = useState<"password" | "otp">("password");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(stage === "otp" ? { email, password, otp } : { email, password }),
      });
      const data = (await res.json().catch(() => null)) as {
        error?: string;
        role?: string;
        approvalStatus?: string;
        mfaRequired?: boolean;
      } | null;
      if (res.status === 202 && data?.mfaRequired) {
        setStage("otp");
        setError("");
        return;
      }
      if (!res.ok) {
        setError(data?.error ?? "Access denied.");
        return;
      }
      if (data?.role !== "ADMIN") {
        setError("This entrance is for platform staff only.");
        return;
      }
      router.push(nextPath.startsWith("/") ? nextPath : `/${nextPath}`);
      router.refresh();
    } catch {
      setError("Something went wrong. Try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0C0C0A] text-[#F5F1EB] flex flex-col items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md rounded-2xl border border-[#C9A96E]/25 bg-[rgba(255,248,235,0.04)] p-8 shadow-[0_0_80px_rgba(0,0,0,0.6)]"
      >
        <div className="mb-8 flex flex-col items-center text-center">
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-[#C9A96E]/40 bg-[#C9A96E]/10">
            <Shield className="h-7 w-7 text-[#C9A96E]" />
          </div>
          <p className="font-mono text-[10px] uppercase tracking-[0.5em] text-[#C9A96E]">Restricted</p>
          <h1 className="mt-2 font-serif text-3xl italic text-[#F5F1EB]">Staff access</h1>
          <p className="mt-2 text-sm text-white/50">Sign in with your staff credentials. Student accounts cannot use this page.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="font-mono text-[10px] uppercase tracking-widest text-white/40">Email</label>
            <input
              type="email"
              autoComplete="username"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="mt-1 w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-[#F5F1EB] outline-none placeholder:text-white/30 focus:border-[#C9A96E]/50"
              placeholder="staff@…"
            />
          </div>
          <div>
            <label className="font-mono text-[10px] uppercase tracking-widest text-white/40">Password</label>
            <input
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="mt-1 w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-[#F5F1EB] outline-none placeholder:text-white/30 focus:border-[#C9A96E]/50"
              placeholder="••••••••"
            />
          </div>
          {stage === "otp" ? (
            <div>
              <label className="font-mono text-[10px] uppercase tracking-widest text-white/40">OTP</label>
              <input
                inputMode="numeric"
                pattern="\\d{6}"
                maxLength={6}
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\\D/g, "").slice(0, 6))}
                required
                className="mt-1 w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-[#F5F1EB] outline-none placeholder:text-white/30 focus:border-[#C9A96E]/50"
                placeholder="6-digit code"
              />
              <p className="mt-2 text-xs text-white/40">
                We emailed a 6-digit code to you. Submit again to verify.
              </p>
            </div>
          ) : null}
          {error ? (
            <p className="rounded-lg border border-[#FF4D4D]/35 bg-[#FF4D4D]/10 px-3 py-2 text-sm text-[#FF4D4D]">{error}</p>
          ) : null}
          <button
            type="submit"
            disabled={loading}
            className="flex w-full items-center justify-center gap-2 rounded-full bg-[#C9A96E] py-3 text-sm font-semibold text-[#0C0C0A] disabled:opacity-50"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Verifying…
              </>
            ) : (
              "Enter panel"
            )}
          </button>
        </form>

        <p className="mt-8 text-center text-xs text-white/40">
          Student or club member?{" "}
          <Link href="/login" className="text-[#C9A96E] hover:underline">
            Main sign-in
          </Link>
        </p>
      </motion.div>
    </div>
  );
}

export default function StaffGatePage() {
  return (
    <Suspense
      fallback={<div className="min-h-screen bg-[#0C0C0A]" aria-hidden />}
    >
      <StaffGateInner />
    </Suspense>
  );
}
