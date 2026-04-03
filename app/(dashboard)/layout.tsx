import dynamic from "next/dynamic";
import { requireUser } from "@/lib/auth";
import { OCCSidebar } from "@/components/occ-dashboard/OCCSidebar";
import { OCCHeader } from "@/components/occ-dashboard/OCCHeader";
import { headers } from "next/headers";

const DashboardPageTransition = dynamic(
  () =>
    import("@/components/occ-dashboard/DashboardPageTransition").then(
      (m) => m.DashboardPageTransition,
    ),
  { ssr: true },
);
export default async function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const user = await requireUser();
  const path = (await headers()).get("next-url") ?? "/dashboard";

  return (
    <div className="dashboard-page-zoom flex min-h-screen bg-[#F6F7FA] font-sans tracking-normal text-black overflow-hidden select-none antialiased [font-family:system-ui,-apple-system,BlinkMacSystemFont,Roboto,Arial,sans-serif]">
      {/* Unified Navigation - Handles Sidebar & Bottom Nav */}
      <OCCSidebar activePath={path} />
      
      {/* Main Content Area */}
      <div className="relative flex h-screen min-w-0 flex-1 flex-col overflow-hidden">
        <OCCHeader user={user} />

        <main className="flex-1 overflow-y-auto overflow-x-hidden px-0 sm:px-4 lg:px-5 xl:px-7 pb-24 lg:pb-10 pt-2 sm:pt-6 bg-[#F6F7FA] text-[15px] font-normal leading-normal">
          <div className="mx-auto w-full max-w-[min(100%,1240px)]">
            <DashboardPageTransition>{children}</DashboardPageTransition>
          </div>
        </main>
      </div>
    </div>
  );
}

