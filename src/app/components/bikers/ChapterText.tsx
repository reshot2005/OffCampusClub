import React from "react";
import { motion } from "motion/react";
import { Link } from "@/lib/router-compat";
import type { ChapterConfig } from "./constants";

function getOpacity(scrollProgress: number, from: number, peak: number, to: number) {
  if (scrollProgress < from || scrollProgress > to) return 0;
  if (scrollProgress < peak) return (scrollProgress - from) / (peak - from);
  return 1 - (scrollProgress - peak) / (to - peak);
}

interface Props {
  chapter: ChapterConfig;
  scrollProgress: number;
}

export function ChapterText({ chapter: ch, scrollProgress }: Props) {
  const opacity = getOpacity(scrollProgress, ch.from, ch.peak, ch.to);
  if (opacity < 0.01) return null;

  const y = (1 - opacity) * 30;

  const posClasses: Record<string, string> = {
    "left-mid":
      "absolute top-1/2 left-6 -translate-y-1/2 max-w-[min(100vw-3rem,28rem)] md:left-12",
    "left-top": "absolute top-[22%] left-6 max-w-[min(100vw-3rem,28rem)] md:left-12",
    split:
      "absolute top-1/2 left-6 -translate-y-1/2 max-w-[min(100vw-3rem,24rem)] md:left-12",
    center:
      "absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[min(100vw-3rem,44rem)] text-center",
    "center-wide":
      "absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[min(100vw-3rem,52rem)] text-center",
  };

  return (
    <motion.div
      className={`pointer-events-none z-20 ${posClasses[ch.position] ?? posClasses.center}`}
      style={{ opacity, y }}
    >
      {ch.chapter ? (
        <p
          className="mb-4 text-[10px] tracking-[0.45em] uppercase md:text-[11px]"
          style={{ color: "#C8A96E" }}
        >
          {ch.chapter}
        </p>
      ) : null}

      <h2 className="font-headline text-4xl leading-[1.05] font-light sm:text-5xl md:text-6xl lg:text-7xl">
        {ch.headline.map((word, i) => (
          <span key={i}>
            {i === ch.headlineAccent ? (
              <em className="font-accent not-italic" style={{ color: "#C8A96E" }}>
                {word}
              </em>
            ) : (
              word
            )}
            {i < ch.headline.length - 1 ? " " : ""}
          </span>
        ))}
      </h2>

      {ch.sub ? (
        <p
          className="mt-4 max-w-sm text-sm leading-relaxed tracking-[0.06em] md:text-base"
          style={{ color: "#9A9080" }}
        >
          {ch.sub}
        </p>
      ) : null}

      {ch.stat ? (
        <div className="mt-8 flex items-baseline gap-3">
          <span className="font-headline text-4xl" style={{ color: "#C8A96E" }}>
            {ch.stat.number}
          </span>
          <span
            className="text-[10px] tracking-[0.35em] uppercase"
            style={{ color: "#9A9080" }}
          >
            {ch.stat.label}
          </span>
        </div>
      ) : null}

      {ch.hasCTA ? (
        <div className="pointer-events-auto mt-10 flex justify-center">
          <Link
            to="/"
            className="border px-10 py-4 text-xs tracking-[0.4em] uppercase transition-all duration-300 hover:scale-[1.02]"
            style={{
              borderColor: "#C8A96E",
              color: "#C8A96E",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = "#C8A96E";
              e.currentTarget.style.color = "#080808";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = "transparent";
              e.currentTarget.style.color = "#C8A96E";
            }}
          >
            Find Your Club
          </Link>
        </div>
      ) : null}
    </motion.div>
  );
}
