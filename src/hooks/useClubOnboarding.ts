"use client";

import { useCallback, useMemo, useState } from "react";
import {
  getClubOnboardingConfig,
  type ClubOnboardingSlug,
} from "@/config/clubOnboardingQuestions";

type ClubOnboardingAnswers = Record<"q1" | "q2" | "q3" | "q4" | "q5", string>;

const EMPTY_ANSWERS: ClubOnboardingAnswers = {
  q1: "",
  q2: "",
  q3: "",
  q4: "",
  q5: "",
};

function postAnswers(payload: {
  userId?: string | null;
  clubSlug: ClubOnboardingSlug;
  answers: ClubOnboardingAnswers;
}) {
  const body = JSON.stringify(payload);

  if (typeof navigator !== "undefined" && "sendBeacon" in navigator) {
    const blob = new Blob([body], { type: "application/json" });
    navigator.sendBeacon("/api/clubs/onboarding", blob);
    return;
  }

  void fetch("/api/clubs/onboarding", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body,
    keepalive: true,
  }).catch(() => {});
}

export function useClubOnboarding({
  clubSlug,
  userId,
}: {
  clubSlug: ClubOnboardingSlug;
  userId?: string | null;
}) {
  const config = useMemo(() => getClubOnboardingConfig(clubSlug), [clubSlug]);
  const [answers, setAnswers] = useState<ClubOnboardingAnswers>(EMPTY_ANSWERS);
  const [activeIndex, setActiveIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [isAdvancing, setIsAdvancing] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [hasSubmitted, setHasSubmitted] = useState(false);

  const activeQuestion = config.questions[activeIndex];
  const progress = isComplete
    ? 1
    : (activeIndex + 1) / Math.max(1, config.questions.length);

  const submitAnswers = useCallback(
    (nextAnswers: ClubOnboardingAnswers) => {
      if (hasSubmitted) return;
      setHasSubmitted(true);
      postAnswers({
        userId,
        clubSlug,
        answers: nextAnswers,
      });
    },
    [clubSlug, hasSubmitted, userId],
  );

  const chooseOption = useCallback(
    (option: string) => {
      if (isAdvancing || isComplete) return;

      const questionKey = activeQuestion.key;
      const nextAnswers = {
        ...answers,
        [questionKey]: option,
      } as ClubOnboardingAnswers;

      setSelectedOption(option);
      setAnswers(nextAnswers);
      setIsAdvancing(true);

      window.setTimeout(() => {
        setSelectedOption(null);
        setIsAdvancing(false);

        if (activeIndex >= config.questions.length - 1) {
          setIsComplete(true);
          submitAnswers(nextAnswers);
          return;
        }

        setActiveIndex((prev) => prev + 1);
      }, 500);
    },
    [
      activeIndex,
      activeQuestion.key,
      answers,
      config.questions.length,
      isAdvancing,
      isComplete,
      submitAnswers,
    ],
  );

  return {
    config,
    answers,
    activeIndex,
    activeQuestion,
    isAdvancing,
    isComplete,
    progress,
    selectedOption,
    chooseOption,
  };
}
