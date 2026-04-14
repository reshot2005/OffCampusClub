import { setFrameImageSrc } from "./frameImage";

function normalizeBase(basePath: string) {
  const b = basePath.trim();
  if (!b) return "/";
  if (b.startsWith("http")) {
    return b.endsWith("/") ? b : `${b}/`;
  }
  let path = b.startsWith("/") ? b : `/${b}`;
  if (!path.endsWith("/")) path += "/";
  return path;
}

function resolveCdnBase(): string {
  return (
    process.env.NEXT_PUBLIC_FRAMES_CDN_BASE ||
    process.env.VITE_FRAMES_CDN_BASE ||
    ""
  ).replace(/\/$/, "");
}

/** Stable key so ClubOnboardingGate + use*Frames hooks share one load. */
export function frameSequenceLoadKey(
  basePath: string,
  totalFrames: number,
  prefix: string = "",
): string {
  const cdnBase = resolveCdnBase();
  const normalizedBase = normalizeBase(basePath);
  const base = normalizedBase.startsWith("http")
    ? normalizedBase
    : `${cdnBase}${normalizedBase}`;
  return `${base}|${prefix}|${totalFrames}`;
}

const _discoveredPattern: Record<string, string> = {};
const _imageCache: Record<string, HTMLImageElement> = {};
const _completedSequences = new Map<string, HTMLImageElement[]>();
const _inFlightSequences = new Map<string, Promise<HTMLImageElement[]>>();
const _deferredDecodeQueues = new Map<string, HTMLImageElement[]>();
const _deferredDecodeSeen = new Map<string, Set<string>>();
const _deferredDecodeRunning = new Set<string>();
const _deferredDecodeSrcIndex = new Map<string, Map<string, number>>();
const _seqDecodeHintFrame = new Map<string, number>();

/** Latest progress 0–1 for in-flight loads (Strict Mode / deduped callers). */
const _seqProgress = new Map<string, number>();
const _seqListeners = new Map<string, Set<(p: number) => void>>();

function subscribeSeqProgress(
  seqKey: string,
  fn: (p: number) => void,
): () => void {
  let set = _seqListeners.get(seqKey);
  if (!set) {
    set = new Set();
    _seqListeners.set(seqKey, set);
  }
  set.add(fn);
  const cur = _seqProgress.get(seqKey);
  queueMicrotask(() => fn(cur ?? 0));
  return () => {
    set!.delete(fn);
    if (set!.size === 0) _seqListeners.delete(seqKey);
  };
}

function emitSeqProgress(seqKey: string, p: number) {
  _seqProgress.set(seqKey, p);
  _seqListeners.get(seqKey)?.forEach((fn) => {
    fn(p);
  });
}

function adaptiveConcurrency(): number {
  if (typeof navigator === "undefined") return 72;
  const c = (
    navigator as Navigator & {
      connection?: {
        saveData?: boolean;
        effectiveType?: string;
        downlink?: number;
      };
    }
  ).connection;
  if (!c) return 36;
  if (c.saveData) return 12;
  const et = c.effectiveType;
  if (et === "slow-2g" || et === "2g") return 10;
  if (et === "3g") return 20;
  const d = c.downlink;
  if (typeof d === "number" && d >= 20) return 56;
  if (typeof d === "number" && d >= 10) return 44;
  if (typeof d === "number" && d >= 5) return 36;
  return 28;
}

function setFetchPriority(img: HTMLImageElement, index: number) {
  try {
    img.decoding = "async";
    if ("fetchPriority" in img) {
      (img as HTMLImageElement & { fetchPriority?: string }).fetchPriority =
        index < 16 ? "high" : "low";
    }
  } catch {
    /* ignore */
  }
}

function eagerDecodeFrameCount(totalFrames: number): number {
  if (typeof navigator === "undefined") return Math.min(140, totalFrames);
  const mem = (navigator as Navigator & { deviceMemory?: number }).deviceMemory ?? 8;
  const cores = navigator.hardwareConcurrency ?? 8;
  if (mem <= 4 || cores <= 4) return Math.min(72, totalFrames);
  if (mem <= 6 || cores <= 6) return Math.min(96, totalFrames);
  return Math.min(140, totalFrames);
}

function enqueueDeferredDecode(seqKey: string, img: HTMLImageElement) {
  const src = img.currentSrc || img.src;
  if (!src) return;
  let seen = _deferredDecodeSeen.get(seqKey);
  if (!seen) {
    seen = new Set<string>();
    _deferredDecodeSeen.set(seqKey, seen);
  }
  if (seen.has(src)) return;
  seen.add(src);

  const q = _deferredDecodeQueues.get(seqKey) ?? [];
  q.push(img);
  _deferredDecodeQueues.set(seqKey, q);
  scheduleDeferredDecodePump(seqKey);
}

