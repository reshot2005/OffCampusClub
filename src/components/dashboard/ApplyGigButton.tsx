"use client";

import { useRouter } from "next/navigation";
import * as React from "react";

export function ApplyGigButton({
  gigId,
  applied,
}: {
  gigId: string;
  applied: boolean;
}) {
  const router = useRouter();
  const [loading, setLoading] = React.useState(false);

  return (
    <button
      type="button"
      disabled={applied || loading}
      className="w-full rounded-2xl bg-[#5227FF] px-6 py-4 text-[12px] font-black uppercase tracking-[0.2em] text-white transition-all hover:bg-[#401ED9] hover:shadow-lg hover:shadow-[#5227FF]/20 active:scale-95 disabled:cursor-not-allowed disabled:opacity-40"
      onClick={async () => {
        if (applied || loading) return;
        setLoading(true);
        try {
          router.push("/football");
          window.setTimeout(() => setLoading(false), 2500);
        } catch {
          setLoading(false);
        }
      }}
    >
      {applied ? "Applied ✓" : loading ? "Opening..." : "Apply Now"}
    </button>
  );
}
