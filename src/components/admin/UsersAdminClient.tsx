"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { staffHref } from "@/lib/staff-paths";

export type AdminUserRow = {
  id: string;
  fullName: string;
  email: string;
  phoneNumber: string;
  role: string;
  approvalStatus: string;
  collegeName: string;
  suspended: boolean;
  createdAt: string;
  referralCode: string | null;
  memberships: { club: { name: string } }[];
  _count: { referralStatsAsStudent: number; referralStatsAsHeader: number };
};

export function UsersAdminClient({
  users: initial,
  initialQ,
  initialRole,
  initialStatus,
}: {
  users: AdminUserRow[];
  initialQ: string;
  initialRole: string;
  initialStatus: string;
}) {
  const router = useRouter();
  const [q, setQ] = useState(initialQ);
  const [role, setRole] = useState(initialRole);
  const [status, setStatus] = useState(initialStatus);
  const [users, setUsers] = useState(initial);

  const applyFilters = () => {
    const params = new URLSearchParams();
    if (q.trim()) params.set("q", q.trim());
    if (role) params.set("role", role);
    if (status) params.set("status", status);
    router.push(`${staffHref("/users")}?${params.toString()}`);
    router.refresh();
  };

  const toggleSuspend = async (u: AdminUserRow) => {
    const res = await fetch(`/api/admin/users/${u.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ suspended: !u.suspended }),
    });
    if (!res.ok) {
      toast.error("Could not update user");
      return;
    }
    setUsers((prev) => prev.map((x) => (x.id === u.id ? { ...x, suspended: !x.suspended } : x)));
    toast.success(u.suspended ? "User unsuspended" : "User suspended");
  };

  const rows = useMemo(() => users, [users]);

  return (
    <div className="space-y-6">
      <div>
        <p className="font-mono text-[10px] uppercase tracking-[0.45em] text-[#C9A96E]">Directory</p>
        <h1 className="font-serif text-3xl italic text-[#F5F1EB] md:text-4xl">All users</h1>
      </div>

      <div className="flex flex-col gap-3 rounded-2xl border border-[#C9A96E]/20 bg-[rgba(255,248,235,0.04)] p-4 md:flex-row md:flex-wrap md:items-end">
        <div className="min-w-[200px] flex-1">
          <label className="font-mono text-[10px] uppercase tracking-widest text-white/40">Search</label>
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Name, email, college…"
            className="mt-1 w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white outline-none focus:border-[#C9A96E]/50"
          />
        </div>
        <div>
          <label className="font-mono text-[10px] uppercase tracking-widest text-white/40">Role</label>
          <select
            value={role}
            onChange={(e) => setRole(e.target.value)}
            className="mt-1 w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white md:w-40"
          >
            <option value="">All</option>
            <option value="STUDENT">Student</option>
            <option value="CLUB_HEADER">Club header</option>
            <option value="ADMIN">Admin</option>
          </select>
        </div>
        <div>
          <label className="font-mono text-[10px] uppercase tracking-widest text-white/40">Status</label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="mt-1 w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white md:w-44"
          >
            <option value="">All</option>
            <option value="PENDING">Pending</option>
            <option value="APPROVED">Approved</option>
            <option value="REJECTED">Rejected</option>
          </select>
        </div>
        <button
          type="button"
          onClick={applyFilters}
          className="rounded-full bg-[#C9A96E] px-6 py-2 text-sm font-semibold text-black"
        >
          Apply
        </button>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-white/10">
        <table className="w-full min-w-[720px] text-left text-sm text-[#F5F1EB]">
          <thead className="border-b border-white/10 bg-black/30 font-mono text-[10px] uppercase tracking-widest text-[#C9A96E]/90">
            <tr>
              <th className="px-4 py-3">User</th>
              <th className="px-4 py-3">Role</th>
              <th className="px-4 py-3">Clubs</th>
              <th className="px-4 py-3">Referrals</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((u) => (
              <tr key={u.id} className="border-b border-white/5 hover:bg-white/[0.03]">
                <td className="px-4 py-3">
                  <p className="font-medium">{u.fullName}</p>
                  <p className="font-mono text-[11px] text-white/50 mb-0.5">{u.email}</p>
                  <p className="font-mono text-[10px] text-white/40">{u.phoneNumber}</p>
                  <p className="text-xs text-white/40 mt-1">{u.collegeName}</p>
                  {u.referralCode ? (
                    <p className="mt-1 font-mono text-[10px] text-[#C9A96E]">Code {u.referralCode}</p>
                  ) : null}
                </td>
                <td className="px-4 py-3">
                  <span className="rounded-full bg-white/10 px-2 py-0.5 text-xs">{u.role}</span>
                  <p className="mt-1 text-xs text-white/50">{u.approvalStatus}</p>
                  {u.suspended ? <p className="text-xs text-[#FF4D4D]">Suspended</p> : null}
                </td>
                <td className="px-4 py-3 text-xs text-white/70">
                  {u.memberships.map((m) => m.club.name).join(", ") || "—"}
                </td>
                <td className="px-4 py-3 font-mono text-xs text-white/60">
                  in: {u._count.referralStatsAsStudent} · header: {u._count.referralStatsAsHeader}
                </td>
                <td className="px-4 py-3">
                  {u.role !== "ADMIN" ? (
                    <button
                      type="button"
                      onClick={() => toggleSuspend(u)}
                      className={`rounded-full px-3 py-1.5 text-xs font-semibold ${
                        u.suspended
                          ? "bg-[#00E87A]/20 text-[#00E87A]"
                          : "border border-[#FF4D4D]/40 text-[#FF4D4D]"
                      }`}
                    >
                      {u.suspended ? "Unsuspend" : "Suspend"}
                    </button>
                  ) : (
                    <span className="text-xs text-white/30">—</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
