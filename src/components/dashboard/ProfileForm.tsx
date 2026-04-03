"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Building2, Camera, GraduationCap, Loader2, Mail, MapPin, User } from "lucide-react";
import * as React from "react";
import { Controller, useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
import { PremiumButton } from "@/components/ui/PremiumButton";
import { PremiumInput } from "@/components/ui/PremiumInput";
import { avatarSrc } from "@/lib/avatar";
import { profileUpdateSchema, type ProfileUpdateInput } from "@/lib/validations";

export type ProfileFormInitialValues = ProfileUpdateInput & {
  email: string;
  phoneNumber: string;
};

export function ProfileForm({ initialValues }: { initialValues: ProfileFormInitialValues }) {
  const router = useRouter();
  const [serverState, setServerState] = React.useState<string | null>(null);
  const [uploading, setUploading] = React.useState(false);
  const fileRef = React.useRef<HTMLInputElement>(null);

  const { email, phoneNumber, ...formDefaults } = initialValues;

  const form = useForm<ProfileUpdateInput>({
    resolver: zodResolver(profileUpdateSchema),
    defaultValues: {
      ...formDefaults,
      bio: formDefaults.bio ?? "",
      city: formDefaults.city ?? "",
      avatar: formDefaults.avatar ?? "",
      graduationYear: formDefaults.graduationYear ?? undefined,
    },
  });

  const avatarValue = form.watch("avatar");
  const preview = avatarSrc(avatarValue || undefined);

  const uploadFile = async (file: File) => {
    setUploading(true);
    setServerState(null);
    try {
      const fd = new FormData();
      fd.set("file", file);
      fd.set("purpose", "avatar");
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      const data = (await res.json()) as { success?: boolean; url?: string; error?: string };
      if (!res.ok || !data.url) {
        setServerState(data.error ?? "Upload failed.");
        return;
      }
      form.setValue("avatar", data.url, { shouldDirty: true, shouldValidate: true });
      setServerState("Photo updated — save to keep changes.");
    } catch {
      setServerState("Upload failed. Try again.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <form
      className="space-y-8"
      onSubmit={form.handleSubmit(async (values) => {
        setServerState(null);
        const payload: ProfileUpdateInput = {
          ...values,
          avatar: form.getValues("avatar"),
          graduationYear:
            values.graduationYear === undefined
              ? undefined
              : values.graduationYear === null
                ? null
                : values.graduationYear,
        };
        const response = await fetch("/api/profile", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const data = (await response.json().catch(() => null)) as { error?: string } | null;
        if (!response.ok) {
          setServerState(data?.error ?? "Could not update profile.");
          return;
        }
        setServerState("Profile updated.");
        router.refresh();
      })}
    >
      {/* Photo */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="relative h-28 w-28 shrink-0">
          <img
            alt=""
            src={preview}
            className="h-full w-full rounded-full object-cover ring-2 ring-black/[0.06] shadow-md bg-black/[0.03]"
          />
          <input
            ref={fileRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              e.target.value = "";
              if (f) void uploadFile(f);
            }}
          />
        </div>
        <div className="flex flex-col gap-2">
          <p className="text-[10px] font-black uppercase tracking-[0.35em] text-[#D4AF37]">Profile photo</p>
          <p className="text-xs text-black/45 max-w-sm">
            JPG, PNG, WebP or GIF — max 5MB.             Production: set{" "}
            <code className="rounded bg-black/[0.05] px-1 text-[11px]">CLOUDINARY_*</code> (or{" "}
            <code className="rounded bg-black/[0.05] px-1 text-[11px]">BLOB_READ_WRITE_TOKEN</code>) for cloud
            storage.
          </p>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              disabled={uploading}
              onClick={() => fileRef.current?.click()}
              className="inline-flex items-center gap-2 rounded-xl border border-black/10 bg-white px-4 py-2.5 text-sm font-bold text-black shadow-sm transition hover:bg-black/[0.02] disabled:opacity-50"
            >
              {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Camera className="h-4 w-4" />}
              {uploading ? "Uploading…" : "Upload photo"}
            </button>
            {avatarValue ? (
              <button
                type="button"
                disabled={uploading}
                onClick={() => {
                  form.setValue("avatar", "", { shouldDirty: true });
                  setServerState("Photo removed — save to apply.");
                }}
                className="rounded-xl border border-black/10 px-4 py-2.5 text-sm font-bold text-black/50 transition hover:bg-red-50 hover:text-red-600 hover:border-red-200"
              >
                Remove
              </button>
            ) : null}
          </div>
        </div>
      </div>

      {/* Read-only account */}
      <div className="grid gap-4 rounded-2xl border border-black/[0.06] bg-black/[0.02] p-4 sm:p-5">
        <p className="text-[10px] font-black uppercase tracking-[0.35em] text-black/35">Account (read-only)</p>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.25em] text-black/35">
              <Mail className="h-3.5 w-3.5" strokeWidth={2.5} />
              Email
            </div>
            <p className="text-sm font-semibold text-black/80 break-all">{email}</p>
            <p className="text-[11px] text-black/40">Email can’t be changed here.</p>
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.25em] text-black/35">
              <User className="h-3.5 w-3.5" strokeWidth={2.5} />
              Phone
            </div>
            <p className="text-sm font-semibold text-black/80">{phoneNumber}</p>
            <p className="text-[11px] text-black/40">Phone can’t be changed here.</p>
          </div>
        </div>
      </div>

      <div className="space-y-5">
        <PremiumInput
          label="Full Name"
          icon={User}
          placeholder="Your name"
          error={form.formState.errors.fullName?.message}
          {...form.register("fullName")}
        />
        <PremiumInput
          label="College Name"
          icon={Building2}
          placeholder="College / University"
          error={form.formState.errors.collegeName?.message}
          {...form.register("collegeName")}
        />
        <PremiumInput
          label="City"
          icon={MapPin}
          placeholder="City"
          error={form.formState.errors.city?.message}
          {...form.register("city")}
        />
        <div className="space-y-2">
          <label className="text-[10px] uppercase tracking-[0.4em] text-[#8A8478]">Graduation year (optional)</label>
          <div className="relative mt-1 flex h-14 items-center rounded-md border border-[rgba(255,248,235,0.1)] bg-[rgba(255,248,235,0.04)] px-12 transition-all focus-within:border-[#C9A96E]">
            <GraduationCap className="pointer-events-none absolute left-4 h-5 w-5 text-[#4A4840]" strokeWidth={1.5} />
            <input
              type="number"
              min={2020}
              max={2040}
              placeholder="e.g. 2027"
              className="h-full w-full bg-transparent text-[15px] text-[#F5F0E8] outline-none placeholder:text-[#5F594F]"
              {...form.register("graduationYear", {
                setValueAs: (v) =>
                  v === "" || v === undefined || Number.isNaN(Number(v)) ? null : Number(v),
              })}
            />
          </div>
          {form.formState.errors.graduationYear ? (
            <p className="text-xs text-[#FF4D4D]">{form.formState.errors.graduationYear.message}</p>
          ) : null}
        </div>

        <div className="space-y-2">
          <label className="text-[10px] uppercase tracking-[0.4em] text-[#8A8478]">Bio</label>
          <textarea
            rows={4}
            className="mt-1 min-h-28 w-full rounded-md border border-[rgba(255,248,235,0.1)] bg-[rgba(255,248,235,0.04)] px-4 py-3 text-sm text-[#F5F0E8] outline-none focus:border-[#C9A96E] placeholder:text-[#5F594F]"
            placeholder="Tell your community what you're into."
            {...form.register("bio")}
          />
          {form.formState.errors.bio ? (
            <p className="text-xs text-[#FF4D4D]">{form.formState.errors.bio.message}</p>
          ) : null}
        </div>
      </div>

      <Controller
        name="avatar"
        control={form.control}
        render={({ field }) => <input type="hidden" {...field} value={field.value ?? ""} />}
      />

      {serverState ? (
        <p
          className={`text-sm font-medium ${serverState.startsWith("Profile updated") || serverState.includes("save to") ? "text-emerald-700" : "text-red-600"}`}
        >
          {serverState}
        </p>
      ) : null}
      <PremiumButton type="submit" loading={form.formState.isSubmitting} loadingLabel="SAVING CHANGES...">
        SAVE CHANGES
      </PremiumButton>
    </form>
  );
}
