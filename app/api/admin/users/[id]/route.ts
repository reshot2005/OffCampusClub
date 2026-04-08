import { NextRequest, NextResponse } from "next/server";
import { requireAdminPermission } from "@/lib/admin-api-guard";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { checkAdminMutationRateLimit } from "@/lib/admin-rate-limit";

const patchSchema = z.object({
  suspended: z.boolean(),
});

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const admin = await requireAdminPermission("users", "suspend");
  if (admin instanceof NextResponse) return admin;
  const rl = checkAdminMutationRateLimit({ req, adminId: admin.id, action: "suspend-user", limit: 30 });
  if (!rl.ok) {
    return NextResponse.json(
      { error: "Too many requests. Please retry shortly." },
      { status: 429, headers: { "Retry-After": String(rl.retryAfterSec) } },
    );
  }

  const { suspended } = patchSchema.parse(await req.json());

  if (params.id === admin.id) {
    return NextResponse.json({ error: "Cannot suspend yourself" }, { status: 400 });
  }

  await prisma.user.update({
    where: { id: params.id },
    data: { suspended },
  });

  return NextResponse.json({ success: true });
}
