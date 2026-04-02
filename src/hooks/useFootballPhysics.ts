import { useEffect, useRef, useState } from "react";
import { stickySectionScrollProgress } from "../lib/frameImage";

// ─── One-way damped chase — lerp cannot overshoot, no spring bounce ─────────
const EASE = 0.06; // smooth ~1s coast toward scroll target
const SLACK = 2;   // max frames ahead/behind target (tight leash)

// Antigravity: driven only by how fast the scroll *target* moves (no wheel impulse)
const SCROLL_VEL_GAIN = 55;   // scale per-RAF target delta → feel
const VEL_DECAY = 0.88;       // decay scroll velocity when target stops moving
const MAX_NORM = 1;

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}
function clamp(v: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, v));
}

export interface FootballPlayhead {
  currentFrame: number;
  playheadProgress: number;
  floatY: number;
  tiltDeg: number;
  scaleVal: number;
  zoomVal: number;
  speedIntensity: number;
}

export type FootballPhysics = FootballPlayhead;

export function useFootballPhysics(
  containerRef: React.RefObject<HTMLElement | null>,
  totalFrames: number,
): FootballPlayhead {
  const physicsFrame = useRef(0);
  const prevTarget = useRef(0);
  const scrollVel = useRef(0);
  const ag = useRef({
    floatY: 0,
    tiltDeg: 0,
    scaleVal: 1,
    zoomVal: 1,
    speedIntensity: 0,
  });

  const [state, setState] = useState<FootballPlayhead>({
    currentFrame: 0,
    playheadProgress: 0,
    floatY: 0,
    tiltDeg: 0,
    scaleVal: 1,
    zoomVal: 1,
    speedIntensity: 0,
  });

  useEffect(() => {
    let raf = 0;
    const loop = () => {
      const el = containerRef.current;
      if (el) {
        const rawProgress = stickySectionScrollProgress(el);
        const targetFrame = rawProgress * (totalFrames - 1);

        // How fast user is moving the scroll anchor this frame (native scroll only)
        const deltaTarget = targetFrame - prevTarget.current;

        // Damped chase toward target — mathematically cannot oscillate past target
        let pf =
          physicsFrame.current + (targetFrame - physicsFrame.current) * EASE;

        if (targetFrame > prevTarget.current) {
          pf = Math.min(pf, targetFrame + SLACK);
        } else if (targetFrame < prevTarget.current) {
          pf = Math.max(pf, targetFrame - SLACK);
        }

        pf = clamp(pf, 0, totalFrames - 1);
        physicsFrame.current = pf;
        prevTarget.current = targetFrame;

        // Scroll-derived “velocity” for FX — decays when scroll stops (no spring fight)
        scrollVel.current += deltaTarget * SCROLL_VEL_GAIN;
        scrollVel.current *= VEL_DECAY;
        if (Math.abs(scrollVel.current) < 0.001) scrollVel.current = 0;

        const nv = clamp(scrollVel.current / 4, -MAX_NORM, MAX_NORM);
        const absNv = Math.abs(nv);

        ag.current.floatY = lerp(
          ag.current.floatY,
          clamp(-nv * 45, -45, 20),
          0.06,
        );
        ag.current.tiltDeg = lerp(
          ag.current.tiltDeg,
          clamp(-nv * 3, -3, 3),
          0.06,
        );
        ag.current.scaleVal = lerp(ag.current.scaleVal, 1 + absNv * 0.02, 0.06);
        ag.current.zoomVal = lerp(ag.current.zoomVal, 1 + absNv * 0.03, 0.05);
        ag.current.speedIntensity = lerp(
          ag.current.speedIntensity,
          Math.min(absNv * 1.5, 1),
          0.08,
        );

        setState({
          currentFrame: physicsFrame.current,
          playheadProgress: physicsFrame.current / Math.max(1, totalFrames - 1),
          floatY: ag.current.floatY,
          tiltDeg: ag.current.tiltDeg,
          scaleVal: ag.current.scaleVal,
          zoomVal: ag.current.zoomVal,
          speedIntensity: ag.current.speedIntensity,
        });
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [containerRef, totalFrames]);

  return state;
}
