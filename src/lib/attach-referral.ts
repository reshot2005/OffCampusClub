import { prisma } from "@/lib/prisma";
import { pusherServer } from "@/lib/pusher";

/**
 * Links a student to a club header by referral code (membership + referral_stats + notification + Pusher).
 * Handles club resolution via User.clubManaged OR Club.headerId.
 */
export async function attachStudentToReferralCode(params: {
  studentId: string;
  studentFullName: string;
  studentCollegeName: string;
  codeRaw: string;
}): Promise<{ ok: true } | { ok: false }> {
  const code = params.codeRaw.trim().toUpperCase();
  if (code.length < 3) {
    return { ok: false };
  }

  const headerUser = await prisma.user.findUnique({
    where: { referralCode: code },
    include: { clubManaged: true },
  });

  const managedClub =
    headerUser?.clubManaged ??
    (headerUser
      ? await prisma.club.findFirst({ where: { headerId: headerUser.id } })
      : null);

  if (
    !headerUser ||
    headerUser.role !== "CLUB_HEADER" ||
    headerUser.approvalStatus !== "APPROVED" ||
    !managedClub
  ) {
    return { ok: false };
  }

  try {
    await prisma.user.update({
      where: { id: params.studentId },
      data: { referredBy: headerUser.id },
    });

    await prisma.clubMembership.upsert({
      where: {
        userId_clubId: { userId: params.studentId, clubId: managedClub.id },
      },
      update: {},
      create: { userId: params.studentId, clubId: managedClub.id },
    });

    await prisma.referralStat.create({
      data: {
        clubHeaderId: headerUser.id,
        studentId: params.studentId,
        clubId: managedClub.id,
      },
    });

    await prisma.notification.create({
      data: {
        userId: headerUser.id,
        type: "new-referral",
        title: "New student joined",
        message: `${params.studentFullName} joined using your referral code.`,
        data: { studentId: params.studentId },
      },
    });

    await pusherServer.trigger(`header-${headerUser.id}`, "new-member", {
      member: {
        id: params.studentId,
        fullName: params.studentFullName,
        collegeName: params.studentCollegeName,
        registeredAt: new Date().toISOString(),
      },
    });
  } catch (e) {
    console.warn("[attach-referral] failed:", e);
    return { ok: false };
  }

  return { ok: true };
}
