import { useState, useEffect, useCallback } from "react";
import { loadFrameSequence } from "../lib/loadFrameSequence";

export interface PhotographyFramesResult {
  frames: HTMLImageElement[];
  loaded: boolean;
  progress: number;
}

export function usePhotographyFrames(
  basePath: string,
  totalFrames: number,
): PhotographyFramesResult {
  const [frames, setFrames] = useState<HTMLImageElement[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [progress, setProgress] = useState(0);

  const load = useCallback(async () => {
    setProgress(0);
    const imgs = await loadFrameSequence(basePath, totalFrames, setProgress);
    setFrames(imgs);
    setLoaded(true);
  }, [basePath, totalFrames]);

  useEffect(() => {
    load();
  }, [load]);

  return { frames, loaded, progress };
}
