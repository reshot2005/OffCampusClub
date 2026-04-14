"use client";

import { useRouter } from "next/navigation";
import * as React from "react";

export function JoinClubButton({
  slug,
  joined,
}: {
  slug: string;
  joined: boolean;
}) {
  const router = useRouter();
  const [loading, setLoading] = React.useState(false);

  const handleToggleJoin = async () => {
    setLoading(true);
    try {
      const endpoint = joined ? "unjoin" : "join";
      const response = await fetch(`/api/clubs/${slug}/${endpoint}`, { method: "POST" });
      if (response.ok) {
        router.refresh();
      }
    } catch (error) {
      console.error("Failed to toggle club membership:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      type="button"
      disabled={loading}
      onClick={handleToggleJoin}
      className={`group/unjoin relative min-w-[140px] rounded-full px-6 py-2.5 text-[12px] font-bold uppercase tracking-[0.2em] transition shadow-lg ${
        joined
          ? "bg-slate-100 text-slate-500 shadow-none border border-slate-200 hover:bg-black hover:text-white"
          : "bg-[#5227FF] text-white hover:bg-[#431ce3] hover:shadow-[#5227FF]/25 hover:-translate-y-0.5"
      } disabled:opacity-60 disabled:pointer-events-none`}
    >
      {loading ? (
        "..."
      ) : joined ? (
        <>
          <span className="block group-hover/unjoin:hidden">Member ✓</span>
          <span className="hidden group-hover/unjoin:block">Unjoin</span>
        </>
      ) : (
        "Join Club →"
      )}
    </button>
  );
}
