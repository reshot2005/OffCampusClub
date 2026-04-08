import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminApi } from "@/lib/auth";
import {
  type AdminAction,
  type AdminModule,
  can,
  resolveEffectiveAccess,
  type EffectiveAdminAccess,
} from "@/lib/admin-permissions";

export async function getAdminEffectiveAccess(adminId: string): Promise<EffectiveAdminAccess | null> {
  const user = await prisma.user.findUnique({
    where: { id: adminId },
    select: { adminLevel: true, adminRoleTemplate: { select: { permissions: true } } },
  });
  if (!user) return null;
  return resolveEffectiveAccess({
    adminLevel: user.adminLevel,
    templatePermissions: user.adminRoleTemplate?.permissions ?? null,
  });
}

/** API routes: 401 if not admin, 403 if missing permission. */
export async function requireAdminPermission(
  module: AdminModule,
  action: AdminAction,
): Promise<{ id: string; email: string; fullName: string; access: EffectiveAdminAccess } | NextResponse> {
  const admin = await requireAdminApi();
  if (admin instanceof NextResponse) return admin;

  const access = await getAdminEffectiveAccess(admin.id);
  if (!access) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!can(access, module, action)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  return {
    id: admin.id,
    email: admin.email,
    fullName: admin.fullName,
    access,
  };
}