function scoreForHint(index: number, hintFrame: number): number {
  // Prefer immediate-future frames; de-prioritize far-past frames.
  if (index >= hintFrame) return index - hintFrame;
  return (hintFrame - index) * 2 + 8;
}

function pickPriorityBatch(seqKey: string, q: HTMLImageElement[], batchSize: number) {
  if (q.length <= batchSize) return q.splice(0, q.length);
  const hint = _seqDecodeHintFrame.get(seqKey);
  if (hint == null || !Number.isFinite(hint)) return q.splice(0, batchSize);
  const srcIndex = _deferredDecodeSrcIndex.get(seqKey);
  if (!srcIndex) return q.splice(0, batchSize);

  const scored = q
    .map((img, i) => {
      const src = img.currentSrc || img.src;
      const idx = src ? srcIndex.get(src) : undefined;
      return {
        i,
        score: typeof idx === "number" ? scoreForHint(idx, hint) : Number.MAX_SAFE_INTEGER,
      };
    })
    .sort((a, b) => a.score - b.score)
    .slice(0, batchSize)
    .sort((a, b) => b.i - a.i);

  const picked: HTMLImageElement[] = [];
  for (const it of scored) {
    const one = q.splice(it.i, 1)[0];
    if (one) picked.push(one);
  }
  return picked;
}

function scheduleDeferredDecodePump(seqKey: string) {
  if (_deferredDecodeRunning.has(seqKey)) return;
  _deferredDecodeRunning.add(seqKey);

  const runOnce = async () => {
    const q = _deferredDecodeQueues.get(seqKey);
    if (!q || q.length === 0) {
      _deferredDecodeRunning.delete(seqKey);
      _deferredDecodeQueues.delete(seqKey);
      _deferredDecodeSeen.delete(seqKey);
      return;
    }

    // Decode a larger batch each tick to keep up with fast scrolls.
    const batchSize = 6;
    const batch = pickPriorityBatch(seqKey, q, batchSize);
    for (const img of batch) {
      if (!img.complete || !img.naturalWidth) continue;
      try {
        await img.decode();
      } catch {
        // Ignore decode failures; drawImage fallback still works.
      }
    }
    _deferredDecodeQueues.set(seqKey, q);

    const scheduleNext = () => {
      if (typeof window !== "undefined" && "requestIdleCallback" in window) {
        (window as Window & { requestIdleCallback: (cb: () => void) => number })
          .requestIdleCallback(() => {
            void runOnce();
          });
      } else {
        setTimeout(() => {
          void runOnce();
        }, 18);
      }
    };
    scheduleNext();
  };

  if (typeof window !== "undefined" && "requestIdleCallback" in window) {
    (window as Window & { requestIdleCallback: (cb: () => void) => number })
      .requestIdleCallback(() => {
        void runOnce();
      });
  } else {
    setTimeout(() => {
      void runOnce();
    }, 18);
  }
}

export function setFrameSequenceDecodeHint(
  basePath: string,
  totalFrames: number,
  frameIndex: number,
  prefix: string = "",
) {
  const seqKey = frameSequenceLoadKey(basePath, totalFrames, prefix);
  const clamped = Math.max(0, Math.min(totalFrames - 1, Math.round(frameIndex)));
  _seqDecodeHintFrame.set(seqKey, clamped);
}

/**
 * Loads numbered frames for scroll-cinema. Dedupes concurrent callers; all
 * subscribers receive progress (fixes React Strict Mode remounts).
 */
export async function loadFrameSequence(
  basePath: string,
  totalFrames: number,
  onProgress: (p: number) => void,
  prefix: string = "",
): Promise<HTMLImageElement[]> {
  const seqKey = frameSequenceLoadKey(basePath, totalFrames, prefix);

  const cached = _completedSequences.get(seqKey);
  if (cached) {
    queueMicrotask(() => onProgress(1));
    return cached;
  }

  const inflight = _inFlightSequences.get(seqKey);
  if (inflight) {
    const unsub = subscribeSeqProgress(seqKey, onProgress);
    void inflight.finally(() => unsub());
    return inflight;
  }

  const unsub = subscribeSeqProgress(seqKey, onProgress);

  const promise = loadFrameSequenceInternal(basePath, totalFrames, seqKey, prefix)
    .then((imgs) => {
      _completedSequences.set(seqKey, imgs);
      return imgs;
    })
    .finally(() => {
      unsub();
      _inFlightSequences.delete(seqKey);
    });

  _inFlightSequences.set(seqKey, promise);
  return promise;
}

