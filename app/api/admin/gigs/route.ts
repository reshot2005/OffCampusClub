import { NextResponse } from "next/server";
import { requireAdminPermission } from "@/lib/admin-api-guard";
import { prisma } from "@/lib/prisma";
import { gigWhereNotLegacyDummy } from "@/lib/legacyDummyGigs";

/** Full gig + application pipeline for staff oversight. */
export async function GET() {
  const admin = await requireAdminPermission("gigs", "read");
  if (admin instanceof NextResponse) return admin;

  const gigs = await prisma.gig.findMany({
    where: { ...gigWhereNotLegacyDummy },
    orderBy: { createdAt: "desc" },
    include: {
      club: { select: { id: true, name: true, slug: true } },
      postedBy: { select: { id: true, fullName: true, email: true } },
      applications: {
        include: {
          user: {
            select: {
              id: true,
              fullName: true,
              email: true,
              phoneNumber: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  return NextResponse.json({ gigs });
}
