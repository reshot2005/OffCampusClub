"use client";

import { useEffect, useState, type ComponentType } from "react";
import { loadFrameSequence } from "@/lib/loadFrameSequence";
import type { ClubOnboardingSlug } from "@/config/clubOnboardingQuestions";
import { ClubOnboardingFlow } from "@/components/club-onboarding/ClubOnboardingFlow";
import { useClubOnboarding } from "@/hooks/useClubOnboarding";

export function ClubOnboardingGate({
  clubSlug,
  framesPath,
  totalFrames,
  Experience,
  userId,
}: {
  clubSlug: ClubOnboardingSlug;
  framesPath: string;
  totalFrames: number;
  Experience: ComponentType;
  userId?: string | null;
}) {
  const onboarding = useClubOnboarding({ clubSlug, userId });
  const [framesReady, setFramesReady] = useState(false);
  const [experienceMounted, setExperienceMounted] = useState(false);
  const [revealing, setRevealing] = useState(false);
  const [revealed, setRevealed] = useState(false);

  useEffect(() => {
    let active = true;

    void loadFrameSequence(framesPath, totalFrames, () => {}).then(() => {
      if (!active) return;
      setFramesReady(true);
      setExperienceMounted(true);
    });

    return () => {
      active = false;
    };
  }, [framesPath, totalFrames]);

  useEffect(() => {
    if (!framesReady || !experienceMounted || !onboarding.isComplete || revealing || revealed) {
      return;
    }

    const startReveal = window.setTimeout(() => {
      setRevealing(true);
    }, 250);

    return () => window.clearTimeout(startReveal);
  }, [experienceMounted, framesReady, onboarding.isComplete, revealed, revealing]);

  useEffect(() => {
    if (!revealing) return;

    const finishReveal = window.setTimeout(() => {
      setRevealed(true);
    }, 700);

    return () => window.clearTimeout(finishReveal);
  }, [revealing]);

  return (
    <>
      {experienceMounted ? <Experience /> : null}
      {!revealed ? (
        <ClubOnboardingFlow
          config={onboarding.config}
          activeIndex={onboarding.activeIndex}
          activePrompt={onboarding.activeQuestion.prompt}
          progress={onboarding.progress}
          selectedOption={onboarding.selectedOption}
          isAdvancing={onboarding.isAdvancing}
          phase={
            revealing
              ? "revealing"
              : onboarding.isComplete
                ? "holding"
                : "questions"
          }
          onChooseOption={onboarding.chooseOption}
        />
      ) : null}
    </>
  );
}
