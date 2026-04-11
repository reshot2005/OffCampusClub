"use client";

import {
  House,
  Compass,
  Bell,
  UsersRound,
  Briefcase,
  Menu,
  LogOut,
  UserRound,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { useState } from "react";
import { useLogout } from "@/hooks/useLogout";
import { OCC_BRAND_ICON } from "@/lib/brand";

/** Standard Lucide set — readable names, consistent stroke, dashboard-grade semantics. */
const navItems: { icon: LucideIcon; label: string; href: string }[] = [
  { icon: House, label: "Home", href: "/dashboard" },
  { icon: Compass, label: "Explore", href: "/explore" },
  { icon: Bell, label: "Notifications", href: "/notifications" },
  { icon: UsersRound, label: "Clubs", href: "/clubs" },
  { icon: Briefcase, label: "E-Clubs", href: "/e-clubs" },
];

const SIDEBAR_COLLAPSED = 56;
const SIDEBAR_EXPANDED = 200;

export function OCCSidebar({ activePath: _activePath }: { activePath: string }) {
  const pathname = usePathname();
  const logout = useLogout();
  const reduceMotion = useReducedMotion();
  const [isHovered, setIsHovered] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);

  const spring = reduceMotion
    ? { type: "tween" as const, duration: 0.15 }
    : { type: "spring" as const, stiffness: 420, damping: 44, mass: 0.75 };

  return (
    <>
      <motion.aside
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        initial={false}
        animate={{ width: isHovered ? SIDEBAR_EXPANDED : SIDEBAR_COLLAPSED }}
        transition={spring}
        style={{ backgroundColor: "#000000", willChange: "width" }}
        className="hidden lg:flex shrink-0 border-r border-white/[0.08] flex-col h-screen sticky top-0 z-[100] overflow-hidden [contain:layout]"
      >
        <div className="flex h-[52px] shrink-0 items-center px-3 pt-5 pb-2">
          <Link href="/dashboard" className="flex min-w-0 items-center gap-2.5 rounded-xl group">
            <img
              src={OCC_BRAND_ICON}
              alt="OCC"
              className="h-9 w-9 shrink-0 rounded-xl object-cover shadow-[0_0_24px_rgba(82,39,255,0.18)] transition-transform duration-300 ease-out group-hover:scale-[1.03]"
              width={36}
              height={36}
            />
            <AnimatePresence>
              {isHovered && (
                  <motion.span
                    initial={{ opacity: 0, x: -6 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -6 }}
                    transition={{ duration: 0.16, ease: [0.25, 0.1, 0.25, 1] }}
                    className="truncate text-[15px] font-semibold tracking-tight text-white flex items-center"
                  >
                    OCC
                    <motion.span
                      animate={{ y: [0, -4, 0] }}
                      transition={{ duration: 1, repeat: Infinity, ease: "easeInOut" }}
                      className="ml-0.5 h-1.5 w-1.5 rounded-full bg-[#3B5BFF]"
                    />
                  </motion.span>
              )}
            </AnimatePresence>
          </Link>
        </div>

        <nav className="mt-4 flex flex-1 flex-col gap-1 px-2.5" aria-label="Primary">
          {navItems.map((item) => {
            const isActive =
              pathname === item.href ||
              (item.label === "Home" && pathname === "/dashboard") ||
              (item.href !== "/dashboard" && pathname.startsWith(item.href));
            return (
              <Link
                key={item.label}
                href={item.href}
                prefetch
                aria-current={isActive ? "page" : undefined}
                className={`group relative flex h-9 items-center rounded-lg px-2.5 transition-colors duration-200 ${
                  isActive ? "bg-white/[0.07]" : "hover:bg-white/[0.04]"
                }`}
              >
                {isActive && (
                  <motion.div
                    layoutId="sidebar-active-indicator"
                    className="absolute -left-2.5 top-1/2 h-6 w-[3px] -translate-y-1/2 rounded-full bg-[#C9A227] shadow-[0_0_12px_rgba(201,162,39,0.35)]"
                    transition={{ type: "spring", stiffness: 500, damping: 38 }}
                  />
                )}

                <div className="flex h-[18px] w-[18px] shrink-0 items-center justify-center">
                  <span className="flex">
                    <item.icon
                      className={`h-[18px] w-[18px] transition-colors duration-200 ${
                        isActive
                          ? "text-[#D4AF37]"
                          : "text-white/45 group-hover:text-white/85"
                      }`}
                      strokeWidth={isActive ? 2 : 1.75}
                      aria-hidden
                    />
                  </span>
                </div>

                <AnimatePresence>
                  {isHovered && (
                    <motion.span
                      initial={{ opacity: 0, x: -6 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -6 }}
                      transition={{ duration: 0.14, ease: [0.25, 0.1, 0.25, 1] }}
                      className={`ml-3 truncate text-[13px] tracking-tight text-white/95 ${
                        isActive ? "font-semibold" : "font-medium"
                      }`}
                    >
                      {item.label}
                    </motion.span>
                  )}
                </AnimatePresence>
              </Link>
            );
          })}
        </nav>

        <div className="px-2.5 pb-8 pt-2">
          <button
            type="button"
            onClick={logout}
            className="group flex h-10 w-full items-center rounded-lg px-2.5 text-left transition-colors duration-200 hover:bg-red-500/[0.08]"
          >
            <div className="flex h-[18px] w-[18px] shrink-0 items-center justify-center">
              <LogOut
                className="h-[18px] w-[18px] text-white/40 transition-colors group-hover:text-red-400/90"
                strokeWidth={1.75}
                aria-hidden
              />
            </div>
            <AnimatePresence>
              {isHovered && (
                <motion.span
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="ml-3 truncate text-[13px] font-medium text-red-400/75 group-hover:text-red-400"
                >
                  Log out
                </motion.span>
              )}
            </AnimatePresence>
          </button>
        </div>
      </motion.aside>

      <nav
        className="fixed bottom-0 left-0 right-0 z-[100] flex h-[68px] items-center justify-around border-t border-white/[0.08] bg-black/92 px-1 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-2 backdrop-blur-xl lg:hidden"
        aria-label="Primary mobile"
      >
        {navItems.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.label === "Home" && pathname === "/dashboard") ||
            (item.href !== "/dashboard" && pathname.startsWith(item.href));
          return (
            <Link
              key={item.label}
              href={item.href}
              prefetch
              aria-current={isActive ? "page" : undefined}
              className="relative flex min-w-0 flex-1 flex-col items-center justify-center gap-1 py-1"
            >
              <div className="relative flex h-8 items-center justify-center">
                <item.icon
                  className={`h-[18px] w-[18px] transition-all duration-200 ${
                    isActive ? "text-[#D4AF37]" : "text-white/40"
                  }`}
                  strokeWidth={isActive ? 2 : 1.75}
                  aria-hidden
                />
                {isActive && (
                  <motion.div
                    layoutId="mobile-nav-glow"
                    className="pointer-events-none absolute inset-0 -z-10 rounded-full bg-[#D4AF37]/15 blur-lg"
                    transition={{ type: "spring", stiffness: 400, damping: 32 }}
                  />
                )}
              </div>
              <span
                className={`max-w-full truncate px-0.5 text-[8px] font-semibold uppercase tracking-[0.12em] ${
                  isActive ? "text-[#D4AF37]/95" : "text-white/25"
                }`}
              >
                {item.label}
              </span>
              {isActive && (
                <motion.div
                  layoutId="mobile-nav-indicator"
                  className="absolute top-0 h-0.5 w-6 rounded-b-full bg-[#D4AF37]"
                  transition={{ type: "spring", stiffness: 500, damping: 38 }}
                />
              )}
            </Link>
          );
        })}
        <button
          type="button"
          onClick={() => setMoreOpen(true)}
          className="flex min-w-0 flex-1 flex-col items-center justify-center gap-1 py-1 text-white/35"
          aria-label="More options"
        >
          <Menu className="h-[18px] w-[18px]" strokeWidth={1.75} aria-hidden />
          <span className="text-[8px] font-semibold uppercase tracking-[0.12em]">More</span>
        </button>
      </nav>

      <AnimatePresence>
        {moreOpen ? (
          <>
            <motion.button
              key="more-backdrop"
              type="button"
              aria-label="Close menu"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.18 }}
              className="fixed inset-0 z-[200] bg-black/50 lg:hidden"
              onClick={() => setMoreOpen(false)}
            />
            <motion.div
              key="more-panel"
              role="dialog"
              aria-modal="true"
              initial={{ y: 28, opacity: 0.96 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 20, opacity: 0 }}
              transition={{ duration: 0.24, ease: [0.25, 0.1, 0.25, 1] }}
              className="fixed bottom-0 left-0 right-0 z-[210] rounded-t-2xl border border-white/10 bg-zinc-950 px-5 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-4 shadow-2xl lg:hidden"
            >
              <div className="mx-auto mb-3 h-1 w-9 rounded-full bg-white/15" />
              <Link
                href="/profile"
                prefetch
                onClick={() => setMoreOpen(false)}
                className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-[14px] font-semibold !text-white hover:bg-white/[0.06]"
              >
                <UserRound className="h-4 w-4 shrink-0 !text-white/90" strokeWidth={1.75} aria-hidden />
                Manage Profile
              </Link>
              <button
                type="button"
                onClick={() => {
                  setMoreOpen(false);
                  logout();
                }}
                className="mt-1 flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-[14px] font-semibold !text-red-400 hover:bg-red-500/10"
              >
                <LogOut className="h-4 w-4 shrink-0 !text-red-400" strokeWidth={1.75} aria-hidden />
                Log out
              </button>
            </motion.div>
          </>
        ) : null}
      </AnimatePresence>
    </>
  );
}
