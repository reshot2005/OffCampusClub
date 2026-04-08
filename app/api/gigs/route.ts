import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { gigApplicationSchema } from "@/lib/validations";
import { broadcastEClubs, invalidateGigsListCache } from "@/lib/gigs-realtime";
import { notifyAllAdmins } from "@/lib/notify-admins";
import { gigWhereNotLegacyDummy } from "@/lib/legacyDummyGigs";
import { serverCache } from "@/lib/server-cache";
import { isPusherServerConfigured, pusherServer } from "@/lib/pusher";

export async function GET() {
  const gigs = await serverCache.getOrSet("gigs:list:v2-no-legacy-seed", 15_000, () =>
    prisma.gig.findMany({
      where: { ...gigWhereNotLegacyDummy },
      orderBy: { createdAt: "desc" },
      include: {
        club: { select: { id: true, name: true, slug: true, icon: true } },
        postedBy: { select: { id: true, fullName: true, avatar: true } },
      },
    }),
  );

  return NextResponse.json(
    { gigs },
    {
      headers: {
        "Cache-Control": "public, s-maxage=15, stale-while-revalidate=30",
      },
    },
  );
}

export async function POST(req: NextRequest) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const parsed = gigApplicationSchema.parse(body);
  const { gigId } = parsed;

  const gig = await prisma.gig.findUnique({
    where: { id: gigId },
    include: {
      club: { include: { header: { select: { id: true } } } },
      postedBy: { select: { id: true } },
    },
  });
  if (!gig) {
    return NextResponse.json({ error: "Gig not found" }, { status: 404 });
  }

  const existing = await prisma.gigApplication.findUnique({
    where: {
      userId_gigId: { userId: user.id, gigId },
    },
  });
  if (existing?.status === "APPROVED") {
    return NextResponse.json(
      { error: "You are already approved for this gig" },
      { status: 400 },
    );
  }

  const msg = parsed.message?.trim() || null;
  const workDescription = parsed.workDescription?.trim() || null;
  const submissionFileUrl = parsed.submissionFileUrl?.trim() || null;
  const submissionFileName = parsed.submissionFileName?.trim() || null;
  const submissionFileMime = parsed.submissionFileMime?.trim() || null;
  const submissionFileSize = parsed.submissionFileSize ?? null;
  const applicantName = parsed.applicantName?.trim() || user.fullName;
  const applicantPhone = parsed.applicantPhone?.trim() || user.phoneNumber;
  const applicantEmail = parsed.applicantEmail?.trim() || user.email;

  const application = await prisma.gigApplication.upsert({
    where: {
      userId_gigId: {
        userId: user.id,
        gigId,
      },
    },
    update: {
      message: msg,
      workDescription,
      submissionFileUrl,
      submissionFileName,
      submissionFileMime,
      submissionFileSize,
      status: "PENDING",
      applicantName,
      applicantPhone,
      applicantEmail,
    },
    create: {
      userId: user.id,
      gigId,
      message: msg,
      workDescription,
      submissionFileUrl,
      submissionFileName,
      submissionFileMime,
      submissionFileSize,
      status: "PENDING",
      applicantName,
      applicantPhone,
      applicantEmail,
    },
  });

  invalidateGigsListCache();
  await broadcastEClubs({
    type: "gig-application",
    gigId,
    applicationId: application.id,
  });

  const headerId = gig.postedById ?? gig.club?.headerId ?? null;
  if (headerId && headerId !== user.id) {
    const pitch = msg ? ` Pitch: “${msg}”` : "";
    const contact = `${applicantName} · ${applicantEmail} · ${applicantPhone}`;
    try {
      await prisma.notification.create({
        data: {
          userId: headerId,
          type: "gig_apply",
          title: "New gig application",
          message: `${contact} applied to “${gig.title}”.${pitch}`,
          data: {
            gigId,
            applicantId: user.id,
            applicationId: application.id,
            applicantName,
            applicantEmail,
            applicantPhone,
          },
        },
      });
      if (isPusherServerConfigured()) {
        await pusherServer.trigger(`user-${headerId}`, "notification", {
          title: "New gig application",
          message: `${applicantName} → ${gig.title}. Open Club Panel → Gigs to review.`,
        });
      }
    } catch (e) {
      console.warn("[gigs/apply] notify header failed:", e);
    }
  }

  try {
    await notifyAllAdmins(
      "gig_apply",
      "Gig application submitted",
      `${applicantName} applied to “${gig.title}”.`,
      { gigId, applicantId: user.id, applicationId: application.id },
    );
  } catch (e) {
    console.warn("[gigs/apply] admin notify failed:", e);
  }

  return NextResponse.json({ success: true, applicationId: application.id });
}
