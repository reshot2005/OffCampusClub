"use client";

import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Building2, 
  Camera, 
  Loader2, 
  CheckCircle2, 
  AlertCircle 
} from "lucide-react";
import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { profileUpdateSchema, type ProfileUpdateInput } from "@/lib/validations";
import { avatarSrc } from "@/lib/avatar";

interface Props {
  initialValues: ProfileUpdateInput & {
    email: string;
    phoneNumber: string | null;
    clubName: string;
  };
}

export function HeaderProfileClient({ initialValues }: Props) {
  const router = useRouter();
  const [status, setStatus] = useState<{ type: 'success' | 'error', message: string } | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const { email, phoneNumber, clubName, ...formDefaults } = initialValues;

  const form = useForm<ProfileUpdateInput>({
    resolver: zodResolver(profileUpdateSchema),
    defaultValues: {
      ...formDefaults,
      bio: formDefaults.bio ?? "",
      city: formDefaults.city ?? "",
      avatar: formDefaults.avatar ?? "",
    },
  });

  const avatarValue = form.watch("avatar");
  const preview = avatarSrc(avatarValue || undefined);

  const uploadFile = async (file: File) => {
    setUploading(true);
    setStatus(null);
    try {
      const fd = new FormData();
      fd.set("file", file);
      fd.set("purpose", "avatar");
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok || !data.url) {
        setStatus({ type: 'error', message: data.error || "Upload failed." });
        return;
      }
      form.setValue("avatar", data.url, { shouldDirty: true, shouldValidate: true });
      setStatus({ type: 'success', message: "Photo uploaded. Save to apply changes." });
    } catch {
      setStatus({ type: 'error', message: "Something went wrong during upload." });
    } finally {
      setUploading(false);
    }
  };

  const onSubmit = async (values: ProfileUpdateInput) => {
    setStatus(null);
    try {
      const response = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      const data = await response.json();
      if (!response.ok) {
        setStatus({ type: 'error', message: data.error || "Update failed." });
        return;
      }
      setStatus({ type: 'success', message: "Profile updated successfully!" });
      router.refresh();
    } catch {
      setStatus({ type: 'error', message: "Network error. Try again." });
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-10 pb-20">
      {/* Header Info */}
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold text-white tracking-tight">Leader Profile</h1>
        <p className="text-white/40 text-sm">Update your personal information and how you appear to others.</p>
      </div>

      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-12">
        {/* Profile Identity section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          <div className="space-y-4">
            <h3 className="text-sm font-semibold tracking-widest uppercase text-[#5227FF]">Identity</h3>
            <p className="text-xs text-white/30 leading-relaxed">
              Your profile picture and basic details are visible to club members and the community.
            </p>
          </div>
          
          <div className="lg:col-span-2 space-y-8">
            {/* Avatar Row */}
            <div className="flex flex-col sm:flex-row items-center gap-8 p-8 rounded-3xl bg-white/[0.02] border border-white/[0.05] backdrop-blur-3xl shadow-2xl relative overflow-hidden group">
              <div className="absolute top-0 right-0 h-32 w-32 bg-[#5227FF]/10 rounded-full blur-[50px] -mr-10 -mt-10" />
              
              <div className="relative h-28 w-28 shrink-0">
                <img
                  alt=""
                  src={preview}
                  className="h-full w-full rounded-full object-cover ring-2 ring-[#5227FF]/30 shadow-[0_0_20px_rgba(82,39,255,0.2)] bg-[#12183A]"
                />
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) uploadFile(f);
                  }}
                />
              </div>

              <div className="flex-1 space-y-4 text-center sm:text-left">
                <div>
                  <h4 className="text-white font-semibold flex items-center gap-2 justify-center sm:justify-start">
                    {uploading ? "Uploading Intel..." : "Public Avatar"}
                  </h4>
                  <p className="text-[11px] text-white/40 mt-1 max-w-sm">
                    Recommended: Square JPG or PNG. Max 8MB.
                  </p>
                </div>
                <div className="flex flex-wrap gap-2 justify-center sm:justify-start">
                  <button
                    type="button"
                    disabled={uploading}
                    onClick={() => fileRef.current?.click()}
                    className="inline-flex items-center gap-2 rounded-xl bg-[#5227FF] hover:bg-[#8C6DFD] px-6 py-2.5 text-xs font-bold text-white transition-all transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 shadow-[0_5px_15px_-5px_rgba(82,39,255,0.4)]"
                  >
                    {uploading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Camera className="h-3.5 w-3.5" />}
                    Change Photo
                  </button>
                  {avatarValue && (
                    <button
                      type="button"
                      disabled={uploading}
                      onClick={() => form.setValue("avatar", "", { shouldDirty: true })}
                      className="rounded-xl border border-white/10 bg-white/5 px-6 py-2.5 text-xs font-bold text-white/50 transition hover:bg-red-500/10 hover:text-red-400 hover:border-red-500/20"
                    >
                      Remove
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="h-px bg-white/[0.05]" />

        {/* Public Info section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          <div className="space-y-4">
            <h3 className="text-sm font-semibold tracking-widest uppercase text-[#5227FF]">Information</h3>
            <p className="text-xs text-white/30 leading-relaxed">
              Account-level details. Your name and bio help others recognize you.
            </p>
          </div>

          <div className="lg:col-span-2 space-y-8">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[10px] uppercase tracking-[0.2em] font-bold text-white/40 flex items-center gap-2">
                  <User className="h-3 w-3" /> Full Name
                </label>
                <input
                  {...form.register("fullName")}
                  className="w-full h-12 bg-white/[0.03] border border-white/[0.1] rounded-xl px-4 text-sm text-white focus:border-[#5227FF]/50 outline-none transition-colors"
                />
                {form.formState.errors.fullName && (
                  <p className="text-[10px] text-red-500">{form.formState.errors.fullName.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <label className="text-[10px] uppercase tracking-[0.2em] font-bold text-white/40 flex items-center gap-2">
                  <Building2 className="h-3 w-3" /> College
                </label>
                <input
                  {...form.register("collegeName")}
                  className="w-full h-12 bg-white/[0.03] border border-white/[0.1] rounded-xl px-4 text-sm text-white focus:border-[#5227FF]/50 outline-none transition-colors"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] uppercase tracking-[0.2em] font-bold text-white/40 flex items-center gap-2">
                  <Mail className="h-3 w-3" /> Email (Read-only)
                </label>
                <div className="w-full h-12 bg-white/5 border border-white/[0.05] rounded-xl px-4 flex items-center text-sm text-white/30 cursor-not-allowed">
                  {email}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] uppercase tracking-[0.2em] font-bold text-white/40 flex items-center gap-2">
                  <Phone className="h-3 w-3" /> Phone (Read-only)
                </label>
                <div className="w-full h-12 bg-white/5 border border-white/[0.05] rounded-xl px-4 flex items-center text-sm text-white/30 cursor-not-allowed">
                  {phoneNumber || "No phone"}
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] uppercase tracking-[0.2em] font-bold text-white/40 flex items-center gap-2">
                <MapPin className="h-3 w-3" /> Instagram Handle / City
              </label>
              <input
                {...form.register("city")}
                placeholder="e.g. @username or Bangalore"
                className="w-full h-12 bg-white/[0.03] border border-white/[0.1] rounded-xl px-4 text-sm text-white focus:border-[#5227FF]/50 outline-none transition-colors"
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] uppercase tracking-[0.2em] font-bold text-white/40">Bio / Experience</label>
              <textarea
                {...form.register("bio")}
                rows={4}
                placeholder="A bit about your achievements or expertise..."
                className="w-full bg-white/[0.03] border border-white/[0.1] rounded-xl p-4 text-sm text-white focus:border-[#5227FF]/50 outline-none transition-colors resize-none"
              />
            </div>
          </div>
        </div>

        <div className="h-px bg-white/[0.05]" />

        {/* Global Footer Controls */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-6 pt-4">
          <div className="flex-1">
            <AnimatePresence mode="wait">
              {status && (
                <motion.div
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl ${
                    status.type === 'success' ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" : "bg-red-500/10 text-red-400 border border-red-500/20"
                  }`}
                >
                  {status.type === 'success' ? <CheckCircle2 className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
                  <span className="text-xs font-semibold">{status.message}</span>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <button
            type="submit"
            disabled={form.formState.isSubmitting || !form.formState.isDirty}
            className="w-full sm:w-auto min-w-[200px] h-14 rounded-2xl bg-gradient-to-r from-[#5227FF] to-[#8C6DFD] text-white font-bold tracking-widest text-[11px] uppercase shadow-[0_15px_30px_-10px_rgba(82,39,255,0.4)] hover:shadow-[0_20px_40px_-10px_rgba(82,39,255,0.5)] transition-all transform hover:-translate-y-1 active:scale-95 disabled:opacity-40 disabled:grayscale disabled:hover:translate-y-0"
          >
            {form.formState.isSubmitting ? "Processing..." : "Secure Save"}
          </button>
        </div>
      </form>
    </div>
  );
}
