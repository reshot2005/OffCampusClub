import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { getClubOnboardingConfig } from "@/config/clubOnboardingQuestions";

export async function POST(request: Request) {
  const user = await getSessionUser();

  if (!user) {
    return NextResponse.json({ ok: false }, { status: 200 });
  }

  try {
    const payload = (await request.json()) as {
      clubSlug?: string;
      questionVariant?: number;
      answers?: Partial<Record<"q1" | "q2" | "q3" | "q4" | "q5", string>>;
    };

    if (!payload.clubSlug) {
      return NextResponse.json({ error: "Missing club slug" }, { status: 400 });
    }

    const rawV = Number(payload.questionVariant);
    const questionVariant = Number.isFinite(rawV)
      ? Math.min(2, Math.max(0, Math.floor(rawV)))
      : 0;

    const config = getClubOnboardingConfig(payload.clubSlug, questionVariant);
    const answer1 = payload.answers?.q1?.trim();
    const answer2 = payload.answers?.q2?.trim();
    const answer3 = payload.answers?.q3?.trim();
    const answer4 = payload.answers?.q4?.trim();
    const answer5 = payload.answers?.q5?.trim();

    if (!answer1 || !answer2 || !answer3 || !answer4 || !answer5) {
      return NextResponse.json({ error: "Incomplete answers" }, { status: 400 });
    }

    await (prisma.clubOnboarding as any).upsert({
      where: {
        userId_clubSlug: {
          userId: user.id,
          clubSlug: config.slug,
        },
      },
      create: {
        userId: user.id,
        clubSlug: config.slug,
        questionVariant,
        answer1,
        answer2,
        answer3,
        answer4,
        answer5,
      },
      update: {
        questionVariant,
        answer1,
        answer2,
        answer3,
        answer4,
        answer5,
      },
    });

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Unable to save onboarding" }, { status: 500 });
  }
}
