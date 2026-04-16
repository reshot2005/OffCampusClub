"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { CheckCircle2, XCircle, UserCheck } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

type Approval = {
  id: string; fullName: string; email: string; phoneNumber: string | null; collegeName: string;
  bio: string | null; city: string | null; createdAt: string;
  club: { name: string; slug: string } | null;
};

export function ApprovalsPanel({ approvals: initial }: { approvals: Approval[] }) {
  const router = useRouter();
  const [approvals, setApprovals] = useState(initial);

  const decide = async (id: string, action: "approve" | "reject") => {
    try {
      const url = action === "approve" ? `/api/admin/approve/${id}` : `/api/admin/reject/${id}`;
      const res = await fetch(url, { method: "PATCH", headers: { "Content-Type": "application/json" } });
      if (!res.ok) { toast.error("Failed"); return; }
      setApprovals((p) => p.filter((a) => a.id !== id));
      router.refresh();
      toast.success(action === "approve" ? "Approved!" : "Rejected");
    } catch { toast.error("Error"); }
  };

  return (
    <div className="space-y-6">
      <div>
        <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#5227FF]">Queue</p>
        <h1 className="mt-1 text-2xl font-bold text-white flex items-center gap-3">
          <UserCheck className="h-6 w-6 text-[#5227FF]" /> Approvals ({approvals.length})
        </h1>
      </div>

      {approvals.length === 0 && (
        <div className="py-16 text-center">
          <CheckCircle2 className="h-12 w-12 text-[#00E87A]/30 mx-auto mb-3" />
          <p className="text-sm text-white/30">No pending approvals 🎉</p>
        </div>
      )}

      <div className="space-y-3">
        {approvals.map((a, i) => (
          <motion.div key={a.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
            className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-[#5227FF] to-[#8C6DFD] flex items-center justify-center text-sm font-bold text-white">
                    {a.fullName.charAt(0)}
                  </div>
                  <div>
                    <p className="font-bold text-white text-[15px]">{a.fullName}</p>
                    <p className="text-[11px] text-white/40 font-mono">{a.email}</p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2 text-[11px] text-white/35 mt-2">
                  <span>📞 {a.phoneNumber || "No phone"}</span>
                  <span>🏫 {a.collegeName}</span>
                  {a.city && <span>📍 {a.city}</span>}
                  {a.club && <span className="text-[#5227FF]">🎯 {a.club.name}</span>}
                </div>
                {a.bio && <p className="text-xs text-white/30 mt-2 leading-relaxed line-clamp-2">{a.bio}</p>}
                <p className="text-[10px] text-white/20 mt-2">{formatDistanceToNow(new Date(a.createdAt), { addSuffix: true })}</p>
              </div>
              <div className="flex gap-2 flex-shrink-0">
                <button onClick={() => decide(a.id, "approve")}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#00E87A]/10 border border-[#00E87A]/20 text-[#00E87A] text-xs font-bold hover:bg-[#00E87A]/20">
                  <CheckCircle2 className="h-3.5 w-3.5" /> Approve
                </button>
                <button onClick={() => decide(a.id, "reject")}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-bold hover:bg-red-500/20">
                  <XCircle className="h-3.5 w-3.5" /> Reject
                </button>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
