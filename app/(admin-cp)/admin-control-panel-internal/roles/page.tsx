import { AdminRolesClient } from "@/components/admin-cp/AdminRolesClient";
import { requireAdminModuleRead } from "@/lib/admin-page-guard";

export default async function AdminCPRolesPage() {
  await requireAdminModuleRead("roles");
  return <AdminRolesClient />;
}
