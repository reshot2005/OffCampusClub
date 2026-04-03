"use client";

/** Default post-login destination from landing CTAs */
export const LANDING_POST_AUTH_PATH = "/explore";

export function storeRedirectIntent(path: string) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem("occ-redirect", path);
}

export function authEntryHref(
  targetPath: string,
  authPath: "/login" | "/register" = "/login",
) {
  return `${authPath}?redirect=${encodeURIComponent(targetPath)}`;
}

export function navigateForAuth(
  navigate: (path: string) => void,
  targetPath: string,
  authPath: "/login" | "/register" = "/register",
) {
  storeRedirectIntent(targetPath);
  navigate(authEntryHref(targetPath, authPath));
}
