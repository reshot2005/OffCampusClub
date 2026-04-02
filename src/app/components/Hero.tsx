import React from "react";
import { motion } from "motion/react";
import { MovableBlock } from "./LayoutEditor";
import LiquidEther from "./LiquidEther";
import { scrollToOccClubsSection } from "@/lib/landingNav";

const HERO_VIDEO_SRC =
  "https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260217_030345_246c0224-10a4-422c-b324-070b7c0eceda.mp4";

/** Framed hero card — add `public/videos/occ-hero-card.mp4` to the repo (same-origin, reliable playback). */
const HERO_CARD_VIDEO_SRC = "/videos/occ-hero-card.mp4";

export function Hero() {
  return (
    <>
      {/* Fullscreen campus-night video + dim — fixed until covered by sections below */}
      <div className="pointer-events-none fixed inset-0 z-0" aria-hidden>
        <video
          className="h-full w-full object-cover"
          src={HERO_VIDEO_SRC}
          autoPlay
          muted
          loop
          playsInline
          preload="metadata"
        />
        <div className="absolute inset-0 bg-black/50" />
      </div>

      <section
        id="landing-hero"
        className="relative z-10 flex min-h-0 w-full flex-col overflow-hidden bg-transparent pt-24 md:pt-28"
        style={{
          minHeight: "100dvh",
          height: "100dvh",
          maxHeight: "100dvh",
          isolation: "isolate",
          contain: "layout paint",
        }}
      >
        <div
          className="pointer-events-none absolute inset-0 z-[1] min-h-full w-full transform-gpu"
          aria-hidden
        >
          <LiquidEther
            className="!absolute inset-0 min-h-full w-full"
            style={{
              width: "100%",
              height: "100%",
              minHeight: "100%",
              position: "absolute",
              inset: 0,
            }}
            colors={["#5227ff", "#6d9dca", "#8ebbd2"]}
            mouseForce={72}
            cursorSize={96}
            isViscous
            viscous={78}
            iterationsViscous={12}
            iterationsPoisson={22}
            resolution={0.42}
            isBounce={false}
            BFECC={false}
            dt={0.016}
            maxPixelRatio={1.25}
            antialias={false}
            autoDemo
            autoSpeed={0.48}
            autoIntensity={2.1}
            takeoverDuration={0.28}
            autoResumeDelay={3000}
            autoRampDuration={0.65}
          />
        </div>

        <div className="relative z-10 flex min-h-0 flex-1 flex-col items-center justify-center gap-5 py-2">
          <MovableBlock
            id="hero-title"
            className="mx-auto w-full max-w-[42rem] shrink-0"
          >
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
              className="text-center"
            >
              <h1 className="font-homoarak text-[1.65rem] leading-[1.12] sm:text-[2rem] md:text-[2.75rem] md:leading-[1.1] lg:text-[3.2rem] font-normal text-white tracking-tight drop-shadow-sm">
                Your crew lives off campus
              </h1>
            </motion.div>
          </MovableBlock>

          <MovableBlock
            id="hero-visual"
            className="flex w-full shrink-0 flex-col items-center px-0"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 1, delay: 0.4, ease: [0.16, 1, 0.3, 1] }}
              className="relative aspect-video w-full max-w-[min(100%,17rem)] overflow-hidden rounded-[2rem] bg-black/20 shadow-2xl shadow-black/40 ring-1 ring-white/10 backdrop-blur-[2px] transform-gpu sm:max-w-[22rem] md:max-w-xl lg:max-w-2xl xl:max-w-2xl"
            >
              <video
                className="pointer-events-none absolute inset-0 h-full w-full object-cover"
                src={HERO_CARD_VIDEO_SRC}
                autoPlay
                muted
                loop
                playsInline
                preload="auto"
                aria-label="OCC hero preview video"
              />
            </motion.div>
          </MovableBlock>
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 1 }}
          className="relative z-10 mt-2 flex w-full shrink-0 items-center justify-between text-xs font-semibold tracking-widest text-white/70 uppercase sm:mt-3 sm:text-sm"
        >
          <MovableBlock
            id="hero-footer-decor-left"
            className="flex flex-1 items-center justify-start gap-6 sm:gap-10"
          >
            <span>+</span>
            <span>+</span>
          </MovableBlock>
          <MovableBlock id="hero-footer-cta" className="shrink-0 px-2">
            <span
              className="cursor-pointer transition-colors hover:text-white"
              onClick={() => scrollToOccClubsSection()}
            >
              Find your club below
            </span>
          </MovableBlock>
          <MovableBlock
            id="hero-footer-decor-right"
            className="flex flex-1 items-center justify-end gap-6 sm:gap-10"
          >
            <span>+</span>
            <span>+</span>
          </MovableBlock>
        </motion.div>
      </section>
    </>
  );
}
