import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminPermission } from "@/lib/admin-api-guard";
import { logAudit } from "@/lib/audit";
import { z } from "zod";

const createSchema = z.object({
  title: z.string().min(2).max(200),
  category: z.string().min(1).max(100),
  description: z.string().max(2000).optional().default(""),
  imageUrl: z.string().url(),
  sortOrder: z.number().int().optional().default(0),
  active: z.boolean().optional().default(true),
});

export async function GET() {
  const admin = await requireAdminPermission("orbit", "read");
  if (admin instanceof NextResponse) return admin;

  const projects = await prisma.orbitProject.findMany({
    orderBy: { sortOrder: "asc" },
  });

  return NextResponse.json({
    projects: projects.map((p) => ({
      ...p,
      createdAt: p.createdAt.toISOString(),
      updatedAt: p.updatedAt.toISOString(),
    })),
  });
}

export async function POST(req: NextRequest) {
  const admin = await requireAdminPermission("orbit", "create");
  if (admin instanceof NextResponse) return admin;

  const body = createSchema.parse(await req.json());

  const project = await prisma.orbitProject.create({
    data: {
      title: body.title,
      category: body.category,
      description: body.description,
      imageUrl: body.imageUrl,
      sortOrder: body.sortOrder,
      active: body.active,
    },
  });

  await logAudit({
    adminId: admin.id,
    adminEmail: admin.email,
    action: "CREATE_EVENT" as any,
    entity: "event" as any,
    entityId: project.id,
    details: { title: body.title, category: body.category, type: "orbit_project" },
  });

  return NextResponse.json({
    success: true,
    project: {
      ...project,
      createdAt: project.createdAt.toISOString(),
      updatedAt: project.updatedAt.toISOString(),
    },
  });
}
