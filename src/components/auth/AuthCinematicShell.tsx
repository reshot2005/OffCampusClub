/* eslint-disable react/no-unknown-property */
"use client";

import { motion, useReducedMotion } from "motion/react";
import LiquidEther from "@/app/components/LiquidEther";
import { cn } from "@/app/components/ui/utils";

export function AuthCinematicShell({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const reduceMotion = useReducedMotion();

  return (
    <div
      className={cn(
        "relative min-h-screen w-full overflow-hidden bg-[#090908] text-[#F5F0E8]",
        className,
      )}
    >
      {/* 3D cinematic background */}
      <div className="pointer-events-none fixed inset-0 z-0" aria-hidden>
        <LiquidEther
          className="!absolute inset-0 min-h-full w-full"
          colors={["#C9A962", "#6d9dca", "#8ebbd2"]}
          mouseForce={reduceMotion ? 0 : 70}
          cursorSize={reduceMotion ? 0 : 60}
          isViscous
          viscous={83}
          iterationsViscous={14}
          iterationsPoisson={28}
          resolution={0.5}
          isBounce={false}
          autoDemo={!reduceMotion}
          autoSpeed={0.45}
          autoIntensity={2.1}
          takeoverDuration={0.25}
          autoResumeDelay={3000}
          autoRampDuration={0.6}
        />
        <div className="absolute inset-0 bg-black/55" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_10%,rgba(201,169,98,0.18),transparent_55%)]" />
      </div>

      <main className="relative z-10 mx-auto flex min-h-screen w-full max-w-7xl flex-col items-center justify-center px-4 py-12">
        <motion.div
          initial={{ opacity: 0, y: 18, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
          className="w-full"
        >
          <div className="mb-6 flex items-center justify-center">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.7, delay: 0.1 }}
              className="rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-xs font-semibold tracking-[0.35em] text-[#C9A96E] uppercase"
            >
              OCC
            </motion.div>
          </div>

          {children}
        </motion.div>
      </main>
    </div>
  );
}

