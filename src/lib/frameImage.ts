/**
 * Configure an Image for canvas drawImage().
 * We OMIT 'crossOrigin' by default to maximize compatibility with CDNs that lack
 * properly configured CORS headers (like Access-Control-Allow-Origin).
 * 
 * Browser Behavior:
 * - NO crossOrigin: image loads from ANY origin; canvas becomes 'tainted'.
 * - drawImage() works fine on tainted canvases.
 * - getImageData() / toDataURL() would fail (but we don't use them).
 */
export function setFrameImageSrc(img: HTMLImageElement, src: string) {
  // If we ever need pixel access (e.g. for color picking), re-enable crossOrigin:
  // if (/^https?:\/\//i.test(src)) { img.crossOrigin = "anonymous"; }
  
  img.removeAttribute("crossorigin");
  img.src = src;
}

/** Sticky scroll-cinema: progress 0→1 as the tall section moves through the viewport. */
export function stickySectionScrollProgress(el: HTMLElement): number {
  const h = el.offsetHeight;
  if (h <= 0) return 0;
  const range = Math.max(1, h - window.innerHeight);
  const rect = el.getBoundingClientRect();
  const t = -rect.top / range;
  if (!Number.isFinite(t)) return 0;
  return Math.max(0, Math.min(1, t));
}
