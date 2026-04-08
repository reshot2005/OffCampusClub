import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { getAdminEffectiveAccess } from "@/lib/admin-api-guard";
import { can, type AdminModule } from "@/lib/admin-permissions";

export async function requireAdminModuleRead(module: AdminModule) {
  const user = await requireAdmin();
  const access = await getAdminEffectiveAccess(user.id);
  if (!access || !can(access, module, "read")) {
    notFound();
  }
  return user;
}

