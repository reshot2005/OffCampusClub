"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { format } from "date-fns";
import { Clock, Loader2, Plus, Upload, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { pusherClient } from "@/lib/pusher";
import { ECLUBS_PUSHER_CHANNEL } from "@/lib/gigs-realtime";

function requirementTags(description: string): string[] {
  const parts = description
    .split(/(?<=[.!?])\s+|\n+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 2);
  if (parts.length === 0) {
    const t = description.trim();
    if (!t) return [];
    return [t.length > 140 ? `${t.slice(0, 137)}…` : t];
  }
  return parts.slice(0, 6);
}

type GigRow = {
  id: string;
  postedById: string | null;
  title: string;
  description: string;
  payMin: number;
  payMax: number;
  deadline: Date | string | null;
  club: { name: string; slug: string; icon: string; coverImage?: string | null } | null;
  postedBy: { fullName: string } | null;
  applications: {
    id: string;
    status: string;
    workDescription?: string | null;
    submissionFileUrl?: string | null;
  }[];
};

function applicationLabel(
  status: string | undefined,
  opts?: { approvedHasDelivery?: boolean },
): string | null {
  if (!status) return null;
  if (status === "PENDING" || status === "applied") return "Pending review";
  if (status === "APPROVED") return opts?.approvedHasDelivery ? "Project submitted" : "Approved — submit your work";
  if (status === "REJECTED") return "Not selected";
  return null;
}

function hasDeliverySubmitted(mine: GigRow["applications"][0] | undefined): boolean {
  if (!mine) return false;
  const text = mine.workDescription?.trim();
  const file = mine.submissionFileUrl?.trim();
  return Boolean((text && text.length > 0) || file);
}

export function EClubsView({
  gigs,
  canPost,
  userId,
  applicantProfile,
}: {
  gigs: GigRow[];
  canPost: boolean;
  userId: string;
  applicantProfile: { fullName: string; email: string; phoneNumber: string | null };
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [payMin, setPayMin] = useState("");
  const [payMax, setPayMax] = useState("");
  const [deadline, setDeadline] = useState("");

  const [applyModalGigId, setApplyModalGigId] = useState<string | null>(null);
  const [applyModalTitle, setApplyModalTitle] = useState("");
  const [fName, setFName] = useState(applicantProfile.fullName);
  const [fEmail, setFEmail] = useState(applicantProfile.email);
  const [fPhone, setFPhone] = useState(applicantProfile.phoneNumber || "");
  const [fPitch, setFPitch] = useState("");
  const [applyLoading, setApplyLoading] = useState(false);
  const [justSubmitted, setJustSubmitted] = useState<string | null>(null);

  const [deliverModal, setDeliverModal] = useState<{
    gigId: string;
    applicationId: string;
    title: string;
  } | null>(null);
  const [deliverWork, setDeliverWork] = useState("");
  const [deliverFile, setDeliverFile] = useState<File | null>(null);
  const [deliverUploading, setDeliverUploading] = useState(false);
  const [deliverLoading, setDeliverLoading] = useState(false);

  useEffect(() => {
    if (!pusherClient) return;
    const ch = pusherClient.subscribe(ECLUBS_PUSHER_CHANNEL);
    const onUpdate = () => router.refresh();
    ch.bind("update", onUpdate);
    return () => {
      ch.unbind("update", onUpdate);
      pusherClient?.unsubscribe(ECLUBS_PUSHER_CHANNEL);
    };
  }, [router]);

  const openApplyModal = (gigId: string, gigTitle: string) => {
    setApplyModalGigId(gigId);
    setApplyModalTitle(gigTitle);
    setFName(applicantProfile.fullName);
    setFEmail(applicantProfile.email);
    setFPhone(applicantProfile.phoneNumber || "");
    setFPitch("");
  };

  const closeApplyModal = () => {
    setApplyModalGigId(null);
  };

  const openDeliverModal = (gigId: string, applicationId: string, gigTitle: string) => {
    setDeliverModal({ gigId, applicationId, title: gigTitle });
    setDeliverWork("");
    setDeliverFile(null);
  };

  const closeDeliverModal = () => {
    setDeliverModal(null);
  };

  const uploadDeliverFile = async (): Promise<{
    url: string;
    name: string;
    mime: string;
    size: number;
  } | null> => {
    if (!deliverFile) return null;
    const formData = new FormData();
    formData.append("file", deliverFile);
    formData.append("purpose", "gig_submission");
    setDeliverUploading(true);
    try {
      const uploadRes = await fetch("/api/upload", { method: "POST", body: formData });
      if (!uploadRes.ok) return null;
      const payload = (await uploadRes.json()) as { success?: boolean; url?: string };
      if (!payload?.url) return null;
      return {
        url: payload.url,
        name: deliverFile.name,
        mime: deliverFile.type || "application/octet-stream",
        size: deliverFile.size,
      };
    } finally {
      setDeliverUploading(false);
    }
  };

  const submitApply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!applyModalGigId) return;
    setApplyLoading(true);
    try {
      const res = await fetch("/api/gigs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          gigId: applyModalGigId,
          message: fPitch.trim(),
          applicantName: fName.trim(),
          applicantEmail: fEmail.trim(),
          applicantPhone: fPhone.trim(),
        }),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (res.ok) {
        setJustSubmitted(applyModalGigId);
        closeApplyModal();
        window.setTimeout(() => setJustSubmitted(null), 2400);
        router.refresh();
        toast.success("Application sent — the club will review it.");
      } else {
        toast.error(data.error || "Could not send application");
      }
    } finally {
      setApplyLoading(false);
    }
  };

  const submitDeliverables = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!deliverModal) return;
    const w = deliverWork.trim();
    if (w.length < 10) {
      toast.error("Describe your work or plan (at least 10 characters).");
      return;
    }
    setDeliverLoading(true);
    try {
      const uploaded = await uploadDeliverFile();
      const res = await fetch("/api/gig-applications/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          gigId: deliverModal.gigId,
          workDescription: w,
          submissionFileUrl: uploaded?.url,
          submissionFileName: uploaded?.name,
          submissionFileMime: uploaded?.mime,
          submissionFileSize: uploaded?.size,
        }),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (res.ok) {
        closeDeliverModal();
        router.refresh();
        toast.success("Project submitted — the club header can review your deliverables.");
      } else {
        toast.error(data.error || "Could not submit project");
      }
    } finally {
      setDeliverLoading(false);
    }
  };

  const createGig = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/gigs/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          description,
          payMin: Number(payMin) || 0,
          payMax: Number(payMax) || 0,
          deadline: deadline || null,
        }),
      });
      if (res.ok) {
        setOpen(false);
        setTitle("");
        setDescription("");
        setPayMin("");
        setPayMax("");
        setDeadline("");
        router.refresh();
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8 pb-28 lg:pb-10">
      <AnimatePresence>
        {applyModalGigId ? (
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="apply-modal-title"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[120] flex items-end justify-center p-4 sm:items-center"
          >
            <button
              type="button"
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
              aria-label="Close"
              onClick={closeApplyModal}
            />
            <motion.div
              initial={{ opacity: 0, y: 24, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 16, scale: 0.98 }}
              transition={{ type: "spring", stiffness: 420, damping: 32 }}
              className="relative z-10 w-full max-w-md rounded-3xl border border-black/[0.08] bg-white p-6 shadow-[0_24px_80px_-20px_rgba(0,0,0,0.35)]"
            >
              <div className="mb-4 flex items-start justify-between gap-3">
                <div>
                  <p id="apply-modal-title" className="text-lg font-semibold tracking-tight text-slate-900">
                    Apply
                  </p>
                  <p className="mt-0.5 text-sm text-slate-500 line-clamp-2">{applyModalTitle}</p>
                </div>
                <button
                  type="button"
                  onClick={closeApplyModal}
                  className="rounded-xl p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <form onSubmit={submitApply} className="space-y-3">
                <div>
                  <label className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Name</label>
                  <input
                    required
                    value={fName}
                    onChange={(e) => setFName(e.target.value)}
                    className="mt-1 h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-900 outline-none focus:border-violet-400"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Email</label>
                  <input
                    required
                    type="email"
                    value={fEmail}
                    onChange={(e) => setFEmail(e.target.value)}
                    className="mt-1 h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-900 outline-none focus:border-violet-400"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Phone</label>
                  <input
                    required
                    inputMode="tel"
                    minLength={10}
                    value={fPhone}
                    onChange={(e) => setFPhone(e.target.value)}
                    className="mt-1 h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-900 outline-none focus:border-violet-400"
                  />
                </div>
                <div>
                  <div className="flex items-center justify-between">
                    <label className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                      About you
                    </label>
                    <span className="text-[10px] font-medium text-slate-400">{fPitch.length}/50</span>
                  </div>
                  <textarea
                    value={fPitch}
                    onChange={(e) => setFPitch(e.target.value.slice(0, 50))}
                    placeholder="One line for the club header (max 50 characters)"
                    rows={2}
                    className="mt-1 w-full resize-none rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none placeholder:text-slate-400 focus:border-violet-400"
                  />
                </div>
                <p className="rounded-xl bg-slate-50 px-3 py-2 text-[11px] leading-relaxed text-slate-600">
                  After the club approves your application, you&apos;ll submit your project (description + optional file) in a second step — like a freelancing platform.
                </p>
                <motion.button
                  type="submit"
                  disabled={applyLoading}
                  whileHover={{ scale: applyLoading ? 1 : 1.02 }}
                  whileTap={{ scale: applyLoading ? 1 : 0.98 }}
                  className="relative w-full overflow-hidden rounded-2xl bg-slate-900 py-3.5 text-sm font-semibold text-white shadow-lg shadow-slate-900/20 disabled:opacity-60"
                >
                  {applyLoading ? (
                    <span className="inline-flex items-center justify-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Sending…
                    </span>
                  ) : (
                    "Submit application"
                  )}
                </motion.button>
              </form>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>

      <AnimatePresence>
        {deliverModal ? (
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="deliver-modal-title"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[120] flex items-end justify-center p-4 sm:items-center"
          >
            <button
              type="button"
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
              aria-label="Close"
              onClick={closeDeliverModal}
            />
            <motion.div
              initial={{ opacity: 0, y: 24, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 16, scale: 0.98 }}
              transition={{ type: "spring", stiffness: 420, damping: 32 }}
              className="relative z-10 w-full max-w-md rounded-3xl border border-black/[0.08] bg-white p-6 shadow-[0_24px_80px_-20px_rgba(0,0,0,0.35)]"
            >
              <div className="mb-4 flex items-start justify-between gap-3">
                <div>
                  <p id="deliver-modal-title" className="text-lg font-semibold tracking-tight text-slate-900">
                    Submit project
                  </p>
                  <p className="mt-0.5 text-sm text-slate-500 line-clamp-2">{deliverModal.title}</p>
                </div>
                <button
                  type="button"
                  onClick={closeDeliverModal}
                  className="rounded-xl p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <form onSubmit={submitDeliverables} className="space-y-3">
                <div>
                  <div className="flex items-center justify-between">
                    <label className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                      Work completion / deliverables
                    </label>
                    <span className="text-[10px] font-medium text-slate-400">{deliverWork.length}/5000</span>
                  </div>
                  <textarea
                    required
                    minLength={10}
                    value={deliverWork}
                    onChange={(e) => setDeliverWork(e.target.value.slice(0, 5000))}
                    placeholder="Describe what you completed or how you will deliver the gig"
                    rows={5}
                    className="mt-1 w-full resize-none rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none placeholder:text-slate-400 focus:border-violet-400"
                  />
                </div>
                <div className="rounded-xl border border-slate-200 p-3">
                  <label className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                    Attach file (optional — PDF, DOC, DOCX, PPT, PPTX up to 30MB)
                  </label>
                  <div className="mt-2 flex items-center gap-2">
                    <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-slate-300 px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50">
                      <Upload className="h-3.5 w-3.5" />
                      Choose file
                      <input
                        type="file"
                        accept=".pdf,.doc,.docx,.ppt,.pptx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.ms-powerpoint,application/vnd.openxmlformats-officedocument.presentationml.presentation"
                        className="hidden"
                        onChange={(e) => setDeliverFile(e.target.files?.[0] ?? null)}
                      />
                    </label>
                    <span className="min-w-0 truncate text-xs text-slate-500">
                      {deliverFile?.name || "No file selected"}
                    </span>
                  </div>
                </div>
                <motion.button
                  type="submit"
                  disabled={deliverLoading || deliverUploading}
                  whileHover={{ scale: deliverLoading || deliverUploading ? 1 : 1.02 }}
                  whileTap={{ scale: deliverLoading || deliverUploading ? 1 : 0.98 }}
                  className="relative w-full overflow-hidden rounded-2xl bg-emerald-700 py-3.5 text-sm font-semibold text-white shadow-lg disabled:opacity-60"
                >
                  {deliverLoading || deliverUploading ? (
                    <span className="inline-flex items-center justify-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      {deliverUploading ? "Uploading…" : "Submitting…"}
                    </span>
                  ) : (
                    "Submit project"
                  )}
                </motion.button>
              </form>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-[#5227FF]">E-Clubs</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-slate-900">Gigs marketplace</h1>
          <p className="mt-1 max-w-xl text-sm text-slate-500">
            Apply with a short intro first; after the club approves, you submit your project (description + optional file). Same flow as major freelancing platforms.
          </p>
        </div>
        {canPost ? (
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-900 px-5 py-3 text-sm font-medium text-white shadow-lg shadow-slate-900/15 hover:bg-slate-800"
          >
            <Plus className="h-4 w-4" />
            Post a gig
          </button>
        ) : null}
      </div>

      {canPost ? (
        <p className="text-xs text-slate-500">
          Manage applicants in{" "}
          <a href="/header/gigs" className="font-medium text-[#5227FF] underline-offset-2 hover:underline">
            Club Panel → Gigs
          </a>
          .
        </p>
      ) : null}

      {open && canPost ? (
        <form
          onSubmit={createGig}
          className="space-y-4 rounded-3xl border border-black/[0.06] bg-white p-5 shadow-sm sm:p-6"
        >
          <h2 className="text-sm font-semibold text-slate-900">New gig</h2>
          <input
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Title"
            className="h-11 w-full rounded-xl border border-black/[0.08] px-4 text-sm"
          />
          <textarea
            required
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Description, deliverables, timeline…"
            rows={4}
            className="w-full rounded-xl border border-black/[0.08] px-4 py-3 text-sm"
          />
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="text-xs text-slate-500">Min budget (₹)</label>
              <input
                required
                type="number"
                min={0}
                value={payMin}
                onChange={(e) => setPayMin(e.target.value)}
                className="mt-1 h-11 w-full rounded-xl border border-black/[0.08] px-4 text-sm"
              />
            </div>
            <div>
              <label className="text-xs text-slate-500">Max budget (₹)</label>
              <input
                required
                type="number"
                min={0}
                value={payMax}
                onChange={(e) => setPayMax(e.target.value)}
                className="mt-1 h-11 w-full rounded-xl border border-black/[0.08] px-4 text-sm"
              />
            </div>
          </div>
          <div>
            <label className="text-xs text-slate-500">Deadline (optional)</label>
            <input
              type="datetime-local"
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
              className="mt-1 h-11 w-full rounded-xl border border-black/[0.08] px-4 text-sm"
            />
          </div>
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={loading}
              className="rounded-xl bg-[#5227FF] px-5 py-2.5 text-sm font-medium text-white disabled:opacity-50"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Publish gig"}
            </button>
            <button type="button" onClick={() => setOpen(false)} className="rounded-xl px-4 py-2.5 text-sm text-slate-600">
              Cancel
            </button>
          </div>
        </form>
      ) : null}

      <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
        {gigs.length === 0 ? (
          <div className="rounded-[28px] border border-dashed border-black/10 bg-white px-6 py-14 text-center text-sm text-slate-500 sm:col-span-2 xl:col-span-3">
            No gigs yet. Club headers can post paid work from E-Clubs or the Club Panel.
          </div>
        ) : (
          gigs.map((gig) => {
            const dl = gig.deadline ? new Date(gig.deadline) : null;
            const mine = gig.applications[0];
            const rawStatus = mine?.status;
            const status = rawStatus === "applied" ? "PENDING" : rawStatus;
            const submittedDelivery = hasDeliverySubmitted(mine);
            const label = applicationLabel(rawStatus, {
              approvedHasDelivery: status === "APPROVED" ? submittedDelivery : false,
            });
            const isOwner = gig.postedById === userId;
            const tags = requirementTags(gig.description);
            const posterName = gig.postedBy?.fullName || gig.club?.name || "Club";
            const isPendingState = status === "PENDING";
            const showPending = isPendingState;
            const showApproved = status === "APPROVED";
            const submittedFlash = justSubmitted === gig.id;

            return (
              <article
                key={gig.id}
                className="relative flex flex-col overflow-hidden rounded-[28px] border border-slate-200/90 bg-white p-6 shadow-[0_8px_32px_rgba(15,23,42,0.06)]"
              >
                {gig.club?.coverImage ? (
                  <>
                    <img
                      src={gig.club.coverImage}
                      alt=""
                      className="pointer-events-none absolute inset-0 h-full w-full object-cover opacity-[0.14]"
                    />
                    <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-white/55 via-white/80 to-white/95" />
                  </>
                ) : null}
                <div className="relative z-10">
                <div className="flex items-start justify-between gap-3">
                  <h2 className="min-w-0 flex-1 text-[17px] font-bold leading-snug tracking-tight text-slate-900">
                    {gig.title}
                  </h2>
                  <span
                    className={`shrink-0 rounded-full px-3 py-1 text-[11px] font-semibold ${
                      isOwner ? "bg-violet-100 text-violet-800" : "bg-violet-100 text-violet-700"
                    }`}
                  >
                    {isOwner ? "Yours" : "Open"}
                  </span>
                </div>
                <div className="mt-3 flex items-center gap-1.5 text-xs text-slate-500">
                  <Clock className="h-3.5 w-3.5 shrink-0 text-slate-400" strokeWidth={2} />
                  <span>
                    Posted by <span className="font-medium text-slate-600">{posterName}</span>
                  </span>
                </div>
                {gig.club?.name ? (
                  <p className="mt-1 pl-[22px] text-[11px] text-slate-400">
                    {gig.club.icon ? `${gig.club.icon} ` : null}
                    {gig.club.name}
                  </p>
                ) : null}

                <div className="mt-4 rounded-2xl bg-slate-50/90 p-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Budget</p>
                      <p className="mt-1 text-lg font-bold tabular-nums text-emerald-600">
                        ₹{gig.payMin.toLocaleString("en-IN")} – ₹{gig.payMax.toLocaleString("en-IN")}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Deadline</p>
                      <p className="mt-1 text-base font-bold text-slate-900">
                        {dl ? format(dl, "dd MMM yyyy") : "Open"}
                      </p>
                      {dl ? (
                        <p className="mt-0.5 text-[11px] font-medium text-slate-500">{format(dl, "HH:mm")}</p>
                      ) : null}
                    </div>
                  </div>
                </div>

                {tags.length > 0 ? (
                  <div className="mt-4 flex flex-col gap-2">
                    {tags.map((tag, idx) => (
                      <span
                        key={`${gig.id}-tag-${idx}`}
                        className="inline-flex items-start gap-2 rounded-full border border-slate-200 bg-white px-3 py-2 text-left text-[13px] leading-snug text-slate-700"
                      >
                        <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-slate-400" aria-hidden />
                        {tag}
                      </span>
                    ))}
                  </div>
                ) : null}

                {isOwner ? (
                  <p className="mt-5 text-center text-xs font-semibold text-violet-700">
                    Your gig — review applicants in Club Panel → Gigs.
                  </p>
                ) : showApproved && !submittedDelivery ? (
                  <div className="mt-5 flex flex-col gap-2">
                    <p className="text-center text-sm font-semibold text-emerald-700">{label}</p>
                    {mine?.id ? (
                      <motion.button
                        type="button"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => openDeliverModal(gig.id, mine.id, gig.title)}
                        className="w-full rounded-2xl bg-emerald-700 py-3.5 text-sm font-semibold text-white shadow-md shadow-emerald-900/20"
                      >
                        Submit project
                      </motion.button>
                    ) : null}
                  </div>
                ) : showApproved && submittedDelivery ? (
                  <div className="mt-5 flex flex-col gap-1">
                    <p className="text-center text-sm font-semibold text-emerald-800">{label}</p>
                    <p className="text-center text-[11px] text-slate-500">
                      The club header can review your files and description in Club Panel → Gigs.
                    </p>
                  </div>
                ) : showPending || submittedFlash ? (
                  <motion.div
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-5 flex flex-col items-center gap-2"
                  >
                    <span className="inline-flex items-center rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-900">
                      Pending review
                    </span>
                    {submittedFlash ? (
                      <p className="text-center text-[11px] text-slate-500">
                        Application sent — check Notifications for updates.
                      </p>
                    ) : (
                      <p className="text-center text-xs text-amber-800/90">The club header will review your application.</p>
                    )}
                  </motion.div>
                ) : (
                  <div className="mt-5 flex flex-1 flex-col gap-2">
                    <motion.button
                      type="button"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => openApplyModal(gig.id, gig.title)}
                      className="w-full rounded-2xl bg-slate-900 py-3.5 text-sm font-semibold text-white shadow-md shadow-slate-900/15"
                    >
                      Apply
                    </motion.button>
                  </div>
                )}
                </div>
              </article>
            );
          })
        )}
      </div>
    </div>
  );
}
