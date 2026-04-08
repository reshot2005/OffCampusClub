import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminPermission } from "@/lib/admin-api-guard";
import { logAudit } from "@/lib/audit";
import { buildMatrixFromLevel } from "@/lib/admin-permissions";
import { z } from "zod";

const createSchema = z.object({
  name: z.string().min(2).max(80),
  slug: z.string().min(2).max(60).regex(/^[a-z0-9-]+$/),
  description: z.string().max(500).optional().default(""),
  permissions: z.record(z.string(), z.array(z.string())),
});

async function ensureBuiltInTemplates() {
  const count = await prisma.adminRoleTemplate.count();
  if (count > 0) return;
  const modPerms = buildMatrixFromLevel("MODERATOR");
  await prisma.adminRoleTemplate.create({
    data: {
      name: "Standard moderator",
      slug: "standard-moderator",
      description: "Matches legacy moderator: posts, users read/suspend, approvals read.",
      permissions: modPerms as object,
    },
  });
}

export async function GET() {
  const admin = await requireAdminPermission("roles", "read");
  if (admin instanceof NextResponse) return admin;

  await ensureBuiltInTemplates();

  const templates = await prisma.adminRoleTemplate.findMany({
    orderBy: { name: "asc" },
    include: { _count: { select: { users: true } } },
  });

  return NextResponse.json({
    templates: templates.map((t) => ({
      id: t.id,
      name: t.name,
      slug: t.slug,
      description: t.description,
      permissions: t.permissions,
      userCount: t._count.users,
      updatedAt: t.updatedAt.toISOString(),
    })),
  });
}

export async function POST(req: NextRequest) {
  const admin = await requireAdminPermission("roles", "create");
  if (admin instanceof NextResponse) return admin;

  const body = createSchema.parse(await req.json());

  const existing = await prisma.adminRoleTemplate.findUnique({ where: { slug: body.slug } });
  if (existing) {
    return NextResponse.json({ error: "Slug already in use" }, { status: 400 });
  }

  const t = await prisma.adminRoleTemplate.create({
    data: {
      name: body.name,
      slug: body.slug,
      description: body.description ?? "",
      permissions: body.permissions as object,
    },
  });

  await logAudit({
    adminId: admin.id,
    adminEmail: admin.email,
    action: "ADMIN_ROLE_CREATE",
    entity: "admin_role",
    entityId: t.id,
    details: { name: t.name, slug: t.slug },
  });

  return NextResponse.json({ success: true, template: t });
}
