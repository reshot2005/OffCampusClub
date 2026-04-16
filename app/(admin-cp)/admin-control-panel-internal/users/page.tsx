import { prisma } from "@/lib/prisma";
import { UsersCRUD } from "@/components/admin-cp/UsersCRUD";
import { isLegitIndianMobile } from "@/lib/phone-utils";

export default async function AdminCPUsersPage() {
  const users = await prisma.user.findMany({
    select: {
      id: true, fullName: true, email: true, phoneNumber: true, collegeName: true,
      role: true, approvalStatus: true, suspended: true,
      createdAt: true, referralCode: true, bio: true, city: true, graduationYear: true,
      updatedAt: true, referredBy: true,
      referrer: { select: { fullName: true, referralCode: true } },
      memberships: { select: { club: { select: { name: true } } } },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <UsersCRUD
      users={users.map((u) => ({
        ...u,
        createdAt: u.createdAt.toISOString(),
        updatedAt: u.updatedAt.toISOString(),
        clubs: u.memberships.map((m) => m.club.name),
        referredByInfo: u.referrer ? { name: u.referrer.fullName, code: u.referrer.referralCode } : null,
        isPhoneLegit: isLegitIndianMobile(u.phoneNumber),
      }))}
    />
  );
}
