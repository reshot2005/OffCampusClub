import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { logAudit } from "@/lib/audit";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { requireAdminPermission } from "@/lib/admin-api-guard";
import { logSuspiciousAccess } from "@/lib/security";

const patchSchema = z.object({
  suspended: z.boolean().optional(),
  role: z.enum(["STUDENT", "CLUB_HEADER", "ADMIN"]).optional(),
  adminLevel: z.enum(["SUPER_ADMIN", "MODERATOR"]).nullable().optional(),
  adminRoleTemplateId: z.string().nullable().optional(),
  approvalStatus: z.enum(["PENDING", "APPROVED", "REJECTED"]).optional(),
  resetPassword: z.boolean().optional(),
});

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const base = await requireAdminPermission("users", "update");
  if (base instanceof NextResponse) return base;

  const body = patchSchema.parse(await req.json());
  const data: Record<string, unknown> = {};
  let tempPassword: string | null = null;

  if (params.id === base.id && body.suspended) {
    return NextResponse.json({ error: "Cannot suspend yourself" }, { status: 400 });
  }

  if (body.suspended === true) {
    const s = await requireAdminPermission("users", "suspend");
    if (s instanceof NextResponse) return s;
  }

  if (body.adminLevel !== undefined || body.role !== undefined) {
    const p = await requireAdminPermission("users", "admin_promote");
    if (p instanceof NextResponse) {
      const forwarded = req.headers.get("x-forwarded-for") || "";
      const ip = forwarded.split(",")[0]?.trim() || "unknown";
      await logSuspiciousAccess({
        userId: base.id,
        ipAddress: ip,
        userAgent: req.headers.get("user-agent") || undefined,
        path: `/api/admin-cp/users/${params.id}`,
        reason: "Attempted role/adminLevel change without permission",
        severity: "CRITICAL",
      });
      return p;
    }
  }

  if (body.adminRoleTemplateId !== undefined) {
    const r = await requireAdminPermission("users", "role_change");
    if (r instanceof NextResponse) {
      const forwarded = req.headers.get("x-forwarded-for") || "";
      const ip = forwarded.split(",")[0]?.trim() || "unknown";
      await logSuspiciousAccess({
        userId: base.id,
        ipAddress: ip,
        userAgent: req.headers.get("user-agent") || undefined,
        path: `/api/admin-cp/users/${params.id}`,
        reason: "Attempted adminRoleTemplateId change without permission",
        severity: "HIGH",
      });
      return r;
    }
  }

  if (body.suspended !== undefined) data.suspended = body.suspended;
  if (body.role !== undefined) data.role = body.role;
  if (body.adminLevel !== undefined) data.adminLevel = body.adminLevel;
  if (body.adminRoleTemplateId !== undefined) data.adminRoleTemplateId = body.adminRoleTemplateId;
  if (body.approvalStatus !== undefined) data.approvalStatus = body.approvalStatus;

  if (body.resetPassword) {
    tempPassword = Math.random().toString(36).slice(2, 10) + Math.random().toString(36).slice(2, 4).toUpperCase();
    data.password = await bcrypt.hash(tempPassword, 12);
  }

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: "No valid fields" }, { status: 400 });
  }

  await prisma.user.update({ where: { id: params.id }, data: data as any });

  const action = body.resetPassword
    ? "RESET_PASSWORD"
    : body.role
      ? "CHANGE_ROLE"
      : body.suspended !== undefined
        ? body.suspended
          ? "SUSPEND_USER"
          : "UNSUSPEND_USER"
        : body.adminLevel !== undefined
          ? body.adminLevel
            ? "PROMOTE_ADMIN"
            : "DEMOTE_ADMIN"
          : "UPDATE_USER";

  await logAudit({
    adminId: base.id,
    adminEmail: base.email,
    action: action as any,
    entity: "user",
    entityId: params.id,
    details: { ...data, password: body.resetPassword ? "[REDACTED]" : undefined },
  });

  return NextResponse.json({ success: true, tempPassword });
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const admin = await requireAdminPermission("users", "delete");
  if (admin instanceof NextResponse) return admin;

  if (params.id === admin.id) {
    return NextResponse.json({ error: "Cannot delete yourself" }, { status: 400 });
  }

  const user = await prisma.user.findUnique({ where: { id: params.id }, select: { fullName: true, email: true } });
  if (!user) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await prisma.user.delete({ where: { id: params.id } });

  await logAudit({
    adminId: admin.id,
    adminEmail: admin.email,
    action: "DELETE_USER",
    entity: "user",
    entityId: params.id,
    details: { name: user.fullName, email: user.email },
  });

  return NextResponse.json({ success: true });
}
