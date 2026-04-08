import { NextRequest, NextResponse } from "next/server";
import { referralValidateSchema } from "@/lib/validations";
import {
  normalizeReferralCodeInput,
  resolveClubHeaderByReferralCode,
  suggestSimilarReferralCode,
} from "@/lib/referral-resolve";

export const dynamic = "force-dynamic";

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

    const normalized = normalizeReferralCodeInput(parsed.data.code);
    if (!normalized) {
      return NextResponse.json({ valid: false });
    }

    const resolved = await resolveClubHeaderByReferralCode(normalized);
    if (!resolved) {
      const suggestion = await suggestSimilarReferralCode(normalized);
      return NextResponse.json({
        valid: false,
        ...(suggestion ? { suggestion } : {}),
      });
    }

    const { header, club } = resolved;

    return NextResponse.json({
      valid: true,
      club: { id: club.id, name: club.name, slug: club.slug, icon: club.icon },
      headerName: header.fullName,
    });
  } catch (e) {
    console.error("[referral/validate]", e);
    return NextResponse.json({ valid: false }, { status: 200 });
  }
}
