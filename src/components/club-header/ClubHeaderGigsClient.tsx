"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { Check, ChevronDown, Loader2, Pencil, Plus, Trash2, X } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { pusherClient } from "@/lib/pusher";

type AppRow = {
  id: string;
  status: string;
  message: string | null;
  workDescription: string | null;
  submissionFileUrl: string | null;
  submissionFileName: string | null;
  submissionFileMime: string | null;
  submissionFileSize: number | null;
  applicantName: string | null;
  applicantPhone: string | null;
  applicantEmail: string | null;
  createdAt: string;
  user: {
    id: string;
    fullName: string;
    email: string;
    phoneNumber: string;
    collegeName: string;
    avatar: string | null;
  };
};

export type HeaderGigRow = {
  id: string;
  title: string;
  description: string;
  payMin: number;
  payMax: number;
  deadline: string | null;
  createdAt: string;
  applications: AppRow[];
};

function deadlineToInput(iso: string | null): string {
  if (!iso) return "";
  try {
    const d = new Date(iso);
    return Number.isNaN(d.getTime()) ? "" : d.toISOString().slice(0, 16);
  } catch {
    return "";
  }
}

export function ClubHeaderGigsClient({ initialGigs }: { initialGigs: HeaderGigRow[] }) {
  const router = useRouter();
  const [gigs, setGigs] = useState(initialGigs);
  const [openId, setOpenId] = useState<string | null>(initialGigs[0]?.id ?? null);
  const [busy, setBusy] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(initialGigs.length === 0);
  const [createLoading, setCreateLoading] = useState(false);
  const [editLoading, setEditLoading] = useState(false);
  const [editingGig, setEditingGig] = useState<HeaderGigRow | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [payMin, setPayMin] = useState("");
  const [payMax, setPayMax] = useState("");
  const [deadline, setDeadline] = useState("");

  useEffect(() => {
    setGigs(initialGigs);
  }, [initialGigs]);

  useEffect(() => {
    if (!pusherClient) return;
    const channel = pusherClient.subscribe("e-clubs");
    channel.bind("e-clubs-event", (data: any) => {
      if (data.type === "gig-application") {
        router.refresh();
      }
    });
    return () => {
      channel.unbind("e-clubs-event");
      pusherClient?.unsubscribe("e-clubs");
    };
  }, [router]);

  const resetForm = () => {
    setTitle("");
    setDescription("");
    setPayMin("");
    setPayMax("");
    setDeadline("");
    setEditingGig(null);
  };

  const startEdit = (gig: HeaderGigRow) => {
    setEditingGig(gig);
    setShowCreate(false);
    setTitle(gig.title);
    setDescription(gig.description);
    setPayMin(String(gig.payMin));
    setPayMax(String(gig.payMax));
    setDeadline(deadlineToInput(gig.deadline));
  };

  const cancelEdit = () => {
    resetForm();
  };

  const createGig = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateLoading(true);
    try {
      const res = await fetch("/api/gigs/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim(),
          payMin: Number(payMin) || 0,
          payMax: Number(payMax) || 0,
          deadline: deadline || null,
        }),
      });
      if (!res.ok) return;
      const data = (await res.json()) as {
        gig?: {
          id: string;
          title: string;
          description: string;
          payMin: number;
          payMax: number;
          deadline: string | null;
          createdAt: string;
        };
      };
      if (data.gig) {
        const g = data.gig;
        const row: HeaderGigRow = {
          id: g.id,
          title: g.title,
          description: g.description,
          payMin: g.payMin,
          payMax: g.payMax,
          deadline: g.deadline,
          createdAt: g.createdAt,
          applications: [],
        };
        setGigs((prev) => [row, ...prev]);
        setOpenId(row.id);
        setShowCreate(false);
        resetForm();
      }
      router.refresh();
    } finally {
      setCreateLoading(false);
    }
  };

  const saveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingGig) return;
    setEditLoading(true);
    try {
      const res = await fetch(`/api/gigs/${editingGig.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim(),
          payMin: Number(payMin) || 0,
          payMax: Number(payMax) || 0,
          deadline: deadline || null,
        }),
      });
      if (!res.ok) return;
      const nextDeadline = deadline ? new Date(deadline).toISOString() : null;
      setGigs((prev) =>
        prev.map((g) =>
          g.id === editingGig.id
            ? {
                ...g,
                title: title.trim(),
                description: description.trim(),
                payMin: Number(payMin) || 0,
                payMax: Number(payMax) || 0,
                deadline: nextDeadline,
              }
            : g,
        ),
      );
      resetForm();
      router.refresh();
    } finally {
      setEditLoading(false);
    }
  };

  const deleteGig = async (gig: HeaderGigRow) => {
    if (!confirm(`Delete “${gig.title}”? This removes all applications.`)) return;
    try {
      const res = await fetch(`/api/gigs/${gig.id}`, { method: "DELETE" });
      if (!res.ok) return;
      setGigs((prev) => prev.filter((g) => g.id !== gig.id));
      if (openId === gig.id) setOpenId(null);
      if (editingGig?.id === gig.id) resetForm();
      router.refresh();
    } catch {
      /* ignore */
    }
  };

  const pendingByGig = useMemo(() => {
    const m: Record<string, number> = {};
    for (const g of gigs) {
      m[g.id] = g.applications.filter((a) => a.status === "PENDING").length;
    }
    return m;
  }, [gigs]);

  const setStatus = async (applicationId: string, status: "APPROVED" | "REJECTED") => {
    setBusy(applicationId);
    try {
      const res = await fetch(`/api/gig-applications/${applicationId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) return;
      setGigs((prev) =>
        prev.map((g) => ({
          ...g,
          applications: g.applications.map((a) =>
            a.id === applicationId ? { ...a, status } : a,
          ),
        })),
      );
    } finally {
      setBusy(null);
    }
  };

  const sharedFields = (
    <>
      <input
        required
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Title (e.g. Event photographer)"
        className="h-11 w-full rounded-xl border border-white/[0.1] bg-black/30 px-4 text-sm text-white placeholder:text-white/30 outline-none focus:border-[#5227FF]/50"
      />
      <textarea
        required
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        placeholder="Description, deliverables, timeline…"
        rows={4}
        className="w-full rounded-xl border border-white/[0.1] bg-black/30 px-4 py-3 text-sm text-white placeholder:text-white/30 outline-none focus:border-[#5227FF]/50"
      />
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="text-[11px] font-medium uppercase tracking-wide text-white/35">Min budget (₹)</label>
          <input
            required
            type="number"
            min={0}
            value={payMin}
            onChange={(e) => setPayMin(e.target.value)}
            className="mt-1.5 h-11 w-full rounded-xl border border-white/[0.1] bg-black/30 px-4 text-sm text-white outline-none focus:border-[#5227FF]/50"
          />
        </div>
        <div>
          <label className="text-[11px] font-medium uppercase tracking-wide text-white/35">Max budget (₹)</label>
          <input
            required
            type="number"
            min={0}
            value={payMax}
            onChange={(e) => setPayMax(e.target.value)}
            className="mt-1.5 h-11 w-full rounded-xl border border-white/[0.1] bg-black/30 px-4 text-sm text-white outline-none focus:border-[#5227FF]/50"
          />
        </div>
      </div>
      <div>
        <label className="text-[11px] font-medium uppercase tracking-wide text-white/35">Deadline (optional)</label>
        <input
          type="datetime-local"
          value={deadline}
          onChange={(e) => setDeadline(e.target.value)}
          className="mt-1.5 h-11 w-full rounded-xl border border-white/[0.1] bg-black/30 px-4 text-sm text-white outline-none focus:border-[#5227FF]/50"
        />
      </div>
    </>
  );

  const createForm = (
    <motion.form layout onSubmit={createGig} className="space-y-4 rounded-2xl border border-white/[0.1] bg-white/[0.04] p-5 sm:p-6">
      <h2 className="text-sm font-semibold text-white">New gig listing</h2>
      <p className="text-xs text-white/40">
        Members apply from <span className="text-white/60">Dashboard → E-Clubs</span>. Edits sync there in real time.
      </p>
      {sharedFields}
      <div className="flex flex-wrap gap-2">
        <button
          type="submit"
          disabled={createLoading}
          className="inline-flex items-center gap-2 rounded-xl bg-[#5227FF] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#6b45ff] disabled:opacity-50"
        >
          {createLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
          Publish gig
        </button>
        {gigs.length > 0 ? (
          <button
            type="button"
            onClick={() => setShowCreate(false)}
            className="rounded-xl px-4 py-2.5 text-sm text-white/50 hover:text-white/80"
          >
            Cancel
          </button>
        ) : null}
      </div>
    </motion.form>
  );

  const editForm = editingGig ? (
    <motion.form layout onSubmit={saveEdit} className="space-y-4 rounded-2xl border border-[#D4AF37]/25 bg-[#D4AF37]/[0.06] p-5 sm:p-6">
      <h2 className="text-sm font-semibold text-white">Edit gig</h2>
      <p className="text-xs text-white/40">Saving updates the E-Clubs marketplace for all members.</p>
      {sharedFields}
      <div className="flex flex-wrap gap-2">
        <button
          type="submit"
          disabled={editLoading}
          className="inline-flex items-center gap-2 rounded-xl bg-[#5227FF] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#6b45ff] disabled:opacity-50"
        >
          {editLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Pencil className="h-4 w-4" />}
          Save changes
        </button>
        <button type="button" onClick={cancelEdit} className="rounded-xl px-4 py-2.5 text-sm text-white/50 hover:text-white/80">
          Cancel
        </button>
      </div>
    </motion.form>
  ) : null;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        {gigs.length > 0 && !showCreate && !editingGig ? (
          <button
            type="button"
            onClick={() => {
              setEditingGig(null);
              setShowCreate(true);
            }}
            className="inline-flex w-fit items-center gap-2 rounded-xl border border-[#5227FF]/40 bg-[#5227FF]/15 px-4 py-2.5 text-sm font-semibold text-[#C4B5FD] transition hover:bg-[#5227FF]/25"
          >
            <Plus className="h-4 w-4" />
            Post a gig
          </button>
        ) : null}
      </div>

      <AnimatePresence initial={false}>
        {editingGig ? (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.2 }}
          >
            {editForm}
          </motion.div>
        ) : null}
      </AnimatePresence>

      <AnimatePresence initial={false}>
        {showCreate && !editingGig ? (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.2 }}
          >
            {gigs.length === 0 ? (
              <div className="space-y-4">
                <p className="text-center text-sm text-white/45">
                  No gigs yet — publish one below. Students will see it on <span className="text-white/70">E-Clubs</span> and can apply; you&apos;ll review them here.
                </p>
                {createForm}
              </div>
            ) : (
              createForm
            )}
          </motion.div>
        ) : null}
      </AnimatePresence>

      <div className="space-y-3">
        {gigs.map((gig) => {
          const open = openId === gig.id;
          const dl = gig.deadline ? new Date(gig.deadline) : null;
          const pending = pendingByGig[gig.id] ?? 0;
          return (
            <div key={gig.id} className="overflow-hidden rounded-2xl border border-white/[0.08] bg-white/[0.03]">
              <div className="flex items-stretch gap-0">
                <button
                  type="button"
                  onClick={() => setOpenId(open ? null : gig.id)}
                  className="flex min-w-0 flex-1 items-center justify-between gap-4 px-5 py-4 text-left transition hover:bg-white/[0.04]"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="text-[15px] font-semibold text-white">{gig.title}</h2>
                      {pending > 0 ? (
                        <span className="rounded-full bg-[#5227FF]/25 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-[#C4B5FD]">
                          {pending} pending
                        </span>
                      ) : null}
                    </div>
                    <p className="mt-1 text-xs text-white/35">
                      ₹{gig.payMin.toLocaleString("en-IN")} – ₹{gig.payMax.toLocaleString("en-IN")}
                      {dl ? ` · due ${format(dl, "dd MMM yyyy")}` : ""}
                    </p>
                  </div>
                  <ChevronDown
                    className={`h-5 w-5 shrink-0 text-white/30 transition-transform ${open ? "rotate-180" : ""}`}
                  />
                </button>
                <div className="flex shrink-0 items-center border-l border-white/[0.06] pr-2">
                  <button
                    type="button"
                    title="Edit gig"
                    onClick={() => startEdit(gig)}
                    className="rounded-lg p-3 text-white/45 transition hover:bg-white/[0.06] hover:text-white"
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    title="Delete gig"
                    onClick={() => void deleteGig(gig)}
                    className="rounded-lg p-3 text-red-400/55 transition hover:bg-red-500/10 hover:text-red-300"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
              <AnimatePresence initial={false}>
                {open ? (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.22, ease: [0.25, 0.1, 0.25, 1] }}
                    className="border-t border-white/[0.06]"
                  >
                    <p className="px-5 py-3 text-[13px] leading-relaxed text-white/50">{gig.description}</p>
                    <div className="space-y-2 px-3 pb-4">
                      {gig.applications.length === 0 ? (
                        <p className="px-2 py-6 text-center text-xs text-white/30">No applications yet.</p>
                      ) : (
                        gig.applications.map((a) => {
                          const name = a.applicantName || a.user.fullName;
                          const email = a.applicantEmail || a.user.email;
                          const phone = a.applicantPhone || a.user.phoneNumber;
                          return (
                            <div key={a.id} className="rounded-xl border border-white/[0.06] bg-black/20 px-4 py-3">
                              <div className="flex flex-wrap items-start justify-between gap-3">
                                <div>
                                  <p className="text-[10px] font-semibold uppercase tracking-wider text-[#D4AF37]/80">
                                    Applicant (as submitted)
                                  </p>
                                  <p className="text-sm font-medium text-white">{name}</p>
                                  <p className="text-[11px] text-white/40">{a.user.collegeName}</p>
                                  <p className="mt-1 text-[11px] text-white/50">{email}</p>
                                  <p className="text-[11px] text-white/50">{phone}</p>
                                </div>
                                <span
                                  className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide ${
                                    a.status === "APPROVED"
                                      ? "bg-emerald-500/15 text-emerald-300"
                                      : a.status === "REJECTED"
                                        ? "bg-red-500/15 text-red-300"
                                        : "bg-amber-500/15 text-amber-200"
                                  }`}
                                >
                                  {a.status === "PENDING" ? "Pending" : a.status === "APPROVED" ? "Approved" : "Declined"}
                                </span>
                              </div>
                              {a.message ? (
                                <p className="mt-3 border-t border-white/[0.06] pt-3 text-[13px] leading-relaxed text-white/55">
                                  <span className="text-[10px] font-semibold uppercase text-white/35">About · </span>
                                  {a.message}
                                </p>
                              ) : null}
                              {a.workDescription ? (
                                <p className="mt-2 text-[13px] leading-relaxed text-white/60">
                                  <span className="text-[10px] font-semibold uppercase text-white/35">Work summary · </span>
                                  {a.workDescription}
                                </p>
                              ) : null}
                              {a.submissionFileUrl ? (
                                <div className="mt-3 flex items-center justify-between gap-3 rounded-lg border border-white/[0.08] bg-white/[0.03] px-3 py-2">
                                  <div className="min-w-0">
                                    <p className="truncate text-xs font-medium text-white/80">
                                      {a.submissionFileName || "submission-file"}
                                    </p>
                                    <p className="text-[10px] text-white/35">
                                      {a.submissionFileMime || "document"}
                                      {typeof a.submissionFileSize === "number"
                                        ? ` · ${(a.submissionFileSize / (1024 * 1024)).toFixed(2)} MB`
                                        : ""}
                                    </p>
                                  </div>
                                  <a
                                    href={a.submissionFileUrl}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="shrink-0 rounded-md border border-white/20 px-2.5 py-1 text-[11px] font-semibold text-white/80 hover:bg-white/[0.07]"
                                  >
                                    Open file
                                  </a>
                                </div>
                              ) : null}
                              {a.status === "PENDING" ? (
                                <div className="mt-4 flex flex-wrap gap-2">
                                  <button
                                    type="button"
                                    disabled={busy === a.id}
                                    onClick={() => void setStatus(a.id, "APPROVED")}
                                    className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-500/20 px-4 py-2 text-xs font-semibold text-emerald-200 transition hover:bg-emerald-500/30 disabled:opacity-50"
                                  >
                                    {busy === a.id ? (
                                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                    ) : (
                                      <Check className="h-3.5 w-3.5" />
                                    )}
                                    Approve
                                  </button>
                                  <button
                                    type="button"
                                    disabled={busy === a.id}
                                    onClick={() => void setStatus(a.id, "REJECTED")}
                                    className="inline-flex items-center gap-1.5 rounded-xl bg-red-500/15 px-4 py-2 text-xs font-semibold text-red-200 transition hover:bg-red-500/25 disabled:opacity-50"
                                  >
                                    <X className="h-3.5 w-3.5" />
                                    Decline
                                  </button>
                                </div>
                              ) : null}
                            </div>
                          );
                        })
                      )}
                    </div>
                  </motion.div>
                ) : null}
              </AnimatePresence>
            </div>
          );
        })}
      </div>
    </div>
  );
}
