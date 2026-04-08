import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { gigWhereNotLegacyDummy } from "@/lib/legacyDummyGigs";
import { ClubHeaderGigsClient } from "@/components/club-header/ClubHeaderGigsClient";

export default async function HeaderGigsPage() {
  const user = await requireUser();
  const club = user.clubManaged;
  if (!club) redirect("/header/dashboard");

  const gigs = await prisma.gig.findMany({
    where: { AND: [{ clubId: club.id }, { ...gigWhereNotLegacyDummy }] },
    orderBy: { createdAt: "desc" },
    include: {
      applications: {
        orderBy: { createdAt: "desc" },
        include: {
          user: {
            select: {
              id: true,
              fullName: true,
              email: true,
              phoneNumber: true,
              collegeName: true,
              avatar: true,
            },
          },
        },
      },
    },
  });

  const serialized = gigs.map((g) => ({
    id: g.id,
    title: g.title,
    description: g.description,
    payMin: g.payMin,
    payMax: g.payMax,
    deadline: g.deadline?.toISOString() ?? null,
    createdAt: g.createdAt.toISOString(),
    applications: g.applications.map((a) => ({
      id: a.id,
      status: a.status,
      message: a.message,
      workDescription: a.workDescription,
      submissionFileUrl: a.submissionFileUrl,
      submissionFileName: a.submissionFileName,
      submissionFileMime: a.submissionFileMime,
      submissionFileSize: a.submissionFileSize,
      applicantName: a.applicantName,
      applicantPhone: a.applicantPhone,
      applicantEmail: a.applicantEmail,
      createdAt: a.createdAt.toISOString(),
      user: a.user,
    })),
  }));

  return (
    <div className="space-y-8">
      <div>
        <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-[#8C6DFD]">E-Clubs</p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-white">Gigs &amp; applicants</h1>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-white/45">
          Post paid work for your club community and review applicants in real time. Approvals notify the member and are logged for staff.
        </p>
      </div>
      <ClubHeaderGigsClient initialGigs={serialized} />
    </div>
  );
}
