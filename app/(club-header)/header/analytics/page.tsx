import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { AnalyticsClient } from "@/components/club-header/HeaderAnalytics";
import { getClubOnboardingConfig } from "@/config/clubOnboardingQuestions";

const ANSWER_FIELDS = [
  "answer1",
  "answer2",
  "answer3",
  "answer4",
  "answer5",
] as const;

export default async function HeaderAnalyticsPage() {
  const user = await requireUser();
  const managedClub = user.clubManaged;
  const [totalMembers, totalPosts, referralMembers] = await Promise.all([
    prisma.referralStat.count({ where: { clubHeaderId: user.id } }),
    prisma.post.count({ where: { userId: user.id } }),
    managedClub
      ? prisma.referralStat.findMany({
          where: { clubHeaderId: user.id, clubId: managedClub.id },
          select: { studentId: true },
        })
      : Promise.resolve([]),
  ]);

  const studentIds = [...new Set(referralMembers.map((member) => member.studentId))];
  const onboardingRows =
    managedClub && studentIds.length
      ? await prisma.clubOnboarding.findMany({
          where: {
            clubSlug: managedClub.slug,
            userId: { in: studentIds },
          },
        })
      : [];

  const onboardingConfig = managedClub
    ? getClubOnboardingConfig(managedClub.slug)
    : null;

  const onboardingInsights =
    onboardingConfig?.questions.map((question, index) => {
      const field = ANSWER_FIELDS[index];
      const total = onboardingRows.length;

      return {
        key: question.key,
        prompt: question.prompt,
        total,
        options: question.options.map((label) => {
          const count = onboardingRows.filter((row) => row[field] === label).length;

          return {
            label,
            count,
            percentage: total > 0 ? Math.round((count / total) * 100) : 0,
          };
        }),
      };
    }) ?? [];

  return (
    <div className="space-y-6">
      <div>
        <p className="text-[10px] uppercase tracking-widest text-[#8C6DFD] font-semibold mb-2">Insights</p>
        <h1 className="text-4xl font-bold text-white tracking-tight">
          Club <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#5227FF] to-[#8C6DFD]">Analytics</span>
        </h1>
        <p className="mt-2 text-sm text-white/50">Track your club's growth and engagement metrics.</p>
      </div>
      <AnalyticsClient
        totalMembers={totalMembers}
        totalPosts={totalPosts}
        onboardingInsights={onboardingInsights}
        clubName={onboardingConfig?.clubName ?? managedClub?.name ?? "Your Club"}
      />
    </div>
  );
}
