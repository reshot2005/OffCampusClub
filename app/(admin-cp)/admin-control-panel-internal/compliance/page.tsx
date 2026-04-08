import { ComplianceClient } from "@/components/admin-cp/ComplianceClient";
import { requireAdminModuleRead } from "@/lib/admin-page-guard";

export default async function AdminCPCompliancePage() {
  await requireAdminModuleRead("compliance");
  return <ComplianceClient />;
}
