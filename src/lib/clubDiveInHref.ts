/** Matches "Dive In" targets on club cards: cinematic routes or `/clubs/[slug]`. */
const SLUG_TO_DIVE_IN: Record<string, string> = {
  music: "/music",
  bikers: "/bikers",
  photography: "/photography",
  sports: "/football",
  fitness: "/fitness",
};

export function clubDiveInHref(slug: string | undefined | null): string {
  if (!slug?.trim()) return "/clubs";
  return SLUG_TO_DIVE_IN[slug] ?? `/clubs/${slug}`;
}
