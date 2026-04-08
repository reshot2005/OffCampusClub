"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Clock, Plus, Trash2 } from "lucide-react";

type Item = {
  id: string;
  title: string;
  body: string;
  startsAt: string;
  endsAt: string;
  active: boolean;
};

export function ScheduledAnnouncementsClient() {
  const [items, setItems] = useState<Item[]>([]);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [startsAt, setStartsAt] = useState("");
  const [endsAt, setEndsAt] = useState("");

  const load = () => {
    fetch("/api/admin-cp/scheduled-announcements")
      .then((r) => r.json())
      .then((d) => setItems(d.items || []))
      .catch(() => {});
  };

  useEffect(() => {
    load();
  }, []);

  const add = async () => {
    if (!body || !startsAt || !endsAt) {
      toast.error("Fill body and dates");
      return;
    }
    const res = await fetch("/api/admin-cp/scheduled-announcements", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, body, startsAt, endsAt }),
    });
    if (!res.ok) {
      toast.error("Failed");
      return;
    }
    toast.success("Scheduled");
    setTitle("");
    setBody("");
    setStartsAt("");
    setEndsAt("");
    load();
  };

  const del = async (id: string) => {
    if (!confirm("Delete?")) return;
    await fetch(`/api/admin-cp/scheduled-announcements/${id}`, { method: "DELETE" });
    load();
  };

  return (
    <div className="space-y-8 max-w-2xl">
      <div>
        <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#5227FF]">Content</p>
        <h1 className="mt-1 text-2xl font-bold text-white flex items-center gap-3">
          <Clock className="h-6 w-6 text-[#5227FF]" /> Scheduled banners
        </h1>
        <p className="text-sm text-white/40 mt-1">Stored for admin reference; public display wiring is separate.</p>
      </div>

      <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5 space-y-3">
        <h3 className="text-sm font-semibold text-white flex items-center gap-2">
          <Plus className="h-4 w-4" /> New window
        </h3>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Label (optional)"
          className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-white"
        />
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Banner body"
          rows={3}
          className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-white"
        />
        <div className="grid sm:grid-cols-2 gap-2">
          <input
            type="datetime-local"
            value={startsAt}
            onChange={(e) => setStartsAt(e.target.value)}
            className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-white"
          />
          <input
            type="datetime-local"
            value={endsAt}
            onChange={(e) => setEndsAt(e.target.value)}
            className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-white"
          />
        </div>
        <button onClick={add} className="rounded-xl bg-[#5227FF] px-4 py-2 text-sm font-bold text-white">
          Add schedule
        </button>
      </div>

      <div className="space-y-2">
        {items.map((it) => (
          <div
            key={it.id}
            className="flex items-start justify-between gap-3 rounded-xl border border-white/[0.06] bg-white/[0.02] p-4"
          >
            <div>
              <p className="font-medium text-white">{it.title || "Untitled"}</p>
              <p className="text-xs text-white/50 mt-1">{it.body.slice(0, 120)}</p>
              <p className="text-[10px] text-white/30 mt-2 font-mono">
                {it.startsAt} → {it.endsAt}
              </p>
            </div>
            <button onClick={() => del(it.id)} className="p-2 text-red-400 hover:bg-red-500/10 rounded-lg">
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
