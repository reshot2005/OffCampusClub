"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import React from "react";

type Props = {
  params: { gigId: string };
};

export default function GigApplyPage({ params }: Props) {
  const router = useRouter();
  const [name, setName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [phone, setPhone] = React.useState("");
  const [pitch, setPitch] = React.useState("");
  const [workDescription, setWorkDescription] = React.useState("");
  const [file, setFile] = React.useState<File | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState("");

  const uploadOne = async (selectedFile: File): Promise<string> => {
    const form = new FormData();
    form.append("file", selectedFile);
    form.append("purpose", "gig_submission");
    const res = await fetch("/api/upload", {
      method: "POST",
      body: form,
    });
    const data = (await res.json().catch(() => null)) as
      | { url?: string; error?: string }
      | null;
    if (!res.ok || !data?.url) {
      throw new Error(data?.error || "File upload failed");
    }
    return data.url;
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const fileUrl = file ? await uploadOne(file) : undefined;

      const res = await fetch("/api/gigs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          gigId: params.gigId,
          applicantName: name.trim() || undefined,
          applicantEmail: email.trim() || undefined,
          applicantPhone: phone.trim() || undefined,
          message: pitch.trim() || undefined,
          workDescription: workDescription.trim(),
          submissionFileUrl: fileUrl,
          submissionFileName: file?.name,
          submissionFileMime: file?.type,
          submissionFileSize: file?.size,
        }),
      });

      const data = (await res.json().catch(() => null)) as { error?: string } | null;
      if (!res.ok) {
        throw new Error(data?.error || "Could not submit gig application");
      }

      router.push("/gigs");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not submit gig application");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto w-full max-w-3xl space-y-6 pb-12">
      <div className="space-y-2">
        <p className="text-[11px] uppercase tracking-[0.45em] text-[#C9A96E]">Gig Submission</p>
        <h1 className="font-headline text-5xl text-[#F5F0E8]">Submit your gig application</h1>
        <p className="text-sm text-[#F5F0E8]/70">
          Add your details, share your completion/work description, and optionally attach one supporting file for review.
        </p>
      </div>

      <form
        onSubmit={onSubmit}
        className="space-y-5 rounded-3xl border border-white/10 bg-white/[0.03] p-6"
      >
        <input
          type="text"
          placeholder="Your name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full rounded-xl border border-white/15 bg-black/30 px-4 py-3 text-sm text-white placeholder:text-white/40"
        />
        <input
          type="email"
          placeholder="Your email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full rounded-xl border border-white/15 bg-black/30 px-4 py-3 text-sm text-white placeholder:text-white/40"
        />
        <input
          type="tel"
          placeholder="Your phone"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          className="w-full rounded-xl border border-white/15 bg-black/30 px-4 py-3 text-sm text-white placeholder:text-white/40"
        />
        <textarea
          placeholder="Short pitch (why you're a fit)"
          value={pitch}
          onChange={(e) => setPitch(e.target.value)}
          maxLength={600}
          rows={4}
          className="w-full rounded-xl border border-white/15 bg-black/30 px-4 py-3 text-sm text-white placeholder:text-white/40"
        />
        <textarea
          placeholder="Work completion / execution description"
          value={workDescription}
          onChange={(e) => setWorkDescription(e.target.value)}
          maxLength={1000}
          required
          rows={5}
          className="w-full rounded-xl border border-white/15 bg-black/30 px-4 py-3 text-sm text-white placeholder:text-white/40"
        />
        <div className="space-y-2">
          <label className="text-xs uppercase tracking-[0.2em] text-white/70">Supporting file</label>
          <input
            type="file"
            accept=".pdf,.doc,.docx,.ppt,.pptx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.ms-powerpoint,application/vnd.openxmlformats-officedocument.presentationml.presentation"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            className="w-full rounded-xl border border-white/15 bg-black/30 px-4 py-3 text-sm text-white file:mr-3 file:rounded-lg file:border-0 file:bg-[#5227FF] file:px-3 file:py-2 file:text-xs file:font-bold file:text-white"
          />
          <p className="text-xs text-white/50">Allowed: PDF, DOC, DOCX, PPT, PPTX. Max 30MB.</p>
        </div>

        {error ? <p className="text-sm text-red-300">{error}</p> : null}

        <div className="flex items-center gap-3 pt-2">
          <button
            type="submit"
            disabled={loading}
            className="rounded-xl bg-[#5227FF] px-5 py-3 text-xs font-black uppercase tracking-[0.2em] text-white disabled:opacity-50"
          >
            {loading ? "Submitting..." : "Submit Gig"}
          </button>
          <Link
            href="/gigs"
            className="rounded-xl border border-white/20 px-5 py-3 text-xs font-black uppercase tracking-[0.2em] text-white/80"
          >
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}

