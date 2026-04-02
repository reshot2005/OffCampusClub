import { setFrameImageSrc } from "./frameImage";

function normalizeBase(basePath: string) {
  const b = basePath.trim();
  if (!b) return "/";
  return b.endsWith("/") ? b : `${b}/`;
}

/**
 * Loads numbered frames (0001.jpg …) for scroll-cinema. Handles cached images.
 * Falls back to .webp for the same stem if .jpg fails (optional asset format).
 */
export async function loadFrameSequence(
  basePath: string,
  totalFrames: number,
  onProgress: (p: number) => void,
): Promise<HTMLImageElement[]> {
  const base = normalizeBase(basePath);
  const imgs: HTMLImageElement[] = new Array(totalFrames);
  let completed = 0;

  const bump = () => {
    completed++;
    onProgress(completed / totalFrames);
  };

  const loadIndex = (index: number) =>
    new Promise<void>((resolve) => {
      const padded = String(index + 1).padStart(4, "0");
      let settled = false;

      const finish = (ok: boolean, el: HTMLImageElement | null) => {
        if (settled) return;
        settled = true;
        if (ok && el) imgs[index] = el;
        bump();
        resolve();
      };

      const tryExt = (ext: ".jpg" | ".webp") => {
        const img = new Image();
        const src = `${base}${padded}${ext}`;
        img.onload = () => finish(true, img);
        img.onerror = () => {
          if (ext === ".jpg") tryExt(".webp");
          else finish(false, null);
        };
        setFrameImageSrc(img, src);
        if (img.complete && img.naturalWidth > 0) {
          finish(true, img);
        }
      };

      tryExt(".jpg");
    });

  const BATCH = 40;
  for (let start = 0; start < totalFrames; start += BATCH) {
    const end = Math.min(start + BATCH, totalFrames);
    const batch: Promise<void>[] = [];
    for (let i = start; i < end; i++) batch.push(loadIndex(i));
    await Promise.all(batch);
  }

  return imgs;
}
