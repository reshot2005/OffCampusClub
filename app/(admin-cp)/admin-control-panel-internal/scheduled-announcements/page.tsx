import { ScheduledAnnouncementsClient } from "@/components/admin-cp/ScheduledAnnouncementsClient";
import { requireAdminModuleRead } from "@/lib/admin-page-guard";

export default async function AdminCPScheduledAnnouncementsPage() {
  await requireAdminModuleRead("announcement_schedule");
  return <ScheduledAnnouncementsClient />;
}
