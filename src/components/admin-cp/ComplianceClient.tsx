"use client";

import { useState } from "react";
import { toast } from "sonner";
import { FileKey, Download } from "lucide-react";

export function ComplianceClient() {
  const [userId, setUserId] = useState("");
  const [loading, setLoading] = useState(false);

  const exportUser = async () => {
    if (!userId.trim()) {
      toast.error("Enter user ID");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`/api/admin-cp/compliance/users/${userId.trim()}`);
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Failed");
        return;
      }
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = `occ-user-export-${userId.slice(0, 8)}.json`;
      a.click();
      URL.revokeObjectURL(a.href);
      toast.success("Download started");
    } catch {
      toast.error("Error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-xl">
      <div>
        <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#5227FF]">Privacy</p>
        <h1 className="mt-1 text-2xl font-bold text-white flex items-center gap-3">
          <FileKey className="h-6 w-6 text-[#5227FF]" /> Compliance export
        </h1>
        <p className="text-sm text-white/40 mt-1">
          Download a JSON package for one user (memberships, posts snapshot, applications, events). Audit logged.
        </p>
      </div>

      <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5 space-y-3">
        <label className="text-[10px] font-bold uppercase text-white/40">User ID (cuid)</label>
        <input
          value={userId}
          onChange={(e) => setUserId(e.target.value)}
          placeholder="clxxxxxxxx..."
          className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-white font-mono"
        />
        <button
          onClick={exportUser}
          disabled={loading}
          className="flex items-center gap-2 rounded-xl bg-[#5227FF] px-4 py-2 text-sm font-bold text-white disabled:opacity-50"
        >
          <Download className="h-4 w-4" /> {loading ? "Working…" : "Export JSON"}
        </button>
      </div>
    </div>
  );
}
