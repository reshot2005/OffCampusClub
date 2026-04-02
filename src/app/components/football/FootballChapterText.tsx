import React from "react";
import { Link } from "@/lib/router-compat";
import type { FootballChapter } from "./footballConstants";

function getOpacity(p: number, from: number, peak: number, to: number) {
  if (p < from || p > to) return 0;
  if (p < peak) return (p - from) / (peak - from);
  return 1 - (p - peak) / (to - peak);
}

const POS_CLASSES: Record<FootballChapter["position"], string> = {
  "bottom-left":
    "absolute bottom-20 left-6 max-w-[min(100vw-3rem,30rem)] md:left-12 md:bottom-28",
  "top-right":
    "absolute top-20 right-6 max-w-[min(100vw-3rem,30rem)] text-right md:right-12 md:top-28",
  "center-left":
    "absolute top-1/2 left-6 -translate-y-1/2 max-w-[min(100vw-3rem,26rem)] md:left-12",
  "bottom-right":
    "absolute bottom-20 right-6 max-w-[min(100vw-3rem,30rem)] text-right md:right-12 md:bottom-28",
  center:
    "absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[min(100vw-3rem,52rem)] text-center",
};

interface Props {
  chapter: FootballChapter;
  scrollProgress: number;
}

export function FootballChapterText({ chapter: ch, scrollProgress }: Props) {
  const opacity = getOpacity(scrollProgress, ch.from, ch.peak, ch.to);
  if (opacity < 0.005) return null;

  const translateY = (1 - opacity) * 28;
  const isGoal = ch.id === "goal";

  return (
    <div
      className={`pointer-events-none z-20 ${POS_CLASSES[ch.position]}`}
      style={{ opacity, transform: `translateY(${translateY}px)` }}
    >
      <p
        className="mb-3 text-[10px] tracking-[0.45em] uppercase"
        style={{ color: "#00FF87", fontFamily: "'Oswald', sans-serif" }}
      >
        {ch.label}
      </p>

      {isGoal ? (
        <h2
          className="font-headline leading-none"
          style={{
            fontSize: ch.headlineSize ?? "clamp(100px, 18vw, 260px)",
            color: ch.accentColor ?? "#00FF87",
            letterSpacing: "0.08em",
            textShadow: "0 0 60px rgba(0,255,135,0.6), 0 0 120px rgba(0,255,135,0.3)",
            transform: `scale(${0.4 + opacity * 0.6})`,
          }}
        >
          {ch.headline[0]}
        </h2>
      ) : (
        <h2 className="font-headline text-4xl leading-[1.0] font-light sm:text-5xl md:text-6xl">
          {ch.headline.map((word, i) => (
            <span key={i} style={{ color: ch.accentIndices.includes(i) ? (ch.accentColor ?? "#00FF87") : "#FFFFFF" }}>
              {word}{i < ch.headline.length - 1 ? " " : ""}
            </span>
          ))}
        </h2>
      )}

      {ch.sub ? (
        <p
          className="mt-4 text-sm leading-relaxed tracking-wide md:text-base"
          style={{ color: "#666666" }}
        >
          {ch.sub}
        </p>
      ) : null}

      {ch.stat ? (
        <div className="mt-6 flex items-baseline gap-3">
          <span className="font-headline text-4xl" style={{ color: "#00FF87" }}>
            {ch.stat.number}
          </span>
          <span className="text-[10px] tracking-[0.35em] uppercase" style={{ color: "#666666" }}>
            {ch.stat.label}
          </span>
        </div>
      ) : null}

      {ch.hasCTA ? (
        <div className="pointer-events-auto mt-10 flex justify-center">
          <Link
            to="/"
            className="border px-10 py-4 text-xs tracking-[0.4em] uppercase transition-all duration-300 hover:scale-[1.02]"
            style={{ borderColor: "#00FF87", color: "#00FF87" }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "#00FF87";
              e.currentTarget.style.color = "#060606";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "transparent";
              e.currentTarget.style.color = "#00FF87";
            }}
          >
            {ch.ctaText ?? "Join the Club"}
          </Link>
        </div>
      ) : null}
    </div>
  );
}
