import { NextRequest, NextResponse } from "next/server";
import { requireAdminPermission } from "@/lib/admin-api-guard";
import { prisma } from "@/lib/prisma";
import { generateReferralCode } from "@/lib/referral";
import { pusherServer } from "@/lib/pusher";
import { checkAdminMutationRateLimit } from "@/lib/admin-rate-limit";

export async function PATCH(_req: NextRequest, { params }: { params: { id: string } }) {
  const admin = await requireAdminPermission("approvals", "approve");
  if (admin instanceof NextResponse) return admin;
  const rl = checkAdminMutationRateLimit({ req: _req, adminId: admin.id, action: "approve-header", limit: 20 });
  if (!rl.ok) {
    return NextResponse.json(
      { error: "Too many requests. Please retry shortly." },
      { status: 429, headers: { "Retry-After": String(rl.retryAfterSec) } },
    );
  }

  const target = await prisma.user.findUnique({
    where: { id: params.id },
    select: {
      id: true,
      fullName: true,
      role: true,
      approvalStatus: true,
      pendingLeadClubId: true,
    },
  });
  if (!target) return NextResponse.json({ error: "User not found" }, { status: 404 });
  if (target.role !== "CLUB_HEADER" || target.approvalStatus !== "PENDING") {
    return NextResponse.json({ error: "Not a pending club header application" }, { status: 400 });
  }

  const club =
    (target.pendingLeadClubId
      ? await prisma.club.findUnique({ where: { id: target.pendingLeadClubId } })
      : null) ??
    (await prisma.club.findFirst({ where: { headerId: target.id } }));

  if (!club) {
    return NextResponse.json(
      { error: "Could not resolve which club this application is for." },
      { status: 400 }
    );
  }

  let code = generateReferralCode(club.name || "CLB", target.fullName);
  for (let i = 0; i < 8; i++) {
    const exists = await prisma.user.findUnique({ where: { referralCode: code } });
    if (!exists) break;
    code = generateReferralCode(club.name || "CLB", target.fullName);
  }

  await prisma.$transaction(async (tx) => {
    if (club.headerId && club.headerId !== target.id) {
      await tx.user.update({
        where: { id: club.headerId },
        data: { role: "STUDENT", referralCode: null },
      });
    }

    await tx.club.update({
      where: { id: club.id },
      data: { headerId: target.id },
    });

    await tx.user.update({
      where: { id: target.id },
      data: {
        approvalStatus: "APPROVED",
        referralCode: code,
        pendingLeadClubId: null,
        /** Keeps `clubManagedId` in sync with `Club.headerId` for APIs that read this field. */
        clubManagedId: club.id,
      },
    });
  });

  await prisma.notification.create({
    data: {
      userId: target.id,
      type: "approval",
      title: "Application approved",
      message: `You are approved. Your referral code is ${code}`,
      data: { referralCode: code },
    },
  });

  try {
    await pusherServer.trigger(`user-${target.id}`, "approved", {
      referralCode: code,
      message: "Your application is approved.",
    });
  } catch (pusherErr) {
    console.warn("[admin/approve] Pusher notification failed (non-critical):", pusherErr);
  }

  return NextResponse.json({ success: true, referralCode: code });
}
