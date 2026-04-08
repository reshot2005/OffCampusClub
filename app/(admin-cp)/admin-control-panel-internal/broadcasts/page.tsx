import { BroadcastsClient } from "@/components/admin-cp/BroadcastsClient";
import { requireAdminModuleRead } from "@/lib/admin-page-guard";

export default async function AdminCPBroadcastsPage() {
  await requireAdminModuleRead("broadcasts");
  return <BroadcastsClient />;
}
