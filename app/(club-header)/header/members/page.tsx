import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ClubHeaderReferralRealtime } from "@/components/club-header/ClubHeaderReferralRealtime";
import { MembersTable } from "@/components/club-header/MembersTable";

export default async function HeaderMembersPage() {
  const user = await requireUser();
  const members = await prisma.referralStat.findMany({
    where: { clubHeaderId: user.id },
    include: { student: true },
    orderBy: { registeredAt: "desc" },
  });

  return (
    <ClubHeaderReferralRealtime headerId={user.id}>
    <div className="space-y-6">
      <div>
        <p className="text-[10px] uppercase tracking-widest text-[#8C6DFD] font-semibold mb-2">Your Referrals</p>
        <h1 className="text-4xl font-bold text-white tracking-tight">
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#5227FF] to-[#8C6DFD]">{members.length}</span> Students
        </h1>
        <p className="mt-2 text-sm text-white/50">Students who joined using your referral code.</p>
      </div>
      <MembersTable members={members as never} />
    </div>
    </ClubHeaderReferralRealtime>
  );
}
