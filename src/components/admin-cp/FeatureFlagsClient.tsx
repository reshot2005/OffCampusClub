"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Save, ToggleLeft } from "lucide-react";

export function FeatureFlagsClient() {
  const [flagsJson, setFlagsJson] = useState("{}");
  const [rateJson, setRateJson] = useState("{}");
  const [legalP, setLegalP] = useState("");
  const [legalT, setLegalT] = useState("");
  const [cmsJson, setCmsJson] = useState("{}");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch("/api/admin-cp/feature-flags")
      .then((r) => r.json())
      .then((d) => {
        setFlagsJson(JSON.stringify(d.featureFlags ?? {}, null, 2));
        setRateJson(JSON.stringify(d.rateLimitPolicy ?? {}, null, 2));
        setLegalP(d.legalPrivacyHtml ?? "");
        setLegalT(d.legalTermsHtml ?? "");
        setCmsJson(JSON.stringify(d.landingCmsExtra ?? {}, null, 2));
      })
      .catch(() => toast.error("Failed to load"))
      .finally(() => setLoading(false));
  }, []);

  const save = async () => {
    let featureFlags: object;
    let rateLimitPolicy: object;
    let landingCmsExtra: object;
    try {
      featureFlags = JSON.parse(flagsJson);
      rateLimitPolicy = JSON.parse(rateJson);
      landingCmsExtra = JSON.parse(cmsJson);
    } catch {
      toast.error("Invalid JSON");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/admin-cp/feature-flags", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          featureFlags,
          rateLimitPolicy,
          legalPrivacyHtml: legalP || null,
          legalTermsHtml: legalT || null,
          landingCmsExtra,
        }),
      });
      if (res.ok) toast.success("Saved");
      else toast.error("Failed");
    } catch {
      toast.error("Error");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="py-20 text-center text-white/20">Loading…</div>;

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#5227FF]">Platform</p>
        <h1 className="mt-1 text-2xl font-bold text-white flex items-center gap-3">
          <ToggleLeft className="h-6 w-6 text-[#5227FF]" /> Feature flags & policy
        </h1>
        <p className="text-sm text-white/40 mt-1">
          Stored in database; consumption elsewhere is a separate rollout (admin CP manages values only).
        </p>
      </div>

      <div>
        <label className="text-[10px] font-bold uppercase text-white/40 block mb-1">featureFlags (JSON)</label>
        <textarea
          value={flagsJson}
          onChange={(e) => setFlagsJson(e.target.value)}
          rows={8}
          className="w-full rounded-xl border border-white/10 bg-[#0a0c14] p-3 text-xs font-mono text-white"
        />
      </div>
      <div>
        <label className="text-[10px] font-bold uppercase text-white/40 block mb-1">rateLimitPolicy (JSON)</label>
        <textarea
          value={rateJson}
          onChange={(e) => setRateJson(e.target.value)}
          rows={6}
          className="w-full rounded-xl border border-white/10 bg-[#0a0c14] p-3 text-xs font-mono text-white"
        />
      </div>
      <div>
        <label className="text-[10px] font-bold uppercase text-white/40 block mb-1">Legal — privacy (HTML)</label>
        <textarea
          value={legalP}
          onChange={(e) => setLegalP(e.target.value)}
          rows={4}
          className="w-full rounded-xl border border-white/10 bg-white/[0.03] p-3 text-sm text-white"
        />
      </div>
      <div>
        <label className="text-[10px] font-bold uppercase text-white/40 block mb-1">Legal — terms (HTML)</label>
        <textarea
          value={legalT}
          onChange={(e) => setLegalT(e.target.value)}
          rows={4}
          className="w-full rounded-xl border border-white/10 bg-white/[0.03] p-3 text-sm text-white"
        />
      </div>
      <div>
        <label className="text-[10px] font-bold uppercase text-white/40 block mb-1">landingCmsExtra (JSON)</label>
        <textarea
          value={cmsJson}
          onChange={(e) => setCmsJson(e.target.value)}
          rows={6}
          className="w-full rounded-xl border border-white/10 bg-[#0a0c14] p-3 text-xs font-mono text-white"
        />
      </div>

      <button
        onClick={save}
        disabled={saving}
        className="flex items-center gap-2 rounded-xl bg-[#5227FF] px-6 py-3 font-bold text-white disabled:opacity-50"
      >
        <Save className="h-4 w-4" /> {saving ? "Saving…" : "Save"}
      </button>
    </div>
  );
}
