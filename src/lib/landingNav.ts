/** Anchor id for the landing OCC-Clubs grid (FeaturedWork). */
export const OCC_CLUBS_SECTION_ID = "occ-clubs";

export function scrollToOccClubsSection() {
  if (typeof document === "undefined") return;
  document.getElementById(OCC_CLUBS_SECTION_ID)?.scrollIntoView({
    behavior: "smooth",
    block: "start",
  });
}
