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
      answers?: Partial<Record<"q1" | "q2" | "q3" | "q4" | "q5", string>>;
    };

    if (!payload.clubSlug) {
      return NextResponse.json({ error: "Missing club slug" }, { status: 400 });
    }

    const config = getClubOnboardingConfig(payload.clubSlug);
    const answer1 = payload.answers?.q1?.trim();
    const answer2 = payload.answers?.q2?.trim();
    const answer3 = payload.answers?.q3?.trim();
    const answer4 = payload.answers?.q4?.trim();
    const answer5 = payload.answers?.q5?.trim();

    if (!answer1 || !answer2 || !answer3 || !answer4 || !answer5) {
      return NextResponse.json({ error: "Incomplete answers" }, { status: 400 });
    }

    await prisma.clubOnboarding.upsert({
      where: {
        userId_clubSlug: {
          userId: user.id,
          clubSlug: config.slug,
        },
      },
      create: {
        userId: user.id,
        clubSlug: config.slug,
        answer1,
        answer2,
        answer3,
        answer4,
        answer5,
      },
      update: {
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
