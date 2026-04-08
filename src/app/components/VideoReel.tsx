"use client";

import React, { useEffect, useState } from "react";
import { Play } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { MovableBlock } from "./LayoutEditor";
import { OCC_SKIP_UNIVERSE_OVERLAY_KEY } from "@/lib/landingNav";

export function VideoReel({ theme }: { theme: "dark" | "light" }) {
  const [popped, setPopped] = useState(false);
  const isDark = theme === "dark";

  useEffect(() => {
    try {
      if (sessionStorage.getItem(OCC_SKIP_UNIVERSE_OVERLAY_KEY) === "1") {
        sessionStorage.removeItem(OCC_SKIP_UNIVERSE_OVERLAY_KEY);
        setPopped(false);
      }
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    const onPageShow = (e: PageTransitionEvent) => {
      if (e.persisted) setPopped(false);
    };
    window.addEventListener("pageshow", onPageShow);
    return () => window.removeEventListener("pageshow", onPageShow);
  }, []);

  const handleClick = () => {
    setPopped(true);
  };

  return (
    <section
      className={`relative w-full max-w-[100vw] overflow-x-hidden px-4 py-10 sm:px-6 md:px-12 md:py-12 ${
        isDark ? "bg-[#070914]" : "bg-[#F6F7FA]"
      }`}
    >
      <div
        className={`mx-auto flex w-full max-w-[90rem] items-center justify-between pb-10 font-bold md:pb-12 ${
          isDark ? "text-white/40" : "text-slate-500"
        }`}
      >
        {[0, 1, 2, 3, 4].map((i) => (
          <MovableBlock key={`video-reel-top-plus-${i}`} id={`video-reel-decor-top-${i}`}>
            <span></span>
          </MovableBlock>
        ))}
      </div>

      <MovableBlock id="video-reel-main" className="mx-auto w-full max-w-[90rem]">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="group relative aspect-[16/9] w-full cursor-pointer overflow-hidden rounded-[2rem] md:aspect-[21/9]"
          onClick={handleClick}
        >
          <img
            src="/image.png"
            alt="Campus Reel Girl Selfie — Off Campus Clubs"
            className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
          />

          <div className="absolute inset-0 flex items-center justify-center bg-black/20 transition-colors group-hover:bg-black/10">
            <motion.div
              whileHover={{ scale: 1.05 }}
              className="flex items-center gap-3 sm:gap-6 md:gap-8"
            >
              <MovableBlock id="video-reel-text-campus">
                <span className="text-3xl font-medium tracking-tight text-white sm:text-5xl md:text-7xl lg:text-9xl drop-shadow-lg">
                  CAMPUS
                </span>
              </MovableBlock>
              <MovableBlock id="video-reel-play-control">
                <div
                  className={`flex h-12 w-16 items-center justify-center rounded-full shadow-2xl transition-colors sm:h-16 sm:w-24 md:h-20 md:w-32 lg:h-24 lg:w-40 ${
                    isDark ? "bg-white/95 group-hover:bg-white" : "bg-white group-hover:bg-indigo-50"
                  }`}
                >
                  <Play className="ml-1 h-5 w-5 fill-current text-[#1a1c1e] sm:h-7 sm:w-7 md:h-10 md:w-10" />
                </div>
              </MovableBlock>
              <MovableBlock id="video-reel-text-reel">
                <span className="text-3xl font-medium tracking-tight text-white sm:text-5xl md:text-7xl lg:text-9xl drop-shadow-lg">
                  REEL
                </span>
              </MovableBlock>
            </motion.div>
          </div>
        </motion.div>
      </MovableBlock>

      <div
        className={`mx-auto flex w-full max-w-[90rem] items-center justify-between pt-10 font-bold md:pt-12 ${
          isDark ? "text-white/40" : "text-slate-500"
        }`}
      >
        {[0, 1, 2, 3, 4].map((i) => (
          <MovableBlock key={`video-reel-bottom-plus-${i}`} id={`video-reel-decor-bottom-${i}`}>
            <span></span>
          </MovableBlock>
        ))}
      </div>

      {/* ── Popup overlay ── */}
      <AnimatePresence>
        {popped && (
          <motion.div
            className="fixed inset-0 z-[9999] flex items-center justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            {/* backdrop */}
            <motion.div
              className="absolute inset-0 bg-black/80 backdrop-blur-lg"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
            />

            {/* popup card */}
            <motion.div
              className="relative z-10 w-[90vw] max-w-3xl overflow-hidden rounded-3xl border border-white/10 bg-slate-900 shadow-2xl shadow-indigo-500/20"
              initial={{ opacity: 0, scale: 0.8, y: 60 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{
                duration: 0.5,
                ease: [0.16, 1, 0.3, 1],
                delay: 0.1,
              }}
              onAnimationComplete={() => {
                // redirect after animation completes
                setTimeout(() => {
                  window.location.href = "/orbit";
                }, 600);
              }}
            >
              {/* card image */}
              <div className="aspect-[21/9] w-full overflow-hidden">
                <motion.img
                  src="/image.png"
                  alt="OCC Orbit Experience"
                  className="h-full w-full object-cover"
                  initial={{ scale: 1.1 }}
                  animate={{ scale: 1 }}
                  transition={{ duration: 0.8, ease: "easeOut" }}
                />
              </div>

              {/* card body */}
              <motion.div
                className="p-8 text-center"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.35 }}
              >
                <span className="mb-3 inline-block rounded-full border border-indigo-400/30 bg-indigo-500/10 px-4 py-1 text-[9px] font-black uppercase tracking-[0.3em] text-indigo-300">
                  Interactive Experience
                </span>
                <h3 className="mt-3 text-3xl font-black tracking-tight text-white md:text-4xl">
                  The OCC Universe
                </h3>
                <p className="mt-2 text-sm text-white/40">
                  Entering the orbit…
                </p>

                {/* loading shimmer */}
                <div className="mx-auto mt-6 h-1 w-48 overflow-hidden rounded-full bg-white/10">
                  <motion.div
                    className="h-full rounded-full bg-gradient-to-r from-[#5227FF] to-[#8C6DFD]"
                    initial={{ width: "0%" }}
                    animate={{ width: "100%" }}
                    transition={{ duration: 0.9, delay: 0.4, ease: "easeInOut" }}
                  />
                </div>
              </motion.div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
