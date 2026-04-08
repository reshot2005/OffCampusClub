"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { Shield, Plus, Trash2 } from "lucide-react";
import { buildMatrixFromLevel, type AdminLevel } from "@/lib/admin-permissions";

type Tpl = {
  id: string;
  name: string;
  slug: string;
  description: string;
  permissions: Record<string, string[]>;
  userCount: number;
};

export function AdminRolesClient() {
  const [templates, setTemplates] = useState<Tpl[]>([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [permJson, setPermJson] = useState(() =>
    JSON.stringify(buildMatrixFromLevel("MODERATOR" as AdminLevel), null, 2),
  );

  const load = () => {
    setLoading(true);
    fetch("/api/admin-cp/roles")
      .then((r) => r.json())
      .then((d) => {
        setTemplates(d.templates || []);
      })
      .catch(() => toast.error("Failed to load roles"))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  const create = async () => {
    let permissions: Record<string, string[]>;
    try {
      permissions = JSON.parse(permJson);
    } catch {
      toast.error("Invalid JSON permissions");
      return;
    }
    const res = await fetch("/api/admin-cp/roles", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, slug, description: "", permissions }),
    });
    const data = await res.json();
    if (!res.ok) {
      toast.error(data.error || "Failed");
      return;
    }
    toast.success("Role created");
    setName("");
    setSlug("");
    load();
  };

  const remove = async (id: string) => {
    if (!confirm("Delete this role template?")) return;
    const res = await fetch(`/api/admin-cp/roles/${id}`, { method: "DELETE" });
    const data = await res.json();
    if (!res.ok) {
      toast.error(data.error || "Failed");
      return;
    }
    toast.success("Deleted");
    load();
  };

  const useModeratorPreset = () => {
    setPermJson(JSON.stringify(buildMatrixFromLevel("MODERATOR" as AdminLevel), null, 2));
  };

  return (
    <div className="space-y-6">
      <div>
        <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#5227FF]">Governance</p>
        <h1 className="mt-1 text-2xl font-bold text-white flex items-center gap-3">
          <Shield className="h-6 w-6 text-[#5227FF]" /> Admin role templates
        </h1>
        <p className="text-sm text-white/40 mt-1">
          Assign templates to admin users in Users. JSON maps module keys to allowed actions.
        </p>
      </div>

      <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5 space-y-3">
        <h3 className="text-sm font-semibold text-white flex items-center gap-2">
          <Plus className="h-4 w-4" /> New template
        </h3>
        <div className="grid gap-3 sm:grid-cols-2">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Display name"
            className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-white"
          />
          <input
            value={slug}
            onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/\s+/g, "-"))}
            placeholder="slug-kebab-case"
            className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-white font-mono"
          />
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={useModeratorPreset}
            className="text-xs text-[#5227FF] font-bold hover:underline"
          >
            Load moderator preset
          </button>
        </div>
        <textarea
          value={permJson}
          onChange={(e) => setPermJson(e.target.value)}
          rows={12}
          className="w-full rounded-xl border border-white/10 bg-[#0a0c14] px-3 py-2 text-xs text-white font-mono"
        />
        <button
          onClick={create}
          className="rounded-xl bg-[#5227FF] px-4 py-2 text-sm font-bold text-white"
        >
          Create template
        </button>
      </div>

      <div className="space-y-2">
        {loading && <p className="text-white/30 text-sm">Loading…</p>}
        {!loading &&
          templates.map((t, i) => (
            <motion.div
              key={t.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: i * 0.03 }}
              className="flex items-start justify-between gap-4 rounded-xl border border-white/[0.06] bg-white/[0.02] p-4"
            >
              <div>
                <p className="font-semibold text-white">{t.name}</p>
                <p className="text-[10px] font-mono text-white/35">{t.slug}</p>
                <p className="text-xs text-white/40 mt-1">{t.description || "—"}</p>
                <p className="text-[10px] text-white/25 mt-2">{t.userCount} admin(s) assigned</p>
              </div>
              <button
                onClick={() => remove(t.id)}
                className="p-2 rounded-lg text-red-400 hover:bg-red-500/10"
                title="Delete"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </motion.div>
          ))}
      </div>
    </div>
  );
}
