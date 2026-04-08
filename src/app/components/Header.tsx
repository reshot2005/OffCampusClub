"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Activity, Moon, Sun } from "lucide-react";
import { motion } from "motion/react";
import { MovableBlock } from "./LayoutEditor";
import {
  authEntryHref,
  LANDING_POST_AUTH_PATH,
  storeRedirectIntent,
} from "@/lib/client-auth-redirect";
import { scrollToOccClubsSection } from "@/lib/landingNav";

const JOIN_HREF = authEntryHref(LANDING_POST_AUTH_PATH, "/login");

/** Viewport Y (px) from top — sample row behind header for dark vs light sections */
const HEADER_PROBE_Y = 36;

function useHeaderOverDarkSection() {
  const [overDark, setOverDark] = useState(true);

  useEffect(() => {
    const tick = () => {
      const hero = document.getElementById("landing-hero");
      const showcase = document.getElementById("landing-showcase");
      const inBand = (el: HTMLElement | null) => {
        if (!el) return false;
        const r = el.getBoundingClientRect();
        return HEADER_PROBE_Y >= r.top && HEADER_PROBE_Y <= r.bottom;
      };
      setOverDark(inBand(hero) || inBand(showcase));
    };

    tick();
    window.addEventListener("scroll", tick, { passive: true });
    window.addEventListener("resize", tick);
    return () => {
      window.removeEventListener("scroll", tick);
      window.removeEventListener("resize", tick);
    };
  }, []);

  return overDark;
}

export function Header({
  theme,
  onToggleTheme,
}: {
  theme: "dark" | "light";
  onToggleTheme: () => void;
}) {
  const overDarkBySection = useHeaderOverDarkSection();
  const overDark = theme === "dark" ? true : overDarkBySection;

  const logoClass = overDark
    ? "text-white drop-shadow-[0_1px_3px_rgba(0,0,0,0.45)]"
    : "!text-slate-900 drop-shadow-none";

  const activityBtnClass = overDark
    ? "bg-white/15 text-white backdrop-blur-md transition-colors hover:bg-white/25"
    : "bg-slate-200/50 text-slate-800 backdrop-blur-md transition-colors hover:bg-slate-200";

  const activityIconClass = overDark ? "text-white" : "text-slate-800";

  const joinLinkClass = overDark
    ? "bg-slate-900/90 px-4 py-2 text-[10px] font-bold tracking-wider !text-white backdrop-blur-md ring-1 ring-white/15 hover:bg-slate-900"
    : "bg-slate-900 px-4 py-2 text-[10px] font-bold tracking-wider !text-white backdrop-blur-md hover:bg-slate-800";

  const joinClubLinkClass = overDark
    ? "bg-slate-900/90 px-5 py-2.5 text-xs font-semibold tracking-wider !text-white backdrop-blur-md ring-1 ring-white/15 transition-colors hover:bg-slate-900 hover:ring-white/25"
    : "bg-slate-900 px-5 py-2.5 text-xs font-semibold tracking-wider !text-white backdrop-blur-md transition-colors hover:bg-slate-800";

  const joinDotClass = overDark ? "bg-white/80" : "bg-white/90";

  const goToWhatIsOcc = () => {
    const target = document.getElementById("what-is-occ");
    target?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <motion.header
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-4 py-4 xs:px-6 xs:py-6 md:px-12 pointer-events-none"
    >
      <MovableBlock
        id="header-logo"
        className={`pointer-events-auto flex items-center select-none transition-opacity duration-300 hover:opacity-80 ${logoClass}`}
      >
        <button
          type="button"
          onClick={goToWhatIsOcc}
          className="inline-flex items-center"
          aria-label="Go to What is OCC section"
        >
          <img
            src="/favicon.png"
            alt="OCC"
            className="h-[48px] w-auto sm:h-[52px]"
          />
        </button>
      </MovableBlock>

      <div className="flex items-center gap-2 sm:gap-3 pointer-events-auto">
        <MovableBlock id="header-activity-btn" className="hidden xs:flex">
          <button type="button" className={`flex h-9 w-9 items-center justify-center rounded-full ${activityBtnClass}`}>
            <Activity size={16} className={activityIconClass} />
          </button>
        </MovableBlock>

        <MovableBlock id="header-theme-toggle" className="flex">
          <button
            type="button"
            onClick={onToggleTheme}
            className={`flex items-center justify-center gap-1.5 rounded-full ${joinClubLinkClass} text-[10px] font-bold sm:text-xs`}
            aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} theme`}
          >
            {theme === "dark" ? <Moon size={12} /> : <Sun size={12} />}
            {theme === "dark" ? "DARK" : "LIGHT"}
          </button>
        </MovableBlock>

        <MovableBlock id="header-mobile-join-btn" className="flex sm:hidden">
          <Link
            href={JOIN_HREF}
            prefetch
            onClick={() => storeRedirectIntent(LANDING_POST_AUTH_PATH)}
            className={`flex items-center justify-center rounded-full ${joinLinkClass}`}
          >
            JOIN
          </Link>
        </MovableBlock>

        <MovableBlock id="header-join-club-btn" className="hidden sm:flex">
          <Link
            href={JOIN_HREF}
            prefetch
            onClick={() => storeRedirectIntent(LANDING_POST_AUTH_PATH)}
            className={`flex items-center justify-center rounded-full ${joinClubLinkClass}`}
          >
            JOIN A CLUB{" "}
            <span className={`ml-2 inline-block h-1 w-1 rounded-full ${joinDotClass}`} />
          </Link>
        </MovableBlock>
        <MovableBlock id="header-clubs-btn" className="hidden sm:flex">
          <button
            type="button"
            onClick={() => scrollToOccClubsSection()}
            className={`flex items-center justify-center rounded-full ${joinClubLinkClass}`}
          >
            CLUBS{" "}
            <span className="ml-2 flex gap-[2px]">
              <span className={`h-1 w-1 rounded-full ${joinDotClass}`} />
              <span className={`h-1 w-1 rounded-full ${joinDotClass}`} />
            </span>
          </button>
        </MovableBlock>
      </div>
    </motion.header>
  );
}
