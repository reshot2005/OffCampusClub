import { NextRequest, NextResponse } from "next/server";
import { requireAdminPermission } from "@/lib/admin-api-guard";
import { prisma } from "@/lib/prisma";
import { pusherServer } from "@/lib/pusher";

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const admin = await requireAdminPermission("approvals", "reject");
  if (admin instanceof NextResponse) return admin;

  const body = await req.json().catch(() => ({}));
  const reason = typeof body.reason === "string" && body.reason ? body.reason : "Application not selected.";

  const target = await prisma.user.findUnique({ where: { id: params.id } });
  if (!target) return NextResponse.json({ error: "User not found" }, { status: 404 });
  if (target.role !== "CLUB_HEADER" || target.approvalStatus !== "PENDING") {
    return NextResponse.json({ error: "Not a pending club header application" }, { status: 400 });
  }

  await prisma.$transaction([
    prisma.club.updateMany({
      where: { headerId: target.id },
      data: { headerId: null },
    }),
    prisma.user.update({
      where: { id: target.id },
      data: {
        approvalStatus: "REJECTED",
        role: "STUDENT",
        referralCode: null,
        clubManagedId: null,
        pendingLeadClubId: null,
      },
    }),
  ]);

  await prisma.notification.create({
    data: {
      userId: target.id,
      type: "rejection",
      title: "Application rejected",
      message: reason,
    },
  });

  try {
    await pusherServer.trigger(`user-${target.id}`, "rejected", { reason });
  } catch (pusherErr) {
    console.warn("[admin/reject] Pusher notification failed (non-critical):", pusherErr);
  }
  return NextResponse.json({ success: true });
}
