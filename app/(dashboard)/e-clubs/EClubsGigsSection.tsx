import dynamic from "next/dynamic";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { gigWhereNotLegacyDummy } from "@/lib/legacyDummyGigs";

/** Code-split heavy client UI (Framer Motion, modals) from the server data path. */
const EClubsView = dynamic(
  () =>
    import("@/components/occ-dashboard/EClubsView").then((m) => m.EClubsView),
  { ssr: true },
);

export async function EClubsGigsSection() {
  const user = await requireUser();

  const gigs = await prisma.gig.findMany({
    where: { ...gigWhereNotLegacyDummy },
    orderBy: { createdAt: "desc" },
    include: {
      club: { select: { name: true, slug: true, icon: true, coverImage: true } },
      postedBy: { select: { fullName: true } },
      applications: {
        where: { userId: user.id },
        select: { id: true, status: true },
      },
    },
  });

  const canPost =
    user.role === "CLUB_HEADER" &&
    user.approvalStatus === "APPROVED" &&
    !!user.clubManaged;

  return (
    <EClubsView
      gigs={gigs}
      canPost={canPost}
      userId={user.id}
      applicantProfile={{
        fullName: user.fullName,
        email: user.email,
        phoneNumber: user.phoneNumber,
      }}
    />
  );
}
