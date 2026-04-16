"use client";

import { useState } from "react";
import { toast } from "sonner";
import * as Dialog from "@radix-ui/react-dialog";
import { X } from "lucide-react";

export type ApprovalRow = {
  id: string;
  fullName: string;
  email: string;
  phoneNumber: string | null;
  collegeName: string;
  bio: string | null;
  city: string | null;
  createdAt: string;
  clubManaged: { name: string; slug?: string; icon?: string } | null;
};

export function ApprovalCard({
  approval,
  onRemoved,
}: {
  approval: ApprovalRow;
  onRemoved: (id: string) => void;
}) {
  const [loading, setLoading] = useState<"approve" | "reject" | null>(null);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState("");

  const approve = async () => {
    setLoading("approve");
    const res = await fetch(`/api/admin/approve/${approval.id}`, { method: "PATCH" });
    setLoading(null);
    if (res.ok) {
      toast.success("Approved — referral code issued");
      onRemoved(approval.id);
    } else {
      const j = await res.json().catch(() => ({}));
      toast.error(j.error || "Approve failed");
    }
  };

  const reject = async () => {
    setLoading("reject");
    const res = await fetch(`/api/admin/reject/${approval.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reason: rejectReason.trim() || "Application not selected." }),
    });
    setLoading(null);
    if (res.ok) {
      toast.success("Application rejected");
      setRejectOpen(false);
      onRemoved(approval.id);
    } else {
      toast.error("Reject failed");
    }
  };

  const appliedAgo = (() => {
    const d = new Date(approval.createdAt);
    const days = Math.floor((Date.now() - d.getTime()) / (1000 * 60 * 60 * 24));
    if (days <= 0) return "Today";
    if (days === 1) return "1 day ago";
    return `${days} days ago`;
  })();

  return (
    <>
      <div className="overflow-hidden rounded-2xl border border-[#C9A96E]/25 bg-[rgba(255,248,235,0.04)] shadow-[0_8px_40px_rgba(0,0,0,0.35)]">
        <div className="grid gap-4 p-4 md:grid-cols-[auto_1fr_1fr_auto] md:items-start md:gap-6">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#C9A96E]/40 to-[#C9A96E]/10 text-lg font-bold text-[#C9A96E]">
            {approval.fullName
              .split(" ")
              .map((n) => n[0])
              .join("")
              .slice(0, 2)
              .toUpperCase()}
          </div>
          <div className="min-w-0 space-y-1">
            <p className="font-serif text-xl italic text-[#F5F1EB] md:text-2xl">{approval.fullName}</p>
            <p className="font-mono text-xs text-white/50">
              {approval.email} · {approval.phoneNumber || "No phone"}
            </p>
            <p className="text-sm text-[#C9A96E]">{approval.collegeName}</p>
            {approval.clubManaged ? (
              <span className="mt-2 inline-flex items-center rounded-full border border-[#C9A96E]/35 bg-[#C9A96E]/10 px-3 py-1 text-xs font-semibold text-[#C9A96E]">
                {approval.clubManaged.icon ?? "🎯"} {approval.clubManaged.name}
              </span>
            ) : null}
            <p className="pt-2 font-mono text-[10px] uppercase tracking-widest text-white/40">
              Applied · {appliedAgo}
            </p>
          </div>
          <div className="min-w-0 border-t border-white/10 pt-4 md:border-0 md:pt-0">
            <p className="font-mono text-[10px] uppercase tracking-[0.35em] text-[#C9A96E]">Why I want to lead</p>
            <p className="mt-2 text-sm leading-relaxed text-white/75">{approval.bio || "No statement provided."}</p>
            {approval.city ? (
              <p className="mt-2 font-mono text-xs text-white/50">Instagram / notes: {approval.city}</p>
            ) : null}
          </div>
          <div className="flex flex-row gap-2 md:flex-col md:justify-center">
            <button
              disabled={loading !== null}
              onClick={approve}
              className="rounded-xl bg-[#00E87A] px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-black shadow-lg shadow-[#00E87A]/25 transition hover:brightness-110 disabled:opacity-50"
            >
              {loading === "approve" ? "…" : "Approve"}
            </button>
            <button
              disabled={loading !== null}
              onClick={() => setRejectOpen(true)}
              className="rounded-xl border border-[#FF4D4D]/80 bg-transparent px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-[#FF4D4D] transition hover:bg-[#FF4D4D]/10 disabled:opacity-50"
            >
              Reject
            </button>
          </div>
        </div>
      </div>

      <Dialog.Root open={rejectOpen} onOpenChange={setRejectOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-[100] bg-black/70 backdrop-blur-sm" />
          <Dialog.Content className="fixed left-1/2 top-1/2 z-[101] w-[min(100%,28rem)] -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-[#C9A96E]/30 bg-[#141412] p-6 text-[#F5F1EB] shadow-2xl">
            <div className="mb-4 flex items-center justify-between">
              <Dialog.Title className="font-mono text-sm uppercase tracking-widest text-[#C9A96E]">
                Reject application
              </Dialog.Title>
              <Dialog.Close className="rounded-lg p-1 text-white/50 hover:bg-white/10 hover:text-white">
                <X className="h-5 w-5" />
              </Dialog.Close>
            </div>
            <Dialog.Description className="mb-3 text-sm text-white/60">
              Optionally add a reason. The applicant will see this in their notifications.
            </Dialog.Description>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              rows={4}
              placeholder="Reason (optional)"
              className="mb-4 w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm outline-none focus:border-[#C9A96E]/50"
            />
            <div className="flex justify-end gap-2">
              <Dialog.Close asChild>
                <button type="button" className="rounded-lg px-4 py-2 text-sm text-white/70 hover:bg-white/5">
                  Cancel
                </button>
              </Dialog.Close>
              <button
                type="button"
                disabled={loading !== null}
                onClick={reject}
                className="rounded-lg bg-[#FF4D4D]/90 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
              >
                {loading === "reject" ? "…" : "Confirm reject"}
              </button>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </>
  );
}
