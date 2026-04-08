/** Anchor id for the landing OCC-Clubs grid (FeaturedWork). */
export const OCC_CLUBS_SECTION_ID = "occ-clubs";

/** sessionStorage: landing VideoReel should not reopen "The OCC Universe" overlay after returning from orbit. */
export const OCC_SKIP_UNIVERSE_OVERLAY_KEY = "occ-skip-universe-overlay";

export function markReturnFromOrbit() {
  try {
    if (typeof sessionStorage !== "undefined") {
      sessionStorage.setItem(OCC_SKIP_UNIVERSE_OVERLAY_KEY, "1");
    }
  } catch {
    /* private / blocked storage */
  }
}

export function scrollToOccClubsSection() {
  if (typeof document === "undefined") return;
  document.getElementById(OCC_CLUBS_SECTION_ID)?.scrollIntoView({
    behavior: "smooth",
    block: "start",
  });
}
