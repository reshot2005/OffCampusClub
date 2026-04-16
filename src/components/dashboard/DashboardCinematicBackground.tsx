"use client";

import LiquidEther from "@/app/components/LiquidEther";
import { useReducedMotion } from "motion/react";

export function DashboardCinematicBackground() {
  const reduceMotion = useReducedMotion();

  return (
    <div className="pointer-events-none fixed inset-0 z-0" aria-hidden>
      <LiquidEther
        className="!absolute inset-0 min-h-full w-full"
        colors={["#C9A962", "#6d9dca", "#8ebbd2"]}
        mouseForce={reduceMotion ? 0 : 60}
        cursorSize={reduceMotion ? 0 : 50}
        isViscous
        viscous={83}
        iterationsViscous={14}
        iterationsPoisson={28}
        resolution={0.5}
        isBounce={false}
        autoDemo={!reduceMotion}
        autoSpeed={0.42}
        autoIntensity={2.0}
        takeoverDuration={0.25}
        autoResumeDelay={3000}
        autoRampDuration={0.6}
      />
      <div className="absolute inset-0 bg-black/60" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(201,169,98,0.16),transparent_55%)]" />
    </div>
  );
}

