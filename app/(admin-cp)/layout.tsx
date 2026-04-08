import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { AdminCPShell } from "@/components/admin-cp/AdminCPShell";
import { resolveEffectiveAccess } from "@/lib/admin-permissions";

export default async function AdminCPLayout({ children }: { children: React.ReactNode }) {
  const session = await requireAdmin();

  let user: {
    id: string;
    fullName: string;
    email: string;
    adminLevel: string | null;
    adminRoleTemplate: { name: string; permissions: unknown } | null;
  } | null = null;

  try {
    const base = await prisma.user.findUnique({
      where: { id: session.id },
      select: {
        id: true,
        fullName: true,
        email: true,
        adminLevel: true,
        adminRoleTemplateId: true,
      },
    });
    if (base) {
      let tpl: { name: string; permissions: unknown } | null = null;
      if (base.adminRoleTemplateId) {
        tpl = await prisma.adminRoleTemplate.findUnique({
          where: { id: base.adminRoleTemplateId },
          select: { name: true, permissions: true },
        });
      }
      user = { ...base, adminRoleTemplate: tpl };
    }
  } catch (err) {
    console.error("[admin-cp] layout: primary user load failed, using fallback query", err);
    const u = await prisma.user.findUnique({
      where: { id: session.id },
      select: { id: true, fullName: true, email: true, adminLevel: true },
    });
    user = u ? { ...u, adminRoleTemplate: null } : null;
  }

  const [pendingCount, alertCount] = await Promise.all([
    prisma.user.count({ where: { role: "CLUB_HEADER", approvalStatus: "PENDING" } }),
    prisma.suspiciousAccess.count({ where: { resolved: false } }).catch(() => 0),
  ]);

  const effective = resolveEffectiveAccess({
    adminLevel: user?.adminLevel,
    templatePermissions: user?.adminRoleTemplate?.permissions ?? null,
  });

  return (
    <AdminCPShell
      pendingCount={pendingCount}
      alertCount={alertCount}
      adminUser={{
        id: user?.id ?? session.id,
        fullName: user?.fullName ?? session.fullName,
        email: user?.email ?? session.email,
        adminLevel: user?.adminLevel ?? "SUPER_ADMIN",
        roleTemplateName: user?.adminRoleTemplate?.name ?? null,
      }}
      adminAccess={
        effective.fullAccess
          ? { fullAccess: true as const }
          : { fullAccess: false as const, matrix: effective.matrix }
      }
    >
      {children}
    </AdminCPShell>
  );
}
