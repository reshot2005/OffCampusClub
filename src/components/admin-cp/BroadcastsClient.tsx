"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Radio, Send } from "lucide-react";

type Row = {
  id: string;
  title: string;
  message: string;
  audienceType: string;
  recipientCount: number | null;
  createdAt: string;
};

export function BroadcastsClient() {
  const [rows, setRows] = useState<Row[]>([]);
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [audience, setAudience] = useState<"all" | "students" | "club_headers" | "club_members">("all");
  const [clubId, setClubId] = useState("");
  const [clubs, setClubs] = useState<{ id: string; name: string }[]>([]);

  const load = () => {
    fetch("/api/admin-cp/broadcasts")
      .then((r) => r.json())
      .then((d) => setRows(d.broadcasts || []))
      .catch(() => {});
    fetch("/api/admin-cp/clubs")
      .then((r) => r.json())
      .then((d) => setClubs((d.clubs || []).map((c: { id: string; name: string }) => ({ id: c.id, name: c.name }))))
      .catch(() => {});
  };

  useEffect(() => {
    load();
  }, []);

  const send = async () => {
    const res = await fetch("/api/admin-cp/broadcasts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title,
        message,
        audienceType: audience,
        clubId: audience === "club_members" ? clubId : undefined,
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      toast.error(data.error || "Failed");
      return;
    }
    toast.success(`Sent to ${data.sent} users`);
    setTitle("");
    setMessage("");
    load();
  };

  return (
    <div className="space-y-8 max-w-2xl">
      <div>
        <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#5227FF]">Engagement</p>
        <h1 className="mt-1 text-2xl font-bold text-white flex items-center gap-3">
          <Radio className="h-6 w-6 text-[#5227FF]" /> In-app broadcasts
        </h1>
        <p className="text-sm text-white/40 mt-1">Creates Notification rows for each targeted user.</p>
      </div>

      <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5 space-y-3">
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Title"
          className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-white"
        />
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Message"
          rows={4}
          className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-white"
        />
        <select
          value={audience}
          onChange={(e) => setAudience(e.target.value as typeof audience)}
          className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-white"
        >
          <option value="all">Everyone</option>
          <option value="students">Students only</option>
          <option value="club_headers">Club headers only</option>
          <option value="club_members">One club&apos;s members</option>
        </select>
        {audience === "club_members" && (
          <select
            value={clubId}
            onChange={(e) => setClubId(e.target.value)}
            className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-white"
          >
            <option value="">Select club</option>
            {clubs.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        )}
        <button
          onClick={send}
          className="flex items-center gap-2 rounded-xl bg-[#5227FF] px-4 py-2 text-sm font-bold text-white"
        >
          <Send className="h-4 w-4" /> Send
        </button>
      </div>

      <div className="space-y-2">
        <h2 className="text-sm font-bold text-white/60">Recent</h2>
        {rows.map((r) => (
          <div key={r.id} className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3 text-sm">
            <p className="font-medium text-white">{r.title}</p>
            <p className="text-xs text-white/40 mt-1">{r.audienceType} · {r.recipientCount ?? "?"} recipients</p>
            <p className="text-[10px] text-white/25 mt-1">{r.createdAt}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
