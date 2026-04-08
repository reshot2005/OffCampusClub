"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Flag } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

type Report = {
  id: string;
  reason: string;
  createdAt: string;
  reporter: { fullName: string };
  comment: { id: string; content: string; post: { id: string; caption: string | null; club: { name: string } } } | null;
};

type GigApp = {
  id: string;
  message: string | null;
  applicantName: string | null;
  createdAt: string;
  gig: { id: string; title: string };
  user: { fullName: string; email: string };
};

type Ticket = {
  id: string;
  resourceType: string;
  resourceId: string;
  status: string;
  dueAt: string | null;
  notes: string | null;
  assignee: { fullName: string } | null;
};

export function ModerationQueueClient() {
  const [reports, setReports] = useState<Report[]>([]);
  const [apps, setApps] = useState<GigApp[]>([]);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    fetch("/api/admin-cp/moderation")
      .then((r) => r.json())
      .then((d) => {
        setReports(d.commentReports || []);
        setApps(d.gigApplications || []);
        setTickets(d.tickets || []);
      })
      .catch(() => toast.error("Failed to load queue"))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  const claim = async (type: "COMMENT_REPORT" | "GIG_APPLICATION", resourceId: string) => {
    const res = await fetch("/api/admin-cp/moderation", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ resourceType: type, resourceId }),
    });
    if (!res.ok) {
      const e = await res.json();
      toast.error(e.error || "Failed");
      return;
    }
    toast.success("Ticket claimed");
    load();
  };

  const updateTicket = async (ticketId: string, patch: Record<string, unknown>) => {
    const res = await fetch("/api/admin-cp/moderation", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ticketId, ...patch }),
    });
    if (!res.ok) {
      toast.error("Update failed");
      return;
    }
    toast.success("Updated");
    load();
  };

  return (
    <div className="space-y-8">
      <div>
        <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#5227FF]">Triage</p>
        <h1 className="mt-1 text-2xl font-bold text-white flex items-center gap-3">
          <Flag className="h-6 w-6 text-[#5227FF]" /> Moderation queue
        </h1>
      </div>

      {loading && <p className="text-white/30">Loading…</p>}

      <section className="space-y-3">
        <h2 className="text-sm font-bold text-white/80">Comment reports ({reports.length})</h2>
        {reports.map((r) => (
          <div
            key={r.id}
            className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4 text-sm"
          >
            <p className="text-white/50 text-xs">{formatDistanceToNow(new Date(r.createdAt), { addSuffix: true })}</p>
            <p className="text-white font-medium mt-1">{r.reason}</p>
            <p className="text-white/40 text-xs mt-1">By {r.reporter.fullName}</p>
            {r.comment && (
              <p className="text-white/60 text-xs mt-2 line-clamp-3">{r.comment.content}</p>
            )}
            <button
              onClick={() => claim("COMMENT_REPORT", r.id)}
              className="mt-3 text-xs font-bold text-[#5227FF]"
            >
              Claim / in progress
            </button>
          </div>
        ))}
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-bold text-white/80">Pending gig applications ({apps.length})</h2>
        {apps.map((a) => (
          <div
            key={a.id}
            className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4 text-sm"
          >
            <p className="text-white font-medium">{a.gig.title}</p>
            <p className="text-white/50 text-xs mt-1">
              {a.applicantName || a.user.fullName} · {a.user.email}
            </p>
            {a.message && <p className="text-white/40 text-xs mt-2">{a.message}</p>}
            <button
              onClick={() => claim("GIG_APPLICATION", a.id)}
              className="mt-3 text-xs font-bold text-[#5227FF]"
            >
              Claim / in progress
            </button>
          </div>
        ))}
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-bold text-white/80">Tickets ({tickets.length})</h2>
        {tickets.map((t) => (
          <div
            key={t.id}
            className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4 flex flex-wrap items-center gap-3"
          >
            <span className="text-[10px] font-mono text-white/40">{t.resourceType}</span>
            <span className="text-xs text-white/60">{t.status}</span>
            {t.assignee && <span className="text-xs text-white/40">@{t.assignee.fullName}</span>}
            <select
              value={t.status}
              onChange={(e) => updateTicket(t.id, { status: e.target.value })}
              className="rounded-lg border border-white/10 bg-white/[0.05] px-2 py-1 text-xs text-white ml-auto"
            >
              <option value="OPEN">OPEN</option>
              <option value="IN_PROGRESS">IN_PROGRESS</option>
              <option value="RESOLVED">RESOLVED</option>
            </select>
          </div>
        ))}
      </section>
    </div>
  );
}
