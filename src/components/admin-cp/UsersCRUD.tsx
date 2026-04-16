"use client";

import { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { Search, Ban, Key, Trash2, UserCheck } from "lucide-react";
import { pusherClient } from "@/lib/pusher";

type User = {
  id: string; fullName: string; email: string; phoneNumber: string | null; collegeName: string;
  role: string; approvalStatus: string; suspended: boolean;
  createdAt: string; updatedAt: string; referralCode: string | null; clubs: string[];
  referredByInfo?: { name: string; code: string | null } | null;
  isPhoneLegit?: boolean;
};

export function UsersCRUD({ users: initial }: { users: User[] }) {
  const router = useRouter();
  const [users, setUsers] = useState(initial);
  const [q, setQ] = useState("");
  const [roleF, setRoleF] = useState("");
  const [statusF, setStatusF] = useState("");
  const [phoneF, setPhoneF] = useState("");

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
      if (q) {
        const searchStr = `${u.fullName} ${u.email} ${u.collegeName} ${u.referredByInfo?.name || ""} ${u.referredByInfo?.code || ""}`.toLowerCase();
        if (!searchStr.includes(q.toLowerCase())) return false;
      }
      if (roleF && u.role !== roleF) return false;
      if (statusF === "SUSPENDED" && !u.suspended) return false;
      if (statusF && statusF !== "SUSPENDED" && u.approvalStatus !== statusF) return false;
      
      if (phoneF === "LEGIT" && !u.isPhoneLegit) return false;
      if (phoneF === "SUSPECT" && (u.isPhoneLegit || !u.phoneNumber)) return false;
      if (phoneF === "MISSING" && u.phoneNumber) return false;
      
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

  const formatAgo = (iso: string) => {
    const t = new Date(iso).getTime();
    const diff = Date.now() - t;
    if (diff < 60_000) return "just now";
    if (diff < 3_600_000) return `${Math.floor(diff / 60_000)} mins ago`;
    if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)} hrs ago`;
    if (diff < 7 * 86_400_000) return `${Math.floor(diff / 86_400_000)} days ago`;
    return new Date(iso).toLocaleDateString();
  };

  const joinStats = useMemo(() => {
    const now = Date.now();
    const mins15 = 15 * 60_000;
    const hr1 = 60 * 60_000;
    const day1 = 24 * 60 * 60_000;
    const week1 = 7 * day1;
    const joined = users.map((u) => ({ ...u, joinedAtMs: new Date(u.createdAt).getTime() }));
    return {
      justNow: joined.filter((u) => now - u.joinedAtMs <= mins15).length,
      lastHour: joined.filter((u) => now - u.joinedAtMs <= hr1).length,
      today: joined.filter((u) => now - u.joinedAtMs <= day1).length,
      thisWeek: joined.filter((u) => now - u.joinedAtMs <= week1).length,
      latest: [...joined].sort((a, b) => b.joinedAtMs - a.joinedAtMs).slice(0, 8),
    };
  }, [users]);

  const activityStats = useMemo(() => {
    const now = Date.now();
    const day1 = 24 * 60 * 60_000;
    const week1 = 7 * day1;
    const updated = users.map((u) => ({ ...u, activityMs: new Date(u.updatedAt).getTime() }));
    return {
      today: updated.filter((u) => now - u.activityMs <= day1).length,
      thisWeek: updated.filter((u) => now - u.activityMs <= week1).length,
      latest: [...updated].sort((a, b) => b.activityMs - a.activityMs).slice(0, 8),
    };
  }, [users]);

  return (
    <div className="space-y-6">
      <div>
        <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#5227FF]">Directory</p>
        <h1 className="mt-1 text-2xl font-bold text-white">Users ({users.length})</h1>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
          <p className="text-[10px] uppercase tracking-wider text-white/40">Just now</p>
          <p className="mt-1 text-xl font-bold text-white">{joinStats.justNow}</p>
        </div>
        <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
          <p className="text-[10px] uppercase tracking-wider text-white/40">Last hour</p>
          <p className="mt-1 text-xl font-bold text-white">{joinStats.lastHour}</p>
        </div>
        <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
          <p className="text-[10px] uppercase tracking-wider text-white/40">Joined today</p>
          <p className="mt-1 text-xl font-bold text-white">{joinStats.today}</p>
        </div>
        <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
          <p className="text-[10px] uppercase tracking-wider text-white/40">Joined this week</p>
          <p className="mt-1 text-xl font-bold text-white">{joinStats.thisWeek}</p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4">
          <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#5227FF]">Recent joiners</p>
          <div className="mt-3 space-y-2">
            {joinStats.latest.map((u) => (
              <div key={u.id} className="flex items-center justify-between rounded-lg border border-white/[0.06] px-3 py-2">
                <div>
                  <p className="text-sm font-semibold text-white">{u.fullName}</p>
                  <p className="text-[11px] text-white/45">{u.email}</p>
                </div>
                <p className="text-[11px] text-white/50">{formatAgo(u.createdAt)}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4">
          <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#5227FF]">Recent activity</p>
          <p className="mt-1 text-[11px] text-white/40">Based on latest user record updates</p>
          <div className="mt-3 mb-3 flex gap-3 text-xs text-white/60">
            <span>Today: <strong className="text-white">{activityStats.today}</strong></span>
            <span>This week: <strong className="text-white">{activityStats.thisWeek}</strong></span>
          </div>
          <div className="space-y-2">
            {activityStats.latest.map((u) => (
              <div key={u.id} className="flex items-center justify-between rounded-lg border border-white/[0.06] px-3 py-2">
                <div>
                  <p className="text-sm font-semibold text-white">{u.fullName}</p>
                  <p className="text-[11px] text-white/45">{u.email}</p>
                </div>
                <p className="text-[11px] text-white/50">{formatAgo(u.updatedAt)}</p>
              </div>
            ))}
          </div>
        </div>
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
        <select value={phoneF} onChange={(e) => setPhoneF(e.target.value)} className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2.5 text-sm text-white outline-none">
          <option value="">All Phones</option>
          <option value="LEGIT">Legit Only</option>
          <option value="SUSPECT">Suspicious Only</option>
          <option value="MISSING">Missing Only</option>
        </select>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-2xl border border-white/[0.06]">
        <table className="w-full min-w-[800px] text-left text-sm">
          <thead className="border-b border-white/[0.06] bg-white/[0.02]">
            <tr className="text-[10px] uppercase tracking-widest text-white/30">
              <th className="px-4 py-3">User</th>
              <th className="px-4 py-3">Role</th>
              <th className="px-4 py-3">Clubs joined</th>
              <th className="px-4 py-3">Referred By</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((u, i) => {
              const isNewUser = new Date(u.createdAt).getTime() > new Date("2026-04-16T19:30:00Z").getTime();
              return (
                <motion.tr key={u.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.02 }}
                  className="border-b border-white/[0.04] hover:bg-white/[0.02]"
                >
                  <td className="px-4 py-3">
                    <p className="font-semibold text-white text-[13px]">{u.fullName}</p>
                    <p className="text-[11px] text-white/40 font-mono">{u.email}</p>
                    {u.phoneNumber && (
                      <div className="flex flex-col gap-1 mt-0.5">
                        <div className="flex items-center gap-1.5">
                          <p className={`text-[10px] font-mono italic ${isNewUser && u.isPhoneLegit ? "text-[#00E87A]" : !u.isPhoneLegit ? "text-red-400/80" : "text-white/40"}`}>
                            {u.phoneNumber}
                          </p>
                          {u.isPhoneLegit ? (
                            isNewUser ? (
                              <div className="flex h-3 w-3 items-center justify-center rounded-full bg-[#00E87A]/20" title="Verified New User">
                                <div className="h-1.5 w-1.5 rounded-full bg-[#00E87A]" />
                              </div>
                            ) : null
                          ) : (
                            <div className="flex h-3 w-3 items-center justify-center rounded-full bg-red-500/20" title="Suspicious / Dummy Pattern">
                              <div className="h-1.5 w-1.5 rounded-full bg-red-500" />
                            </div>
                          )}
                        </div>
                        {(!u.isPhoneLegit || (isNewUser && u.isPhoneLegit)) && (
                          <span className={`text-[8px] font-black tracking-widest uppercase w-fit px-1 rounded ${u.isPhoneLegit ? "bg-[#00E87A]/10 text-[#00E87A]/70" : "bg-red-500/10 text-red-500/60"}`}>
                            {u.isPhoneLegit ? "Verified" : "Suspect"}
                          </span>
                        )}
                      </div>
                    )}
                    <p className="text-[10px] text-white/25 mt-0.5">{u.collegeName}</p>
                  </td>
                  <td className="px-4 py-3">
                    <span className="inline-block rounded-lg border border-white/10 bg-white/[0.03] px-2 py-1 text-xs text-white">
                      {u.role}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-white/40">{u.clubs.join(", ") || "—"}</td>
                  <td className="px-4 py-3">
                    {u.referredByInfo ? (
                      <div>
                        <p className="text-[11px] font-semibold text-white/70">{u.referredByInfo.name}</p>
                        <p className="text-[9px] font-mono text-indigo-400 capitalize">{u.referredByInfo.code || "No Code"}</p>
                      </div>
                    ) : (
                      <span className="text-white/20">—</span>
                    )}
                  </td>
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
              );
            })}
          </tbody>
        </table>
      </div>
      {filtered.length === 0 && <div className="py-12 text-center text-sm text-white/25">No users match your filters</div>}
    </div>
  );
}
