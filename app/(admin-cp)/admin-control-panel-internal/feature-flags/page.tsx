import { FeatureFlagsClient } from "@/components/admin-cp/FeatureFlagsClient";
import { requireAdminModuleRead } from "@/lib/admin-page-guard";

export default async function AdminCPFeatureFlagsPage() {
  await requireAdminModuleRead("feature_flags");
  return <FeatureFlagsClient />;
}
