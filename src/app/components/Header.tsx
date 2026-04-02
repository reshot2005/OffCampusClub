import React from "react";
import { Activity } from "lucide-react";
import { motion } from "motion/react";
import { useNavigate } from "@/lib/router-compat";
import { MovableBlock } from "./LayoutEditor";
import { navigateForAuth } from "@/lib/client-auth-redirect";
import { scrollToOccClubsSection } from "@/lib/landingNav";

export function Header() {
  const navigate = useNavigate();

  return (
    <motion.header
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 py-6 md:px-12 pointer-events-none"
    >
      <MovableBlock
        id="header-logo"
        className="pointer-events-auto select-none text-2xl font-medium tracking-widest text-white drop-shadow-sm"
      >
        OCC
      </MovableBlock>

      <div className="flex items-center gap-3 pointer-events-auto">
        <MovableBlock id="header-activity-btn">
          <button
            type="button"
            className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-200/50 backdrop-blur-md transition-colors hover:bg-slate-200"
          >
            <Activity size={18} className="text-slate-800" />
          </button>
        </MovableBlock>
        <MovableBlock id="header-join-club-btn">
          <button
            type="button"
            onClick={() =>
              navigateForAuth(navigate, "/dashboard/explore", "/login")
            }
            className="flex items-center justify-center rounded-full bg-slate-800 px-5 py-2.5 text-xs font-semibold tracking-wider text-white backdrop-blur-md transition-colors hover:bg-slate-900"
          >
            JOIN A CLUB{" "}
            <span className="ml-2 inline-block h-1 w-1 rounded-full bg-white/70" />
          </button>
        </MovableBlock>
        <MovableBlock id="header-clubs-btn">
          <button
            type="button"
            onClick={() => scrollToOccClubsSection()}
            className="flex items-center justify-center rounded-full bg-slate-200/50 px-5 py-2.5 text-xs font-semibold tracking-wider text-slate-900 backdrop-blur-md transition-colors hover:bg-slate-200"
          >
            CLUBS{" "}
            <span className="ml-2 flex gap-[2px]">
              <span className="h-1 w-1 rounded-full bg-slate-900/70" />
              <span className="h-1 w-1 rounded-full bg-slate-900/70" />
            </span>
          </button>
        </MovableBlock>
      </div>
    </motion.header>
  );
}
