"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { Settings, Save, ToggleLeft, ToggleRight } from "lucide-react";

type PSettings = { siteName: string; announcementBanner: string | null; announcementActive: boolean; maintenanceMode: boolean; registrationOpen: boolean; landingHeroTitle: string | null; landingHeroSubtitle: string | null };

export default function SettingsPage() {
  const [settings, setSettings] = useState<PSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch("/api/admin-cp/settings")
      .then((r) => r.json())
      .then((d) => {
        const s = d.settings;
        setSettings({
          siteName: s.siteName,
          announcementBanner: s.announcementBanner,
          announcementActive: s.announcementActive,
          maintenanceMode: s.maintenanceMode,
          registrationOpen: s.registrationOpen,
          landingHeroTitle: s.landingHeroTitle,
          landingHeroSubtitle: s.landingHeroSubtitle,
        });
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const save = async () => {
    if (!settings) return;
    setSaving(true);
    try {
      const res = await fetch("/api/admin-cp/settings", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(settings) });
      if (res.ok) toast.success("Settings saved"); else toast.error("Failed");
    } catch { toast.error("Error"); } finally { setSaving(false); }
  };

  if (loading || !settings) return <div className="py-20 text-center text-white/20">Loading settings...</div>;

  const Toggle = ({ label, value, onChange, desc }: { label: string; value: boolean; onChange: (v: boolean) => void; desc: string }) => (
    <div className="flex items-center justify-between p-4 rounded-xl border border-white/[0.06] bg-white/[0.02]">
      <div>
        <p className="text-sm font-semibold text-white">{label}</p>
        <p className="text-xs text-white/35 mt-0.5">{desc}</p>
      </div>
      <button onClick={() => onChange(!value)} className="text-[#5227FF]">
        {value ? <ToggleRight className="h-8 w-8" /> : <ToggleLeft className="h-8 w-8 text-white/20" />}
      </button>
    </div>
  );

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#5227FF]">Configuration</p>
        <h1 className="mt-1 text-2xl font-bold text-white flex items-center gap-3">
          <Settings className="h-6 w-6 text-[#5227FF]" /> Platform Settings
        </h1>
      </div>

      <div className="space-y-4">
        <div>
          <label className="text-[10px] font-bold uppercase tracking-widest text-white/40 block mb-1">Site Name</label>
          <input value={settings.siteName} onChange={(e) => setSettings({ ...settings, siteName: e.target.value })}
            className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2.5 text-sm text-white outline-none focus:border-[#5227FF]/50" />
        </div>

        <Toggle label="Maintenance Mode" value={settings.maintenanceMode} onChange={(v) => setSettings({ ...settings, maintenanceMode: v })} desc="Shows maintenance page to all users" />
        <Toggle label="Registration Open" value={settings.registrationOpen} onChange={(v) => setSettings({ ...settings, registrationOpen: v })} desc="Allow new user registrations" />
        <Toggle label="Announcement Active" value={settings.announcementActive} onChange={(v) => setSettings({ ...settings, announcementActive: v })} desc="Show announcement banner across the platform" />

        {settings.announcementActive && (
          <div>
            <label className="text-[10px] font-bold uppercase tracking-widest text-white/40 block mb-1">Announcement Text</label>
            <input value={settings.announcementBanner || ""} onChange={(e) => setSettings({ ...settings, announcementBanner: e.target.value })}
              className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2.5 text-sm text-white outline-none" placeholder="e.g. 🚀 New feature launched!" />
          </div>
        )}

        <div>
          <label className="text-[10px] font-bold uppercase tracking-widest text-white/40 block mb-1">Landing Hero Title</label>
          <input value={settings.landingHeroTitle || ""} onChange={(e) => setSettings({ ...settings, landingHeroTitle: e.target.value })}
            className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2.5 text-sm text-white outline-none" />
        </div>
        <div>
          <label className="text-[10px] font-bold uppercase tracking-widest text-white/40 block mb-1">Landing Hero Subtitle</label>
          <input value={settings.landingHeroSubtitle || ""} onChange={(e) => setSettings({ ...settings, landingHeroSubtitle: e.target.value })}
            className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2.5 text-sm text-white outline-none" />
        </div>
      </div>

      <motion.button whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }} onClick={save} disabled={saving}
        className="flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-[#5227FF] to-[#8C6DFD] font-bold text-white disabled:opacity-50">
        <Save className="h-4 w-4" /> {saving ? "Saving..." : "Save Settings"}
      </motion.button>
    </div>
  );
}
