import { useCallback, useEffect, useState } from "react";
import { loadFrameSequence } from "../lib/loadFrameSequence";

export interface FrameSequenceResult {
  frames: HTMLImageElement[];
  loaded: boolean;
  progress: number;
}

export function useFrameSequence(
  basePath: string,
  totalFrames: number,
): FrameSequenceResult {
  const [frames, setFrames] = useState<HTMLImageElement[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [progress, setProgress] = useState(0);

  const loadFrames = useCallback(async () => {
    setProgress(0);
    const imgs = await loadFrameSequence(basePath, totalFrames, setProgress);
    setFrames(imgs);
    setLoaded(true);
  }, [basePath, totalFrames]);

  useEffect(() => {
    loadFrames();
  }, [loadFrames]);

  return { frames, loaded, progress };
}
