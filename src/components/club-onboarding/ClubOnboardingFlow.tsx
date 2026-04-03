"use client";

import { AnimatePresence, motion } from "motion/react";
import type { ClubOnboardingConfig } from "@/config/clubOnboardingQuestions";

type ClubOnboardingPhase = "questions" | "holding" | "revealing";

export function ClubOnboardingFlow({
  config,
  activeIndex,
  activePrompt,
  progress,
  selectedOption,
  isAdvancing,
  phase,
  onChooseOption,
}: {
  config: ClubOnboardingConfig;
  activeIndex: number;
  activePrompt: string;
  progress: number;
  selectedOption: string | null;
  isAdvancing: boolean;
  phase: ClubOnboardingPhase;
  onChooseOption: (option: string) => void;
}) {
  const currentQuestion = config.questions[activeIndex];

  return (
    <motion.div
      initial={{ opacity: 1 }}
      animate={
        phase === "revealing"
          ? {
              opacity: 0,
              clipPath: "circle(0% at 50% 50%)",
              transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] },
            }
          : {
              opacity: 1,
              clipPath: "circle(140% at 50% 50%)",
            }
      }
      className="fixed inset-0 z-[320] overflow-hidden bg-[#070707]"
    >
      <div className="absolute inset-0">
        <motion.div
          aria-hidden
          className="absolute -left-24 top-1/3 h-72 w-72 rounded-full bg-[#5227FF]/15 blur-[120px]"
          animate={{ x: [0, 24, 0], y: [0, -20, 0], opacity: [0.35, 0.5, 0.35] }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          aria-hidden
          className="absolute -right-16 bottom-12 h-80 w-80 rounded-full bg-[#D4AF37]/12 blur-[130px]"
          animate={{ x: [0, -18, 0], y: [0, 22, 0], opacity: [0.2, 0.38, 0.2] }}
          transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
        />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.05),transparent_32%),linear-gradient(180deg,rgba(255,255,255,0.02),transparent_25%,rgba(255,255,255,0.01))]" />
      </div>

      <div className="relative flex min-h-screen flex-col px-5 pb-10 pt-8 sm:px-8 md:px-12">
        <div className="mx-auto flex w-full max-w-5xl items-center justify-between">
          <div>
            <p className="font-mono text-[11px] uppercase tracking-[0.38em] text-[#C9A96E]">
              OCC · {config.clubIcon} · {config.clubName}
            </p>
            <p className="mt-2 text-[11px] text-white/40">
              Personal questions first. The cinematic drops right after.
            </p>
          </div>
          <p className="font-mono text-[11px] uppercase tracking-[0.28em] text-white/35">
            {Math.min(activeIndex + 1, 5)} / 5
          </p>
        </div>

        <div className="mx-auto mt-5 flex w-full max-w-5xl gap-2">
          {config.questions.map((question, index) => (
            <div
              key={question.key}
              className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/8"
            >
              <motion.div
                className="h-full rounded-full bg-gradient-to-r from-[#C9A96E] to-[#F4D88A]"
                animate={{
                  width:
                    index < activeIndex
                      ? "100%"
                      : index === activeIndex
                        ? `${Math.max(progress * 100 - index * 20, 18)}%`
                        : "0%",
                  opacity: index === activeIndex ? 1 : 0.75,
                }}
              />
            </div>
          ))}
        </div>

        <div className="mx-auto flex w-full max-w-5xl flex-1 items-center justify-center">
          <AnimatePresence mode="wait">
            {phase === "questions" ? (
              <motion.div
                key={currentQuestion.key}
                initial={{ opacity: 0, y: 28 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -18 }}
                transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
                className="w-full max-w-3xl rounded-[2rem] border border-white/10 bg-white/[0.04] px-5 py-8 shadow-[0_35px_120px_rgba(0,0,0,0.35)] backdrop-blur-2xl sm:px-8 sm:py-10 md:px-10"
              >
                <p className="font-mono text-[11px] uppercase tracking-[0.28em] text-white/35">
                  Step {activeIndex + 1}
                </p>
                <h1 className="mt-4 text-[clamp(2.2rem,5vw,4.5rem)] font-black uppercase leading-[0.92] tracking-[0.02em] text-[#F7F4EF]">
                  {activePrompt}
                </h1>
                <p className="mt-4 max-w-xl text-[14px] leading-relaxed text-white/45 sm:text-[15px]">
                  Pick the one that feels closest. We’ll tune the vibe around it.
                </p>

                <div className="mt-8 grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4">
                  {currentQuestion.options.map((option) => {
                    const isSelected = selectedOption === option;

                    return (
                      <button
                        key={option}
                        type="button"
                        onClick={() => onChooseOption(option)}
                        disabled={isAdvancing}
                        className={`group rounded-[1.5rem] border px-4 py-5 text-left transition-all duration-300 ${
                          isSelected
                            ? "border-[#D4AF37]/80 bg-[#D4AF37]/18 shadow-[0_0_30px_rgba(212,175,55,0.16)]"
                            : "border-white/10 bg-white/[0.03] hover:-translate-y-0.5 hover:border-[#D4AF37]/45 hover:bg-white/[0.06]"
                        }`}
                      >
                        <span className="block text-[15px] font-medium text-[#F7F4EF] sm:text-[16px]">
                          {option}
                        </span>
                        <span className="mt-2 block text-[11px] uppercase tracking-[0.24em] text-white/28">
                          Select
                        </span>
                      </button>
                    );
                  })}
                </div>
              </motion.div>
            ) : (
              <motion.div
                key={phase}
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.4 }}
                className="flex w-full max-w-xl flex-col items-center rounded-[2rem] border border-white/10 bg-white/[0.04] px-8 py-12 text-center shadow-[0_35px_120px_rgba(0,0,0,0.35)] backdrop-blur-2xl"
              >
                <motion.div
                  className="mb-6 flex h-16 w-16 items-center justify-center rounded-full border border-[#D4AF37]/25 bg-[#D4AF37]/10 font-mono text-sm uppercase tracking-[0.25em] text-[#F4D88A]"
                  animate={{ scale: [1, 1.05, 1], rotate: [0, 6, 0] }}
                  transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
                >
                  {config.clubIcon}
                </motion.div>
                <h2 className="text-[clamp(2.1rem,4vw,3.4rem)] font-black uppercase leading-[0.92] text-[#F7F4EF]">
                  {phase === "holding" ? "Locking in your entrance" : "Welcome in"}
                </h2>
                <p className="mt-4 max-w-md text-[14px] leading-relaxed text-white/45 sm:text-[15px]">
                  {phase === "holding"
                    ? "Final touches are syncing behind the curtain. Your club experience is about to open."
                    : "Your club world is ready. Opening the full scroll experience now."}
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="mx-auto w-full max-w-5xl text-center">
          <p className="text-[11px] tracking-[0.18em] text-white/28">
            {config.footerCopy}
          </p>
        </div>
      </div>
    </motion.div>
  );
}
