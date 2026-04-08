import React from "react";
import { FloatingConnectorsCard } from "./FloatingConnectorsCard";
import { ChromeKnotCard } from "./ChromeKnotCard";
import { MovableBlock } from "./LayoutEditor";

export function ShowcaseCards() {
  return (
    <section
      id="landing-showcase"
      className="min-h-0 w-full max-w-[100vw] overflow-x-hidden bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 py-16 md:min-h-screen md:py-20"
    >
      <div className="mx-auto max-w-[1400px] px-4 sm:px-6 lg:px-8">
        <div className="relative z-20 mb-12 flex flex-col items-center gap-4 text-center md:mb-16 md:gap-5">
          <MovableBlock id="showcase-heading-title">
            <h2 className="text-3xl font-black text-white drop-shadow-[0_4px_16px_rgba(0,0,0,0.45)] sm:text-4xl md:text-5xl">
              Built for OCC club life
            </h2>
          </MovableBlock>
          <MovableBlock id="showcase-heading-subtitle" className="mx-auto max-w-2xl">
            <p className="text-base text-white/85 drop-shadow-[0_2px_10px_rgba(0,0,0,0.35)] md:text-lg">
              Designed for Off Campus Club moments—events, gigs, creator drops, and late-night
              campus energy that your members actually engage with.
            </p>
          </MovableBlock>
        </div>

        <div className="relative z-20 space-y-10 md:space-y-12">
          <div>
            <div className="mb-4 flex flex-col gap-3 px-1 sm:px-4 md:px-8">
              <MovableBlock id="showcase-float-title">
                <h3 className="text-xl font-bold text-white drop-shadow-[0_3px_14px_rgba(0,0,0,0.4)] md:text-2xl">
                  OCC Sports & Esports momentum
                </h3>
              </MovableBlock>
              <MovableBlock id="showcase-float-body">
                <p className="text-sm text-white/80 md:text-base">
                  Match countdowns, tournament highlights, and team updates in one kinetic feed—
                  so OCC members feel the hype before they even arrive.
                </p>
              </MovableBlock>
            </div>
            <MovableBlock id="showcase-floating-card">
              <FloatingConnectorsCard />
            </MovableBlock>
          </div>

          <div>
            <div className="mb-4 flex flex-col gap-3 px-1 sm:px-4 md:px-8">
              <MovableBlock id="showcase-chrome-title">
                <h3 className="text-xl font-bold text-white drop-shadow-[0_3px_14px_rgba(0,0,0,0.4)] md:text-2xl">
                  Music & night rides — depth and spin
                </h3>
              </MovableBlock>
              <MovableBlock id="showcase-chrome-body">
                <p className="text-sm text-white/80 md:text-base">
                  Chrome form with canyon reflections—use it as a stand-in for open-mic glow and
                  late ride motion; cursor drives rotation and parallax like a headline visual.
                </p>
              </MovableBlock>
            </div>
            <MovableBlock id="showcase-chrome-card">
              <ChromeKnotCard />
            </MovableBlock>
          </div>
        </div>

        <MovableBlock id="showcase-tip" className="mt-12 flex justify-center md:mt-16">
          <div className="inline-block max-w-lg rounded-lg border border-white/10 bg-white/5 px-5 py-3 text-center text-sm text-white/70 backdrop-blur-sm md:px-6">
            <MovableBlock id="showcase-tip-label" className="inline-block align-baseline">
              <span className="font-semibold text-white">On OCC:</span>
            </MovableBlock>{" "}
            <MovableBlock id="showcase-tip-copy" className="inline-block max-w-[min(100%,18rem)] align-baseline text-left sm:max-w-none sm:text-center">
              <span>
                Motion like this is the direction for club pages, gig cards, and event posts—so
                what you scroll matches the energy of real meetups, turf nights, and campus scenes.
              </span>
            </MovableBlock>
          </div>
        </MovableBlock>
      </div>
    </section>
  );
}
