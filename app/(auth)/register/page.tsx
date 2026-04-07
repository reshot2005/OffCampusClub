"use client";

import React, { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "motion/react";
import Link from "next/link";
import { Loader2, Mail, CheckCircle2, ShieldCheck, Sparkles } from "lucide-react";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/app/components/ui/input-otp";
import { Interactive3DModel } from "@/app/components/auth/Interactive3DModel";

function RegisterPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const oauthError = searchParams.get("error");

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [sendingOtp, setSendingOtp] = useState(false);
  const [otpHint, setOtpHint] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [referralCode, setReferralCode] = useState("");
  const [referralMeta, setReferralMeta] = useState<{ valid: boolean; club?: { name: string }; headerName?: string } | null>(null);
  const [referralChecking, setReferralChecking] = useState(false);

  useEffect(() => {
    const trimmed = referralCode.trim();
    if (!trimmed) {
      setReferralMeta(null);
      setReferralChecking(false);
      return;
    }

    setReferralChecking(true);
    const timer = window.setTimeout(async () => {
      try {
        const res = await fetch("/api/referral/validate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ code: trimmed }),
        });
        const data = (await res.json()) as { valid?: boolean; club?: { name: string }; headerName?: string };
        setReferralMeta(
          data && typeof data.valid === "boolean"
            ? { valid: data.valid, club: data.club, headerName: data.headerName }
            : { valid: false },
        );
      } catch {
        setReferralMeta({ valid: false });
      } finally {
        setReferralChecking(false);
      }
    }, 450);

    return () => window.clearTimeout(timer);
  }, [referralCode]);

  const sendVerificationCode = async () => {
    setError("");
    setSuccess("");
    setOtpHint(null);
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setError("Enter a valid email before requesting a code.");
      return;
    }
    setSendingOtp(true);
    try {
      const res = await fetch("/api/auth/register/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });
      if (!res.ok) {
        setError("Could not send verification email. Check SMTP settings or try again.");
        return;
      }
      setOtpHint("Check your inbox for a 6-digit code (valid ~10 minutes).");
    } catch {
      setError("Could not send verification email. Try again.");
    } finally {
      setSendingOtp(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!/^[6-9]\d{9}$/.test(phone.trim())) {
      setError("Enter a valid 10-digit Indian mobile number starting with 6-9.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }
    if (!/[A-Z]/.test(password)) {
      setError("Password must include an uppercase letter");
      return;
    }
    if (!/[a-z]/.test(password)) {
      setError("Password must include a lowercase letter");
      return;
    }
    if (!/\d/.test(password)) {
      setError("Password must include a number");
      return;
    }

    if (!/^\d{6}$/.test(otp)) {
      setError('Enter the 6-digit code from your email (tap "Send verification code" first).');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          fullName: name.trim(),
          email: email.trim(),
          phoneNumber: phone.trim(),
          password,
          confirmPassword,
          otp,
          referralCode: referralCode.trim() || undefined,
        }),
      });

      const data = (await res.json().catch(() => null)) as { error?: string } | null;
      if (!res.ok) {
        setError(data?.error ?? "Registration failed. Please try again.");
        return;
      }

      setSuccess("Registration successful. Redirecting to dashboard...");
      window.setTimeout(() => {
        router.replace("/dashboard");
        router.refresh();
      }, 600);
    } catch {
      setError("Registration failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignup = () => {
    const params = new URLSearchParams();
    params.set("redirect", "/dashboard");
    params.set("from", "register");
    const code = referralCode.trim().toUpperCase();
    if (code.length >= 3) {
      params.set("referral", code);
    }
    window.location.assign(`/api/auth/google/start?${params.toString()}`);
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Side - Register Form */}
      <motion.div
        initial={{ opacity: 0, x: -50 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full lg:w-1/2 flex flex-col justify-center px-8 md:px-16 lg:px-24 bg-white"
      >
        {/* Logo */}
        <div className="mb-12">
          <h1 className="text-4xl font-black tracking-tight text-gray-900 flex items-center">
            occ
            <motion.span
              animate={{ y: [0, -8, 0] }}
              transition={{
                duration: 1,
                repeat: Infinity,
                ease: "easeInOut"
              }}
              className="ml-1.5 h-3 w-3 rounded-full bg-[#3B5BFF]"
            />
          </h1>
          <p className="text-sm text-gray-500 mt-1">Off Campus Clubs</p>
        </div>

        {/* Heading */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.6 }}
          className="mb-8"
        >
          <h2 className="text-5xl md:text-6xl font-black text-gray-900 mb-2">
            Welcome!
          </h2>
          <p className="text-gray-600">Create your OCC account to get started</p>
        </motion.div>

        {oauthError ? (
          <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">
            {oauthError}
          </div>
        ) : null}

        {/* Form */}
        <motion.form
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.6 }}
          onSubmit={handleSubmit}
          className="space-y-5"
        >
          {/* Google Signup Button */}
          <button
            type="button"
            onClick={handleGoogleSignup}
            className="w-full flex items-center justify-center gap-3 px-4 py-3.5 bg-white border border-gray-300 rounded-xl text-gray-700 font-medium hover:bg-gray-50 transition-colors"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            Sign up with Google
          </button>

          {/* Divider */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-white text-gray-500">or</span>
            </div>
          </div>

          {/* Name Input */}
          <div>
            <input
              type="text"
              placeholder="Full name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full px-5 py-4 bg-white border-2 border-gray-400 rounded-2xl text-sm font-bold text-gray-900 placeholder:text-gray-500 focus:outline-none focus:border-gray-900 focus:ring-4 focus:ring-gray-900/5 transition-all"
            />
          </div>

          {/* Email Input */}
          <div className="space-y-2">
            <input
              type="email"
              placeholder="Your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-5 py-4 bg-white border-2 border-gray-400 rounded-2xl text-sm font-bold text-gray-900 placeholder:text-gray-500 focus:outline-none focus:border-gray-900 focus:ring-4 focus:ring-gray-900/5 transition-all"
            />
            <button
              type="button"
              onClick={() => void sendVerificationCode()}
              disabled={sendingOtp}
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-gray-300 bg-gray-50 py-3 text-sm font-semibold text-gray-800 transition hover:bg-gray-100 disabled:opacity-50"
            >
              {sendingOtp ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Mail className="h-4 w-4" />
              )}
              Send verification code
            </button>
            {otpHint ? <p className="text-xs text-green-700">{otpHint}</p> : null}
          </div>

          <div className="space-y-4">
            <label className="text-xs font-black ml-1 uppercase tracking-widest text-[12px] text-gray-900">Verification Code</label>
            <div className="flex justify-center">
              <InputOTP
                maxLength={6}
                value={otp}
                onChange={(v) => setOtp(v.replace(/\D/g, ""))}
                containerClassName="gap-2"
              >
                <InputOTPGroup className="gap-2">
                  {Array.from({ length: 6 }, (_, i) => (
                    <InputOTPSlot key={i} index={i} className="h-16 w-14 rounded-2xl border-2 border-gray-400 bg-white text-lg font-black text-gray-900 shadow-sm transition-all focus:ring-4 focus:ring-gray-900/5 focus:border-gray-900" />
                  ))}
                </InputOTPGroup>
              </InputOTP>
            </div>
          </div>

          <div>
            <input
              type="text"
              placeholder="CLUB REFERRAL CODE"
              value={referralCode}
              onChange={(e) => setReferralCode(e.target.value.toUpperCase())}
              required
              className={`w-full px-5 py-4 bg-white border-2 rounded-2xl text-sm font-bold text-gray-900 placeholder:text-gray-500 placeholder:uppercase placeholder:font-black placeholder:tracking-widest focus:outline-none focus:border-gray-900 focus:ring-4 transition-all ${referralMeta?.valid ? "border-emerald-500 focus:ring-emerald-500/5 focus:border-emerald-500" : "border-gray-400 focus:ring-gray-900/5"
                }`}
            />
            {referralChecking && referralCode.trim().length >= 3 ? (
              <p className="mt-1 text-xs text-gray-400 ml-1">Checking code…</p>
            ) : null}
            <p className="mt-2 text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Ask your Club Leader for their code</p>
            {referralMeta?.valid ? (
              <div className="mt-3 flex items-start gap-2.5 rounded-2xl bg-emerald-50 p-4 border border-emerald-100">
                <CheckCircle2 className="h-4 w-4 text-emerald-600 mt-0.5 shrink-0" />
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-800">Verified: {referralMeta.club?.name}</p>
                  <p className="text-xs text-emerald-600/80 font-medium pt-0.5">Joining as a member under {referralMeta.headerName}</p>
                </div>
              </div>
            ) : referralCode && referralMeta && !referralMeta.valid ? (
              <p className="mt-1 text-xs text-red-500 font-bold ml-1">Invalid referral code</p>
            ) : null}
          </div>

          {/* Phone Input */}
          <div className="md:col-span-2">
            <input
              type="tel"
              placeholder="MOBILE NUMBER"
              value={phone}
              onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
              required
              className="w-full px-5 py-4 bg-white border-2 border-gray-400 rounded-2xl text-sm font-bold text-gray-900 placeholder:text-gray-500 placeholder:uppercase placeholder:font-black placeholder:tracking-widest focus:outline-none focus:border-gray-900 focus:ring-4 focus:ring-gray-900/5 transition-all"
            />
          </div>



          {/* Password Input */}
          <div>
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-5 py-4 bg-white border-2 border-gray-400 rounded-2xl text-sm font-bold text-gray-900 placeholder:text-gray-500 focus:outline-none focus:border-gray-900 focus:ring-4 focus:ring-gray-900/5 transition-all"
            />
          </div>

          {/* Confirm Password Input */}
          <div>
            <input
              type="password"
              placeholder="Confirm password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              className="w-full px-5 py-4 bg-white border-2 border-gray-400 rounded-2xl text-sm font-bold text-gray-900 placeholder:text-gray-500 focus:outline-none focus:border-gray-900 focus:ring-4 focus:ring-gray-900/5 transition-all"
            />
          </div>

          {/* Error Message */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm"
            >
              {error}
            </motion.div>
          )}

          {success && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-700 text-sm"
            >
              {success}
            </motion.div>
          )}

          {/* Register Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 bg-gray-900 text-white font-medium rounded-full hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Creating account...
              </>
            ) : (
              "Sign up"
            )}
          </button>

          {/* Login Link */}
          <p className="text-center text-gray-600 text-sm">
            Already have an account?{" "}
            <Link href="/login" className="text-blue-600 hover:text-blue-700 font-semibold">
              Log in
            </Link>
          </p>
        </motion.form>
      </motion.div>

      {/* Right Side - Premium 3D Visual */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1.2 }}
        className="hidden lg:flex w-1/2 bg-[#0C0C0A] relative overflow-hidden flex-col items-center justify-center p-12"
      >
        {/* Subtle Background Mesh */}
        <div className="absolute inset-0 z-0 bg-[radial-gradient(circle_at_50%_50%,_rgba(82,39,255,0.08),_transparent_70%)]" />

        {/* Cinematic Particles */}
        <div className="absolute inset-0">
          {[...Array(60)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-[1.5px] h-[1.5px] bg-white rounded-full"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
              }}
              animate={{
                opacity: [0, 0.4, 0],
                scale: [0.5, 1, 0.5],
              }}
              transition={{
                duration: 4 + Math.random() * 3,
                repeat: Infinity,
                delay: Math.random() * 5,
              }}
            />
          ))}
        </div>

        {/* Interactive 3D Mesh */}
        <div className="relative w-full h-full max-w-2xl z-10 flex items-center justify-center">
          <Interactive3DModel />
        </div>

        {/* Premium Floating Badge */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.2 }}
          className="absolute top-12 right-12 flex items-center gap-4 bg-white/5 backdrop-blur-3xl px-6 py-4 rounded-[28px] border border-white/10"
        >
          <div className="h-10 w-10 rounded-2xl bg-gradient-to-br from-[#3B5BFF] to-[#5227FF] flex items-center justify-center shadow-lg shadow-[#3B5BFF]/20">
            <ShieldCheck className="text-white h-5 w-5" />
          </div>
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.25em] text-white">OFF-CampusClub</p>
            <p className="text-xs text-white/50 font-medium">Student ecosystem</p>
          </div>
        </motion.div>

        {/* Bottom Editorial Text */}
        <div className="absolute bottom-12 left-16 right-16 z-20">
          <motion.h3
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.4, duration: 0.8, ease: "easeOut" }}
            className="text-5xl font-black text-white leading-[1.05] tracking-tight"
          >
            A world built <br />
            <span className="text-[#3B5BFF]">for enthusiasts.</span>
          </motion.h3>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.6 }}
            transition={{ delay: 1.8 }}
            className="mt-4 text-[10px] font-black uppercase tracking-[0.5em] text-white/60"
          >
            OFF-CampusClub 2026
          </motion.p>
        </div>

        {/* Corner Accents */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[#3B5BFF]/5 blur-[120px] -mr-64 -mt-64" />
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-[#5227FF]/5 blur-[120px] -ml-64 -mb-64" />
      </motion.div>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#0C0C0A]" aria-hidden />}>
      <RegisterPageInner />
    </Suspense>
  );
}
