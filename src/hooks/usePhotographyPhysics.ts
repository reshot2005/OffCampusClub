import { useEffect, useRef, useState } from "react";
import { stickySectionScrollProgress } from "../lib/frameImage";

/** Same LERP playhead as football — no spring, no bounce. */
const EASE = 0.06;
const SLACK = 2;
const SCROLL_VEL_GAIN = 55;
const VEL_DECAY = 0.88;
const MAX_NORM = 1;

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}
function clamp(v: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, v));
}

export interface PhotographyPlayhead {
  currentFrame: number;
  playheadProgress: number;
  floatY: number;
  tiltDeg: number;
  scaleVal: number;
  zoomVal: number;
  speedIntensity: number;
}

export type PhotographyPhysics = PhotographyPlayhead;

export function usePhotographyPhysics(
  containerRef: React.RefObject<HTMLElement | null>,
  totalFrames: number,
): PhotographyPlayhead {
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

  const [state, setState] = useState<PhotographyPlayhead>({
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
        const deltaTarget = targetFrame - prevTarget.current;

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
