/** Static club art shipped with the app (always available on Vercel). */
export const OCC_PREMIUM_CLUB_IMAGES = {
  bikers: "/premium-assets/club_bikers_premium_169_1775157327855.png",
  music: "/premium-assets/club_music_premium_169_1775157345029.png",
  football: "/premium-assets/club_football_premium_169_1775157363794.png",
  photography: "/premium-assets/club_photography_premium_169_1775157399055.png",
} as const;

export function premiumClubImageForName(name: string): string {
  if (name.includes("Biker")) return OCC_PREMIUM_CLUB_IMAGES.bikers;
  if (name.includes("Music")) return OCC_PREMIUM_CLUB_IMAGES.music;
  if (name.includes("Football")) return OCC_PREMIUM_CLUB_IMAGES.football;
  if (name.includes("Photography")) return OCC_PREMIUM_CLUB_IMAGES.photography;
  return OCC_PREMIUM_CLUB_IMAGES.bikers;
}

function getUploadsCdnBase(): string | null {
  const b =
    process.env.NEXT_PUBLIC_UPLOADS_CDN_BASE?.trim() ||
    process.env.NEXT_PUBLIC_R2_UPLOADS_BASE?.trim();
  if (!b) return null;
  return b.replace(/\/$/, "");
}

/** If DB has `/uploads/...` and files are mirrored on R2 at the same path under the public bucket. */
function absoluteUrlForUploadPath(path: string): string | null {
  const base = getUploadsCdnBase();
  if (!base || !path.startsWith("/uploads/")) return null;
  return `${base}${path}`;
}

/**
 * Resolves post image URLs for the feed.
 * - Full `https://` URLs (Blob, R2, etc.) pass through.
 * - `/uploads/...` becomes `{NEXT_PUBLIC_UPLOADS_CDN_BASE}/uploads/...` when that env is set (Cloudflare R2 mirror).
 * - `http://localhost.../uploads/...` is rewritten the same way when env is set.
 * - Otherwise falls back to club premium art (no disk on Vercel for local `/uploads/`).
 */
export function resolvePostImageUrlForFeed(
  imageUrl: string | null | undefined,
  clubName: string,
): string {
  const fallback = premiumClubImageForName(clubName);
  const raw = imageUrl?.trim();
  if (!raw || raw === "/" || raw.length < 5) return fallback;

  if (raw.startsWith("/uploads/")) {
    const abs = absoluteUrlForUploadPath(raw);
    return abs ?? fallback;
  }

  if (/localhost|127\.0\.0\.1/i.test(raw)) {
    try {
      const u = new URL(raw);
      if (u.pathname.startsWith("/uploads/")) {
        const abs = absoluteUrlForUploadPath(u.pathname);
        if (abs) return abs;
      }
    } catch {
      /* ignore */
    }
    return fallback;
  }

  return raw;
}
