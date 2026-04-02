/**
 * Optional Cloudflare R2 (or any) public URL for frame JPEGs.
 * Local dev: omit VITE_FRAMES_CDN_BASE → paths stay /bikers-frames/ etc. from Vite.
 * Production: set VITE_FRAMES_CDN_BASE=https://pub-xxxxx.r2.dev (no trailing slash).
 */
export function framesPublicPath(pathFromRoot: string): string {
  // Next.js doesn't provide `import.meta.env` like Vite during SSR/prerender.
  // Prefer Next-exposed env vars, but keep compatibility with Vite-style naming.
  const viteBase = (import.meta as any)?.env?.VITE_FRAMES_CDN_BASE as string | undefined;
  const processBase =
    process.env.NEXT_PUBLIC_FRAMES_CDN_BASE ??
    process.env.VITE_FRAMES_CDN_BASE ??
    undefined;

  const raw = String(processBase ?? viteBase ?? "").trim();
  // Treat "", "undefined", "null" as unset (bad .env copies)
  const base =
    !raw || raw === "undefined" || raw === "null" ? "" : raw.replace(/\/$/, "");
  let path = pathFromRoot.startsWith("/") ? pathFromRoot : `/${pathFromRoot}`;
  if (!path.endsWith("/")) path = `${path}/`;
  if (!base) return path;
  return `${base}${path}`;
}
