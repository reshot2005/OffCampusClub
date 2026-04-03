"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

const LOGIN_WITH_EXPLORE = `/login?redirect=${encodeURIComponent("/explore")}`;

/** Warms RSC cache for auth/explore before the user taps Join — feels instant. */
export function LandingRoutePrefetch() {
  const router = useRouter();

  useEffect(() => {
    router.prefetch(LOGIN_WITH_EXPLORE);
    router.prefetch("/login");
    router.prefetch("/register");
    router.prefetch("/explore");
  }, [router]);

  return null;
}