async function loadFrameSequenceInternal(
  basePath: string,
  totalFrames: number,
  seqKey: string,
  prefix: string,
): Promise<HTMLImageElement[]> {
  const cdnBase = resolveCdnBase();
  const normalizedBase = normalizeBase(basePath);
  const base = normalizedBase.startsWith("http")
    ? normalizedBase
    : `${cdnBase}${normalizedBase}`;

  const imgs: HTMLImageElement[] = new Array(totalFrames);
  const eagerDecodeCount = eagerDecodeFrameCount(totalFrames);
  let completed = 0;

  const bump = () => {
    completed++;
    emitSeqProgress(seqKey, completed / totalFrames);
  };

  const cacheKey = `${base}|${prefix}`;
  let pattern = _discoveredPattern[cacheKey];

  if (!pattern) {
    const probeTemplates = [
      ...(prefix ? [`${base}${prefix}{PAD}{EXT}`] : []),
      `${base}{PAD}{EXT}`,
      ...(prefix !== "frame_" ? [`${base}frame_{PAD}{EXT}`] : []),
      `${normalizedBase}{PAD}{EXT}`,
    ];

    const probePad = "0001";
    for (const tmpl of probeTemplates) {
      for (const ext of [".jpg", ".webp"] as const) {
        const url = tmpl.replace("{PAD}", probePad).replace("{EXT}", ext);
        const ok = await probeUrl(url);
        if (ok) {
          pattern = tmpl.replace("{EXT}", ext);
          _discoveredPattern[cacheKey] = pattern;
          break;
        }
      }
      if (pattern) break;
    }
  }

  if (!pattern) {
    for (let i = 0; i < totalFrames; i++) bump();
    return imgs;
  }

  const loadIndex = (index: number) =>
    new Promise<void>((resolve) => {
      const padded = String(index + 1).padStart(4, "0");
      const src = pattern!.replace("{PAD}", padded);
      let srcIndex = _deferredDecodeSrcIndex.get(seqKey);
      if (!srcIndex) {
        srcIndex = new Map<string, number>();
        _deferredDecodeSrcIndex.set(seqKey, srcIndex);
      }
      srcIndex.set(src, index);

      const cachedImg = _imageCache[src];
      if (cachedImg) {
        imgs[index] = cachedImg;
        bump();
        resolve();
        return;
      }

      const img = new Image();
      setFetchPriority(img, index);

      let settled = false;
      const finishOk = async () => {
        if (settled) return;
        settled = true;
        // Decode only the initial critical window. Decoding every single frame
        // up front causes CPU spikes and "stuck %", especially on laptops.
        if (index < eagerDecodeCount) {
          try {
            await img.decode();
          } catch {
            // ignore decode errors
          }
        } else {
          enqueueDeferredDecode(seqKey, img);
        }
        _imageCache[src] = img;
        imgs[index] = img;
        bump();
        resolve();
      };
      const finishErr = () => {
        if (settled) return;
        settled = true;
        bump();
        resolve();
      };

      img.onload = () => {
        void finishOk();
      };
      img.onerror = finishErr;
      setFrameImageSrc(img, src);
      if (img.complete && img.naturalWidth > 0) {
        void finishOk();
      }
    });

  // Prioritize first frames for immediate section entry, then distribute samples
  // across timeline so scrub feels smoother earlier (not only first chunk loaded).
  const order: number[] = [];
  const seen = new Set<number>();
  const pushIfNew = (idx: number) => {
    if (idx < 0 || idx >= totalFrames) return;
    if (seen.has(idx)) return;
    seen.add(idx);
    order.push(idx);
  };
  const FIRST_WINDOW = Math.min(96, totalFrames);
  for (let i = 0; i < FIRST_WINDOW; i++) pushIfNew(i);
  const spreadCount = Math.min(120, totalFrames);
  if (spreadCount > 1) {
    const last = totalFrames - 1;
    for (let i = 0; i < spreadCount; i++) {
      pushIfNew(Math.round((i / (spreadCount - 1)) * last));
    }
  }
  for (let i = 0; i < totalFrames; i++) pushIfNew(i);

  const CONCURRENCY = adaptiveConcurrency();
  const pool = new Set<Promise<void>>();

  for (const i of order) {
    const task = loadIndex(i).then(() => {
      pool.delete(task);
    });
    pool.add(task);
    if (pool.size >= CONCURRENCY) {
      await Promise.race(pool);
    }
  }
  await Promise.all(pool);
  _deferredDecodeSrcIndex.delete(seqKey);
  _seqDecodeHintFrame.delete(seqKey);

  return imgs;
}

function probeUrl(url: string): Promise<boolean> {
  return new Promise((resolve) => {
    const img = new Image();
    setFetchPriority(img, 0);
    const timer = setTimeout(() => {
      img.onload = img.onerror = null;
      resolve(false);
    }, 4000);
    img.onload = () => {
      clearTimeout(timer);
      _imageCache[url] = img;
      resolve(true);
    };
    img.onerror = () => {
      clearTimeout(timer);
      resolve(false);
    };
    setFrameImageSrc(img, url);
    if (img.complete && img.naturalWidth > 0) {
      clearTimeout(timer);
      _imageCache[url] = img;
      resolve(true);
    }
  });
}
