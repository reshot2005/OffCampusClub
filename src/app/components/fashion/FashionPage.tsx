"use client";

import React, { useEffect } from "react";
import { Link } from "@/lib/router-compat";
import { motion, AnimatePresence } from "motion/react";
import { useFashionFrames } from "../../../hooks/useFashionFrames";
import {
  FASHION_TOTAL_FRAMES,
  FASHION_FRAMES_PATH,
  FAC,
} from "./fashionConstants";
import { FashionScrollSection } from "./FashionScrollSection";
import {
  FashionEditorialSection,
  FashionTimelineStrip,
  FashionGigsSection,
  FashionJoinSection,
} from "./FashionPostSections";

function FashionLoadingScreen({
  progress,
  loaded,
}: {
  progress: number;
  loaded: boolean;
}) {
  return (
    <AnimatePresence>
      {!loaded && (
        <motion.div
          className="fixed inset-0 z-[200] flex flex-col items-center justify-center"
          style={{ background: FAC.bg }}
          exit={{ opacity: 0, filter: "blur(12px)" }}
          transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
        >
          <motion.div
            animate={{ rotate: [0, 6, -6, 0] }}
            transition={{ repeat: Infinity, duration: 1.6, ease: "easeInOut" }}
            className="mb-6 font-headline text-4xl tracking-[0.2em] md:text-5xl"
            style={{ color: FAC.accent }}
          >
            ◇
          </motion.div>
          <h1
            className="font-headline mb-8 text-3xl tracking-[0.25em] md:text-4xl"
            style={{ color: FAC.text }}
          >
            LOADING FASHION CLUB
          </h1>
          <div className="w-72">
            <div className="h-px w-full" style={{ background: "#2a2825" }}>
              <div
                className="h-full transition-all duration-75"
                style={{ width: `${progress * 100}%`, background: FAC.accent }}
              />
            </div>
            <p
              className="mt-3 text-center text-xs tracking-[0.3em]"
              style={{ color: FAC.muted }}
            >
              {Math.round(progress * 100)}%
            </p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function FashionCursor() {
  const dotRef = React.useRef<HTMLDivElement>(null);
  const ringRef = React.useRef<HTMLDivElement>(null);
  const mouse = React.useRef({ x: 0, y: 0 });
  const ring = React.useRef({ x: 0, y: 0 });
  const hover = React.useRef(false);

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      mouse.current = { x: e.clientX, y: e.clientY };
    };
    const onOver = (e: MouseEvent) => {
      const t = e.target as HTMLElement;
      hover.current = !!(
        t.closest("a") ||
        t.closest("button") ||
        t.closest("[role=button]")
      );
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseover", onOver);
    let raf = 0;
    const loop = () => {
      ring.current.x += (mouse.current.x - ring.current.x) * 0.12;
      ring.current.y += (mouse.current.y - ring.current.y) * 0.12;
      if (dotRef.current)
        dotRef.current.style.transform = `translate(${mouse.current.x - 6}px, ${mouse.current.y - 6}px)`;
      const rs = hover.current ? 58 : 38;
      if (ringRef.current) {
        ringRef.current.style.transform = `translate(${ring.current.x - rs / 2}px, ${ring.current.y - rs / 2}px)`;
        ringRef.current.style.width = `${rs}px`;
        ringRef.current.style.height = `${rs}px`;
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseover", onOver);
    };
  }, []);

  return (
    <>
      <div
        ref={dotRef}
        className="pointer-events-none fixed top-0 left-0 z-[9999] hidden h-3 w-3 rounded-full mix-blend-difference md:block"
        style={{ background: "#F7F4EF" }}
      />
      <div
        ref={ringRef}
        className="pointer-events-none fixed top-0 left-0 z-[9998] hidden rounded-full border mix-blend-difference transition-[width,height] duration-200 md:block"
        style={{ borderColor: "#C9A962" }}
      />
    </>
  );
}

function FashionGrainOverlay() {
  return (
    <div className="pointer-events-none fixed inset-0 z-[9997] opacity-[0.035]">
      <svg className="h-[200%] w-[200%] animate-grain">
        <filter id="fashion-fg">
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.62"
            numOctaves={3}
            stitchTiles="stitch"
          />
        </filter>
        <rect width="100%" height="100%" filter="url(#fashion-fg)" />
      </svg>
    </div>
  );
}

export function FashionPage() {
  const { frames, loaded, progress } = useFashionFrames(
    FASHION_FRAMES_PATH,
    FASHION_TOTAL_FRAMES,
  );

  return (
    <div className="cursor-none" style={{ background: FAC.bg, color: FAC.text }}>
      <FashionLoadingScreen progress={progress} loaded={loaded} />
      <FashionCursor />
      <FashionGrainOverlay />

      <motion.div
        initial={{ clipPath: "inset(0 0 100% 0)" }}
        animate={loaded ? { clipPath: "inset(0 0 0% 0)" } : { clipPath: "inset(0 0 100% 0)" }}
        transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
        style={{ background: FAC.bg }}
      >
        <header className="pointer-events-none fixed top-0 right-0 left-0 z-[100] flex items-center justify-between px-6 py-6 mix-blend-difference md:px-12">
          <Link
            to="/"
            className="pointer-events-auto text-[10px] tracking-[0.4em] uppercase"
            style={{ color: FAC.text }}
          >
            ← OCC
          </Link>
          <span
            className="font-headline text-lg tracking-[0.15em] md:text-xl"
            style={{ color: FAC.text }}
          >
            OCC
          </span>
          <span className="text-[10px] tracking-[0.3em] uppercase" style={{ color: FAC.muted }}>
            Fashion
          </span>
        </header>

        <FashionScrollSection frames={frames} loaded={loaded} />

        <FashionEditorialSection />
        <FashionTimelineStrip />
        <FashionGigsSection />
        <FashionJoinSection />

        <footer
          className="border-t px-6 py-12 text-center"
          style={{ borderColor: "rgba(255,248,235,0.08)", background: "#0C0C0A" }}
        >
          <p className="font-mono-label text-xs tracking-[0.2em]" style={{ color: "#8A8478" }}>
            OCC Fashion ·{" "}
            <Link
              to="/"
              className="transition-colors hover:underline"
              style={{ color: FAC.accent }}
            >
              Return home
            </Link>
          </p>
        </footer>
      </motion.div>
    </div>
  );
}
