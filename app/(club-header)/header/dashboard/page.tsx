import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { HeaderOverviewClient } from "@/components/club-header/HeaderOverviewClient";

export default async function HeaderDashboardPage() {
  const user = await requireUser();

  const [membersCount, postsCount] = await Promise.all([
    prisma.referralStat.count({ where: { clubHeaderId: user.id } }),
    prisma.post.count({ where: { userId: user.id } }),
  ]);

  return (
    <HeaderOverviewClient
      headerId={user.id}
      membersCount={membersCount}
      postsCount={postsCount}
      clubName={user.clubManaged?.name ?? "Your Club"}
      referralCode={user.referralCode ?? "PENDING"}
      hasClub={!!user.clubManaged}
    />
  );
}
