import { Suspense } from "react";
import GigsSkeleton from "@/components/skeletons/GigsSkeleton";
import { EClubsGigsSection } from "./EClubsGigsSection";

/** Shell streams immediately; gigs grid hydrates after server data + client chunk. */
export default function EClubsPage() {
  return (
    <Suspense fallback={<GigsSkeleton />}>
      <EClubsGigsSection />
    </Suspense>
  );
}
