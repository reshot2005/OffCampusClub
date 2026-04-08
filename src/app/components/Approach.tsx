"use client";

import React, { useId, useLayoutEffect, useRef, useState } from "react";
import { motion, useScroll, useTransform } from "motion/react";
import { MovableBlock } from "./LayoutEditor";

const TUBE_PATH = "M 0 0 C 400 0 700 300 700 800";

/** Scroll-driven tube — draws as the section scrolls (same motion as Approach). */
export function ScrollTube({
  containerRef,
  mirror,
}: {
  containerRef: React.RefObject<HTMLElement | null>;
  /** Place ribbon on the right (e.g. Experiences) with the same path, flipped. */
  mirror?: boolean;
}) {
  const pathRef = useRef<SVGPathElement>(null);
  const filterId = useId().replace(/:/g, "");
  const [pathLen, setPathLen] = useState(2200);
  /** `slice` crops the sides on tall narrow viewports and cuts off the ribbon cap; `meet` keeps the full path visible. */
  const [narrowViewport, setNarrowViewport] = useState(false);

  useLayoutEffect(() => {
    const el = pathRef.current;
    if (!el) return;
    const L = el.getTotalLength();
    if (L > 0) setPathLen(L);
  }, []);

  useLayoutEffect(() => {
    const mq = window.matchMedia("(max-width: 767px)");
    const sync = () => setNarrowViewport(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "end start"],
  });

  const dashOffset = useTransform(scrollYProgress, [0, 0.6], [pathLen, 0]);

  return (
    <svg
      viewBox="0 0 1100 1000"
      overflow="visible"
      className={
        mirror
          ? "absolute -right-[8%] -top-[18%] h-[125%] w-[85%] min-w-[280px] scale-x-[-1] text-indigo-600"
          : "absolute -left-[8%] -top-[18%] h-[125%] w-[85%] min-w-[280px] text-indigo-600"
      }
      preserveAspectRatio={narrowViewport ? "xMidYMid meet" : "xMidYMid slice"}
      aria-hidden
    >
      <defs>
        {/* Blur-only glow: merging blurred + sharp in one filter causes a visible seam
            at round stroke caps on mobile (DPR / subpixel). Crisp stroke is drawn separately. */}
        <filter id={filterId} x="-40%" y="-40%" width="180%" height="180%">
          <feGaussianBlur stdDeviation="6" />
        </filter>
      </defs>
      {/* Soft underlay — same dash as main stroke; animation unchanged */}
      <motion.path
        d={TUBE_PATH}
        fill="none"
        stroke="currentColor"
        strokeWidth={86}
        strokeOpacity={0.38}
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeDasharray={pathLen}
        style={{ strokeDashoffset: dashOffset, filter: `url(#${filterId})` }}
        shapeRendering="geometricPrecision"
      />
      <motion.path
        ref={pathRef}
        d={TUBE_PATH}
        fill="none"
        stroke="currentColor"
        strokeWidth={72}
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeDasharray={pathLen}
        style={{ strokeDashoffset: dashOffset }}
        shapeRendering="geometricPrecision"
      />
    </svg>
  );
}

export function Approach({ theme }: { theme: "dark" | "light" }) {
  const sectionRef = useRef<HTMLElement>(null);
  const isDark = theme === "dark";

  return (
    <section
      ref={sectionRef}
      className={`relative isolate w-full max-w-[100vw] overflow-visible px-4 py-24 sm:px-6 md:px-12 md:py-32 ${
        isDark ? "bg-[#070914]" : "bg-[#F6F7FA]"
      }`}
    >
      <MovableBlock
        id="approach-purple-tube"
        className="pointer-events-none absolute inset-0 z-[1] overflow-visible"
      >
        <ScrollTube containerRef={sectionRef} />
      </MovableBlock>

      <div className="relative z-20 mx-auto mt-8 grid w-full max-w-[90rem] grid-cols-1 gap-12 md:mt-12 md:grid-cols-2 md:gap-24 lg:gap-32">
        <MovableBlock id="approach-heading">
          <div>
            <h2
              className={`whitespace-pre-line text-[2.75rem] font-medium leading-[0.98] tracking-tighter sm:text-[4rem] md:text-[5rem] lg:text-[6rem] xl:text-[6.5rem] ${
                isDark ? "text-white" : "text-slate-900"
              }`}
            >
              {"Clubs beyond\n the lecture hall"}
            </h2>
          </div>
        </MovableBlock>

        <div className="relative z-30 flex min-w-0 flex-col justify-end gap-10 pt-6 md:gap-12 md:pt-16 lg:pt-32">
          <MovableBlock id="approach-how-works-cta">
            <div>
              <button
                type="button"
                className={`flex items-center gap-3 rounded-full px-6 py-3 text-sm font-bold tracking-widest shadow-lg transition-all hover:scale-105 ${
                  isDark
                    ? "bg-white/10 text-white shadow-black/40 hover:bg-white/15"
                    : "bg-white text-slate-900 shadow-slate-200/50 hover:bg-slate-50"
                }`}
              >
                <span className={`h-2 w-2 rounded-full ${isDark ? "bg-white" : "bg-slate-900"}`} />
                HOW OCC WORKS
              </button>
            </div>
          </MovableBlock>
        </div>
      </div>

      <div className="relative z-10 mx-auto mt-10 flex w-full max-w-[90rem] justify-end md:mt-16 md:-translate-y-12 lg:mt-20 lg:-translate-y-16 xl:-translate-y-20">
        <MovableBlock id="approach-image-card" className="w-full shrink-0 md:w-[60%]">
          <div className="aspect-[4/3] w-full overflow-hidden rounded-[2rem] shadow-2xl shadow-blue-900/10">
            <img
              src="/Trivia.png"
              alt="Trivia Game Night — The Bike Lounge"
              className="h-full w-full object-cover"
            />
          </div>
        </MovableBlock>
      </div>

      <MovableBlock id="approach-tagline">
        <div
          className={`relative z-20 mx-auto mt-20 w-full max-w-[90rem] text-center md:mt-32 ${
            isDark
              ? "rounded-[1.75rem] bg-[#070914]/72 px-4 py-6 backdrop-blur-[2px] ring-1 ring-white/10 md:px-8 md:py-8"
              : ""
          }`}
        >
          <p className="text-sm font-bold uppercase tracking-[0.25em] text-indigo-600 md:text-base">
            Built for the ones who show up
          </p>
          <h3
            className={`mx-auto mt-4 max-w-[52rem] text-[1.75rem] font-medium leading-[1.15] tracking-tight sm:text-[2.5rem] md:text-[3.25rem] lg:text-[4rem] ${
              isDark
                ? "text-white drop-shadow-[0_3px_14px_rgba(0,0,0,0.6)]"
                : "text-slate-900"
            }`}
          >
            Where your campus ends, your community begins
          </h3>
          <p
            className={`mx-auto mt-6 max-w-[40rem] text-base leading-relaxed md:text-lg ${
              isDark ? "text-white/60" : "text-slate-500"
            }`}
          >
            Whether you're looking to have fun, learn something new, or earn on
            the side — OCC gives you a platform to do it all, in a way that
            feels natural, exciting, and truly yours.
          </p>
        </div>
      </MovableBlock>
    </section>
  );
}
