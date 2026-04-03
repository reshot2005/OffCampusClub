"use client";

import dynamic from "next/dynamic";
import type { ComponentType } from "react";
import { ClubOnboardingGate } from "@/components/club-onboarding/ClubOnboardingGate";
import type { ClubOnboardingSlug } from "@/config/clubOnboardingQuestions";
import { FRAMES_PATH, TOTAL_FRAMES } from "@/app/components/bikers/constants";
import {
  FOOTBALL_FRAMES_PATH,
  FOOTBALL_TOTAL_FRAMES,
} from "@/app/components/football/footballConstants";
import {
  PHOTO_FRAMES_PATH,
  PHOTO_TOTAL_FRAMES,
} from "@/app/components/photography/photographyConstants";
import {
  FASHION_FRAMES_PATH,
  FASHION_TOTAL_FRAMES,
} from "@/app/components/fashion/fashionConstants";

const BikersRidePage = dynamic(
  () => import("@/app/components/bikers/BikersRidePage").then((mod) => mod.BikersRidePage),
  { ssr: false },
);
const FootballPage = dynamic(
  () => import("@/app/components/football/FootballPage").then((mod) => mod.FootballPage),
  { ssr: false },
);
const PhotographyPage = dynamic(
  () => import("@/app/components/photography/PhotographyPage").then((mod) => mod.PhotographyPage),
  { ssr: false },
);
const FashionPage = dynamic(
  () => import("@/app/components/fashion/FashionPage").then((mod) => mod.FashionPage),
  { ssr: false },
);

type CinematicClubSlug = Extract<
  ClubOnboardingSlug,
  "bikers" | "sports" | "photography" | "fashion"
>;

const EXPERIENCE_MAP: Record<
  CinematicClubSlug,
  {
    framesPath: string;
    totalFrames: number;
    Experience: ComponentType;
  }
> = {
  bikers: {
    framesPath: FRAMES_PATH,
    totalFrames: TOTAL_FRAMES,
    Experience: BikersRidePage,
  },
  sports: {
    framesPath: FOOTBALL_FRAMES_PATH,
    totalFrames: FOOTBALL_TOTAL_FRAMES,
    Experience: FootballPage,
  },
  photography: {
    framesPath: PHOTO_FRAMES_PATH,
    totalFrames: PHOTO_TOTAL_FRAMES,
    Experience: PhotographyPage,
  },
  fashion: {
    framesPath: FASHION_FRAMES_PATH,
    totalFrames: FASHION_TOTAL_FRAMES,
    Experience: FashionPage,
  },
};

export function ClubOnboardingEntry({
  clubSlug,
  userId,
}: {
  clubSlug: CinematicClubSlug;
  userId?: string | null;
}) {
  const experience = EXPERIENCE_MAP[clubSlug];

  return (
    <ClubOnboardingGate
      clubSlug={clubSlug}
      framesPath={experience.framesPath}
      totalFrames={experience.totalFrames}
      Experience={experience.Experience}
      userId={userId}
    />
  );
}
