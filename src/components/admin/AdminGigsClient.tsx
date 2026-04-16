"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import {
  ChevronDown,
  Pencil,
  Trash2,
  X,
  Check,
  Loader2,
  AlertTriangle,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";

export type AdminGigRow = {
  id: string;
  title: string;
  description: string;
  payMin: number;
  payMax: number;
  createdAt: string;
  club: { id: string; name: string; slug: string } | null;
  postedBy: { id: string; fullName: string; email: string } | null;
  applications: {
    id: string;
    status: string;
    message: string | null;
    createdAt: string;
    user: { id: string; fullName: string; email: string; phoneNumber: string | null };
  }[];
};

type EditForm = {
  title: string;
  description: string;
  payMin: number;
  payMax: number;
};

export function AdminGigsClient({ gigs: initial }: { gigs: AdminGigRow[] }) {
  const router = useRouter();
  const [gigs, setGigs] = useState(initial);
  const [openId, setOpenId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<EditForm>({
    title: "",
    description: "",
    payMin: 0,
    payMax: 0,
  });
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const stats = useMemo(() => {
    let apps = 0;
    let pending = 0;
    for (const g of gigs) {
      for (const a of g.applications) {
        apps += 1;
        if (a.status === "PENDING") pending += 1;
      }
    }
    return { apps, pending, gigs: gigs.length };
  }, [gigs]);

  const startEdit = (gig: AdminGigRow) => {
    setEditingId(gig.id);
    setEditForm({
      title: gig.title,
      description: gig.description,
      payMin: gig.payMin,
      payMax: gig.payMax,
    });
    // Ensure the gig is expanded
    if (openId !== gig.id) setOpenId(gig.id);
  };

  const cancelEdit = () => {
    setEditingId(null);
  };

  const saveEdit = async (gigId: string) => {
    if (editForm.title.trim().length < 3) {
      toast.error("Title must be at least 3 characters");
      return;
    }
    if (editForm.description.trim().length < 10) {
      toast.error("Description must be at least 10 characters");
      return;
    }
    if (editForm.payMax < editForm.payMin) {
      toast.error("Max pay must be ≥ min pay");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch(`/api/admin-cp/gigs/${gigId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editForm),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        toast.error(data?.error ?? "Failed to update gig");
        return;
      }
      // Update local state
      setGigs((prev) =>
        prev.map((g) =>
          g.id === gigId
            ? { ...g, ...editForm }
            : g,
        ),
      );
      setEditingId(null);
      toast.success("Gig updated successfully");
      router.refresh();
    } catch {
      toast.error("Network error — try again");
    } finally {
      setSaving(false);
    }
  };

  const deleteGig = async (gigId: string) => {
    setDeletingId(gigId);
    try {
      const res = await fetch(`/api/admin-cp/gigs/${gigId}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        toast.error("Failed to delete gig");
        return;
      }
      setGigs((prev) => prev.filter((g) => g.id !== gigId));
      setConfirmDeleteId(null);
      if (openId === gigId) setOpenId(null);
      if (editingId === gigId) setEditingId(null);
      toast.success("Gig deleted");
      router.refresh();
    } catch {
      toast.error("Network error — try again");
    } finally {
      setDeletingId(null);
    }
  };

  const inputClass =
    "w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2.5 text-sm text-white outline-none transition-colors focus:border-[#8C6DFD]/50 focus:ring-1 focus:ring-[#8C6DFD]/30 placeholder:text-white/25";

  return (
    <div className="space-y-8">
      <div>
        <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-[#8C6DFD]">Operations</p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-white">Gigs &amp; hires</h1>
        <p className="mt-2 max-w-2xl text-sm text-white/45">
          Full visibility into club-posted gigs, applicants, and outcomes. Events also generate staff notifications.
        </p>
        <div className="mt-6 flex flex-wrap gap-4">
          <div className="rounded-2xl border border-white/[0.08] bg-white/[0.03] px-5 py-3">
            <p className="text-[10px] uppercase tracking-wider text-white/35">Gigs</p>
            <p className="text-xl font-semibold text-white">{stats.gigs}</p>
          </div>
          <div className="rounded-2xl border border-white/[0.08] bg-white/[0.03] px-5 py-3">
            <p className="text-[10px] uppercase tracking-wider text-white/35">Applications</p>
            <p className="text-xl font-semibold text-white">{stats.apps}</p>
          </div>
          <div className="rounded-2xl border border-white/[0.08] bg-white/[0.03] px-5 py-3">
            <p className="text-[10px] uppercase tracking-wider text-white/35">Awaiting header</p>
            <p className="text-xl font-semibold text-amber-200/90">{stats.pending}</p>
          </div>
        </div>
      </div>

      <div className="space-y-2">
        {gigs.length === 0 ? (
          <div className="rounded-2xl border border-white/[0.08] py-16 text-center text-sm text-white/35">
            No gigs in the system yet.
          </div>
        ) : (
          gigs.map((gig) => {
            const open = openId === gig.id;
            const isEditing = editingId === gig.id;
            const isDeleting = deletingId === gig.id;
            const isConfirmDelete = confirmDeleteId === gig.id;

            return (
              <div
                key={gig.id}
                className={`overflow-hidden rounded-2xl border transition-colors ${
                  isEditing
                    ? "border-[#8C6DFD]/30 bg-white/[0.04]"
                    : isConfirmDelete
                      ? "border-red-500/30 bg-red-500/[0.03]"
                      : "border-white/[0.08] bg-white/[0.03]"
                }`}
              >
                {/* Header row */}
                <div className="flex w-full items-center justify-between gap-4 px-5 py-4">
                  <button
                    type="button"
                    onClick={() => {
                      if (!isEditing) setOpenId(open ? null : gig.id);
                    }}
                    className="flex min-w-0 flex-1 items-center gap-4 text-left hover:opacity-80 transition-opacity"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-[15px] font-semibold text-white truncate">{gig.title}</p>
                      <p className="mt-1 text-xs text-white/40">
                        {gig.club?.name ?? "—"} · {gig.postedBy?.fullName ?? "—"} ·{" "}
                        {format(new Date(gig.createdAt), "dd MMM yyyy HH:mm")}
                      </p>
                    </div>
                  </button>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <span className="text-xs text-white/35 mr-1">{gig.applications.length} apps</span>

                    {/* Edit button */}
                    {!isEditing && !isConfirmDelete && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          startEdit(gig);
                        }}
                        className="flex h-8 w-8 items-center justify-center rounded-lg text-white/30 transition-colors hover:bg-[#8C6DFD]/15 hover:text-[#8C6DFD]"
                        title="Edit gig"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                    )}

                    {/* Delete button */}
                    {!isEditing && !isConfirmDelete && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setConfirmDeleteId(gig.id);
                        }}
                        className="flex h-8 w-8 items-center justify-center rounded-lg text-white/30 transition-colors hover:bg-red-500/15 hover:text-red-400"
                        title="Delete gig"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    )}

                    {/* Confirm delete buttons */}
                    {isConfirmDelete && (
                      <div className="flex items-center gap-2">
                        <span className="flex items-center gap-1.5 text-[11px] font-medium text-red-300">
                          <AlertTriangle className="h-3.5 w-3.5" />
                          Delete?
                        </span>
                        <button
                          type="button"
                          onClick={() => deleteGig(gig.id)}
                          disabled={isDeleting}
                          className="flex h-7 items-center gap-1 rounded-lg bg-red-500/20 px-3 text-[11px] font-semibold text-red-300 transition-colors hover:bg-red-500/30 disabled:opacity-50"
                        >
                          {isDeleting ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          ) : (
                            <Trash2 className="h-3 w-3" />
                          )}
                          Yes
                        </button>
                        <button
                          type="button"
                          onClick={() => setConfirmDeleteId(null)}
                          className="flex h-7 items-center gap-1 rounded-lg border border-white/10 px-3 text-[11px] font-medium text-white/50 transition-colors hover:bg-white/5"
                        >
                          <X className="h-3 w-3" />
                          No
                        </button>
                      </div>
                    )}

                    {/* Edit mode action buttons in header */}
                    {isEditing && (
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => saveEdit(gig.id)}
                          disabled={saving}
                          className="flex h-8 items-center gap-1.5 rounded-lg bg-[#8C6DFD]/20 px-3 text-[11px] font-semibold text-[#8C6DFD] transition-colors hover:bg-[#8C6DFD]/30 disabled:opacity-50"
                        >
                          {saving ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <Check className="h-3.5 w-3.5" />
                          )}
                          Save
                        </button>
                        <button
                          type="button"
                          onClick={cancelEdit}
                          className="flex h-8 w-8 items-center justify-center rounded-lg text-white/30 transition-colors hover:bg-white/5 hover:text-white/60"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    )}

                    {!isEditing && !isConfirmDelete && (
                      <ChevronDown
                        className={`h-5 w-5 shrink-0 text-white/30 transition-transform ${open ? "rotate-180" : ""}`}
                      />
                    )}
                  </div>
                </div>

                {/* Expanded content */}
                <AnimatePresence initial={false}>
                  {open ? (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="border-t border-white/[0.06]"
                    >
                      {isEditing ? (
                        /* ─── Edit Form ─── */
                        <div className="space-y-4 px-5 py-5">
                          <div>
                            <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-[0.2em] text-white/40">
                              Title
                            </label>
                            <input
                              type="text"
                              className={inputClass}
                              value={editForm.title}
                              onChange={(e) =>
                                setEditForm((prev) => ({ ...prev, title: e.target.value }))
                              }
                              placeholder="Gig title"
                            />
                          </div>
                          <div>
                            <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-[0.2em] text-white/40">
                              Description
                            </label>
                            <textarea
                              className={`${inputClass} min-h-[100px] resize-none`}
                              rows={4}
                              value={editForm.description}
                              onChange={(e) =>
                                setEditForm((prev) => ({ ...prev, description: e.target.value }))
                              }
                              placeholder="Gig description"
                            />
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-[0.2em] text-white/40">
                                Pay Min (₹)
                              </label>
                              <input
                                type="number"
                                min={0}
                                className={inputClass}
                                value={editForm.payMin}
                                onChange={(e) =>
                                  setEditForm((prev) => ({
                                    ...prev,
                                    payMin: parseInt(e.target.value) || 0,
                                  }))
                                }
                              />
                            </div>
                            <div>
                              <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-[0.2em] text-white/40">
                                Pay Max (₹)
                              </label>
                              <input
                                type="number"
                                min={0}
                                className={inputClass}
                                value={editForm.payMax}
                                onChange={(e) =>
                                  setEditForm((prev) => ({
                                    ...prev,
                                    payMax: parseInt(e.target.value) || 0,
                                  }))
                                }
                              />
                            </div>
                          </div>
                        </div>
                      ) : (
                        /* ─── Read-only Details ─── */
                        <>
                          <p className="px-5 py-3 text-[13px] leading-relaxed text-white/45">
                            {gig.description}
                          </p>
                          <p className="px-5 pb-2 text-xs text-emerald-200/80">
                            ₹{gig.payMin.toLocaleString("en-IN")} – ₹{gig.payMax.toLocaleString("en-IN")}
                          </p>
                        </>
                      )}

                      {/* Applications list (always visible when expanded) */}
                      {!isEditing && (
                        <div className="space-y-2 px-3 pb-4">
                          {gig.applications.length === 0 ? (
                            <p className="py-4 text-center text-xs text-white/20">
                              No applications yet
                            </p>
                          ) : (
                            gig.applications.map((a) => (
                              <div
                                key={a.id}
                                className="rounded-xl border border-white/[0.06] bg-black/25 px-4 py-3 text-[13px]"
                              >
                                <div className="flex flex-wrap items-center justify-between gap-2">
                                  <span className="font-medium text-white">{a.user.fullName}</span>
                                  <span
                                    className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase ${
                                      a.status === "APPROVED"
                                        ? "bg-emerald-500/20 text-emerald-200"
                                        : a.status === "REJECTED"
                                          ? "bg-red-500/20 text-red-200"
                                          : "bg-amber-500/20 text-amber-100"
                                    }`}
                                  >
                                    {a.status}
                                  </span>
                                </div>
                                <p className="mt-1 text-[11px] text-white/35">{a.user.email}</p>
                                <p className="text-[11px] text-white/35">{a.user.phoneNumber || "No phone"}</p>
                                {a.message ? (
                                  <p className="mt-2 border-t border-white/[0.06] pt-2 text-white/50">
                                    {a.message}
                                  </p>
                                ) : null}
                              </div>
                            ))
                          )}
                        </div>
                      )}
                    </motion.div>
                  ) : null}
                </AnimatePresence>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
