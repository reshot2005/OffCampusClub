import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { referralValidateSchema } from "@/lib/validations";

export async function POST(req: NextRequest) {
  try {
    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ valid: false });
    }

    const parsed = referralValidateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ valid: false });
    }

    const normalized = parsed.data.code.trim().toUpperCase();

    const header = await prisma.user.findUnique({
      where: { referralCode: normalized },
      include: { clubManaged: true },
    });

    const club =
      header?.clubManaged ??
      (header
        ? await prisma.club.findFirst({ where: { headerId: header.id } })
        : null);

    if (
      !header ||
      header.role !== "CLUB_HEADER" ||
      header.approvalStatus !== "APPROVED" ||
      !club
    ) {
      return NextResponse.json({ valid: false });
    }

    return NextResponse.json({
      valid: true,
      club: { id: club.id, name: club.name, slug: club.slug, icon: club.icon },
      headerName: header.fullName,
      headerId: header.id,
    });
  } catch (e) {
    console.error("[referral/validate]", e);
    return NextResponse.json({ valid: false }, { status: 200 });
  }
}
