"use client";

import React, { useEffect, useState } from "react";
import { Header } from "../components/Header";
import { Hero } from "../components/Hero";
import { VideoReel } from "../components/VideoReel";
import { AboutOCC } from "../components/AboutOCC";
import { Approach } from "../components/Approach";
import { FeaturedWork } from "../components/FeaturedWork";
import { Experiences } from "../components/Experiences";
import { ShowcaseCards } from "../components/ShowcaseCards";
import { LayoutEditorProvider, MovableSection } from "../components/LayoutEditor";

export default function HomePage({ userId }: { userId?: string }) {
  const [theme, setTheme] = useState<"dark" | "light">("dark");

  useEffect(() => {
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReducedMotion) return;

    let mounted = true;
    let rafId = 0;
    let cleanup: (() => void) | null = null;

    void (async () => {
      const { default: Lenis } = await import("@studio-freight/lenis");
      if (!mounted) return;

      const lenis = new Lenis({
        duration: 1.2,
        easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
        smoothWheel: true,
        wheelMultiplier: 1.0,
        touchMultiplier: 1.5,
        infinite: false,
      });

      const raf = (time: number) => {
        lenis.raf(time);
        rafId = window.requestAnimationFrame(raf);
      };
      rafId = window.requestAnimationFrame(raf);

      cleanup = () => {
        window.cancelAnimationFrame(rafId);
        lenis.destroy();
      };
    })();

    return () => {
      mounted = false;
      if (cleanup) cleanup();
      if (rafId) window.cancelAnimationFrame(rafId);
    };
  }, []);

  return (
    <LayoutEditorProvider>
      <div
        className={`font-general-sans w-full min-h-screen max-w-[100vw] overflow-x-hidden selection:text-white ${
          theme === "dark"
            ? "bg-[#070914] text-[#F5F1EB] selection:bg-[#F5F1EB]"
            : "bg-[#F6F7FA] text-slate-900 selection:bg-slate-900"
        }`}
      >
        <MovableSection id="header">
          <Header theme={theme} onToggleTheme={() => setTheme((t) => (t === "dark" ? "light" : "dark"))} />
        </MovableSection>
        <main>
          <MovableSection id="hero">
            <Hero />
          </MovableSection>
          <MovableSection id="video-reel">
            <VideoReel theme={theme} />
          </MovableSection>
          <MovableSection id="about-occ">
            <AboutOCC theme={theme} />
          </MovableSection>
          <MovableSection id="approach">
            <Approach theme={theme} />
          </MovableSection>
          <MovableSection id="featured-work">
            <FeaturedWork theme={theme} userId={userId} />
          </MovableSection>
          <MovableSection id="experiences">
            <Experiences theme={theme} />
          </MovableSection>
          <MovableSection id="showcase-cards">
            <ShowcaseCards />
          </MovableSection>
        </main>
      </div>
    </LayoutEditorProvider>
  );
}
