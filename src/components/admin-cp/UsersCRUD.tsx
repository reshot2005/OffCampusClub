"use client";

import { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { Search, Shield, Ban, Key, Trash2, ChevronDown, UserCheck, UserX } from "lucide-react";
import { pusherClient } from "@/lib/pusher";

type User = {
  id: string; fullName: string; email: string; phoneNumber: string; collegeName: string;
  role: string; approvalStatus: string; suspended: boolean; adminLevel: string | null;
  createdAt: string; referralCode: string | null; clubs: string[];
};

export function UsersCRUD({ users: initial }: { users: User[] }) {
  const router = useRouter();
  const [users, setUsers] = useState(initial);
  const [q, setQ] = useState("");
  const [roleF, setRoleF] = useState("");
  const [statusF, setStatusF] = useState("");

  useEffect(() => {
    setUsers(initial);
  }, [initial]);

  useEffect(() => {
    const channel = pusherClient?.subscribe("system-updates");
    const onUpdate = () => { router.refresh(); };
    channel?.bind("user-updated", onUpdate);
    return () => {
      channel?.unbind("user-updated", onUpdate);
      pusherClient?.unsubscribe("system-updates");
    };
  }, [router]);

  const filtered = useMemo(() => {
    return users.filter((u) => {
      if (q && !`${u.fullName} ${u.email} ${u.collegeName}`.toLowerCase().includes(q.toLowerCase())) return false;
      if (roleF && u.role !== roleF) return false;
      if (statusF === "SUSPENDED" && !u.suspended) return false;
      if (statusF && statusF !== "SUSPENDED" && u.approvalStatus !== statusF) return false;
      return true;
    });
  }, [users, q, roleF, statusF]);

  const action = async (id: string, body: Record<string, any>, successMsg: string) => {
    try {
      const res = await fetch(`/api/admin-cp/users/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error || "Failed"); return null; }
      toast.success(successMsg);
      return data;
    } catch { toast.error("Network error"); return null; }
  };

  const suspend = async (u: User) => {
    const r = await action(u.id, { suspended: !u.suspended }, u.suspended ? "Unsuspended" : "Suspended");
    if (r) setUsers((p) => p.map((x) => x.id === u.id ? { ...x, suspended: !x.suspended } : x));
  };

  const changeRole = async (u: User, role: string) => {
    const r = await action(u.id, { role }, `Role changed to ${role}`);
    if (r) setUsers((p) => p.map((x) => x.id === u.id ? { ...x, role } : x));
  };

  const resetPw = async (u: User) => {
    if (!confirm(`Reset password for ${u.fullName}?`)) return;
    const r = await action(u.id, { resetPassword: true }, "Password reset");
    if (r?.tempPassword) {
      prompt("Temporary password (copy it now):", r.tempPassword);
    }
  };

  const deleteUser = async (u: User) => {
    if (!confirm(`Delete ${u.fullName}? This cannot be undone.`)) return;
    try {
      const res = await fetch(`/api/admin-cp/users/${u.id}`, { method: "DELETE" });
      if (!res.ok) { toast.error("Failed"); return; }
      setUsers((p) => p.filter((x) => x.id !== u.id));
      toast.success("User deleted");
    } catch { toast.error("Failed"); }
  };

  return (
    <div className="space-y-6">
      <div>
        <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#5227FF]">Directory</p>
        <h1 className="mt-1 text-2xl font-bold text-white">Users ({users.length})</h1>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/30" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search name, email, college..."
            className="w-full rounded-xl border border-white/10 bg-white/[0.03] pl-10 pr-4 py-2.5 text-sm text-white outline-none focus:border-[#5227FF]/50"
          />
        </div>
        <select value={roleF} onChange={(e) => setRoleF(e.target.value)} className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2.5 text-sm text-white outline-none">
          <option value="">All roles</option>
          <option value="STUDENT">Student</option>
          <option value="CLUB_HEADER">Club Header</option>
          <option value="ADMIN">Admin</option>
        </select>
        <select value={statusF} onChange={(e) => setStatusF(e.target.value)} className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2.5 text-sm text-white outline-none">
          <option value="">All status</option>
          <option value="PENDING">Pending</option>
          <option value="APPROVED">Approved</option>
          <option value="REJECTED">Rejected</option>
          <option value="SUSPENDED">Suspended</option>
        </select>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-2xl border border-white/[0.06]">
        <table className="w-full min-w-[800px] text-left text-sm">
          <thead className="border-b border-white/[0.06] bg-white/[0.02]">
            <tr className="text-[10px] uppercase tracking-widest text-white/30">
              <th className="px-4 py-3">User</th>
              <th className="px-4 py-3">Role</th>
              <th className="px-4 py-3">Clubs</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((u, i) => (
              <motion.tr key={u.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.02 }}
                className="border-b border-white/[0.04] hover:bg-white/[0.02]"
              >
                <td className="px-4 py-3">
                  <p className="font-semibold text-white text-[13px]">{u.fullName}</p>
                  <p className="text-[11px] text-white/40 font-mono">{u.email}</p>
                  <p className="text-[10px] text-white/30 font-mono">{u.phoneNumber}</p>
                  <p className="text-[10px] text-white/25 mt-0.5">{u.collegeName}</p>
                </td>
                <td className="px-4 py-3">
                  <select value={u.role} onChange={(e) => changeRole(u, e.target.value)}
                    className="rounded-lg border border-white/10 bg-white/[0.03] px-2 py-1 text-xs text-white outline-none"
                    disabled={u.role === "ADMIN"}
                  >
                    <option value="STUDENT">Student</option>
                    <option value="CLUB_HEADER">Club Header</option>
                    <option value="ADMIN">Admin</option>
                  </select>
                </td>
                <td className="px-4 py-3 text-xs text-white/40">{u.clubs.join(", ") || "—"}</td>
                <td className="px-4 py-3">
                  <div className="flex flex-col gap-1">
                    <span className={`inline-block w-fit rounded-full px-2 py-0.5 text-[9px] font-bold uppercase ${
                      u.approvalStatus === "APPROVED" ? "bg-[#00E87A]/15 text-[#00E87A]"
                      : u.approvalStatus === "PENDING" ? "bg-amber-500/15 text-amber-300"
                      : "bg-red-500/15 text-red-300"
                    }`}>{u.approvalStatus}</span>
                    {u.suspended && <span className="inline-block w-fit rounded-full px-2 py-0.5 text-[9px] font-bold uppercase bg-red-500/15 text-red-400">Suspended</span>}
                  </div>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-1.5">
                    <button onClick={() => suspend(u)} title={u.suspended ? "Unsuspend" : "Suspend"}
                      className={`p-1.5 rounded-lg ${u.suspended ? "bg-[#00E87A]/10 text-[#00E87A]" : "bg-white/5 text-white/40 hover:text-amber-400"} transition-all`}
                    >
                      {u.suspended ? <UserCheck className="h-3.5 w-3.5" /> : <Ban className="h-3.5 w-3.5" />}
                    </button>
                    <button onClick={() => resetPw(u)} title="Reset password" className="p-1.5 rounded-lg bg-white/5 text-white/40 hover:text-white transition-all">
                      <Key className="h-3.5 w-3.5" />
                    </button>
                    {u.role !== "ADMIN" && (
                      <button onClick={() => deleteUser(u)} title="Delete" className="p-1.5 rounded-lg bg-white/5 text-white/40 hover:text-red-400 transition-all">
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>
      {filtered.length === 0 && <div className="py-12 text-center text-sm text-white/25">No users match your filters</div>}
    </div>
  );
}
