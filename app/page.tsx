import dynamic from "next/dynamic";
import { BackgroundFramePreloader } from "@/components/BackgroundFramePreloader";
import { LandingRoutePrefetch } from "@/components/LandingRoutePrefetch";

const HomePage = dynamic(() => import("@/app/pages/HomePage"), { ssr: false });

export default function Page() {
  return (
    <>
      <LandingRoutePrefetch />
      <BackgroundFramePreloader />
      <HomePage />
    </>
  );
}
