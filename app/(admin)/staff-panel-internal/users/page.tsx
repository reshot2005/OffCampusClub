import { prisma } from "@/lib/prisma";
import { UsersAdminClient, type AdminUserRow } from "@/components/admin/UsersAdminClient";
import type { ApprovalStatus, UserRole } from "@prisma/client";

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: Record<string, string | string[] | undefined>;
}) {
  const q = typeof searchParams.q === "string" ? searchParams.q : "";
  const role = typeof searchParams.role === "string" ? searchParams.role : "";
  const status = typeof searchParams.status === "string" ? searchParams.status : "";

  const users = await prisma.user.findMany({
    where: {
      ...(q.trim()
        ? {
            OR: [
              { fullName: { contains: q.trim(), mode: "insensitive" as const } },
              { email: { contains: q.trim(), mode: "insensitive" as const } },
              { collegeName: { contains: q.trim(), mode: "insensitive" as const } },
            ],
          }
        : {}),
      ...(role ? { role: role as UserRole } : {}),
      ...(status ? { approvalStatus: status as ApprovalStatus } : {}),
    },
    include: {
      memberships: { include: { club: true }, take: 5 },
      _count: { select: { referralStatsAsStudent: true, referralStatsAsHeader: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 200,
  });

  const rows: AdminUserRow[] = users.map((u) => ({
    id: u.id,
    fullName: u.fullName,
    email: u.email,
    role: u.role,
    approvalStatus: u.approvalStatus,
    collegeName: u.collegeName,
    phoneNumber: u.phoneNumber,
    suspended: u.suspended,
    createdAt: u.createdAt.toISOString(),
    referralCode: u.referralCode,
    memberships: u.memberships,
    _count: u._count,
  }));

  return (
    <UsersAdminClient
      key={`${q}|${role}|${status}`}
      users={rows}
      initialQ={q}
      initialRole={role}
      initialStatus={status}
    />
  );
}
