"use client";

import { Bell, ChevronDown, LayoutGrid, User, LogOut, CheckCheck, ExternalLink } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useRef, useEffect, Suspense, useCallback } from "react";
import { formatDistanceToNow } from "date-fns";
import { useRouter } from "next/navigation";
import { ExploreNavSearch } from "@/components/occ-dashboard/ExploreNavSearch";
import Link from "next/link";
import { avatarSrc } from "@/lib/avatar";
import { useLogout } from "@/hooks/useLogout";
import { CLUB_HUB_CATEGORIES } from "@/lib/clubCategoryFilter";
import { pusherClient } from "@/lib/pusher";

type HeaderNotification = {
  id: string;
  type: string;
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
  data: unknown;
};

function hrefFromNotificationData(data: unknown): string | null {
  if (!data || typeof data !== "object") return null;
  const h = (data as { href?: unknown }).href;
  return typeof h === "string" && h.startsWith("/") ? h : null;
}

export function OCCHeader({ user }: { user: any }) {
  const router = useRouter();
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [categoryOpen, setCategoryOpen] = useState(false);
  const [notifications, setNotifications] = useState<HeaderNotification[]>([]);
  const [notifLoading, setNotifLoading] = useState(false);
  const logout = useLogout();
  const profileRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);
  const categoryRef = useRef<HTMLDivElement>(null);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const loadNotifications = useCallback(async () => {
    setNotifLoading(true);
    try {
      const res = await fetch("/api/notifications?limit=25", { credentials: "include" });
      if (!res.ok) return;
      const data = (await res.json()) as { notifications?: HeaderNotification[] };
      if (Array.isArray(data.notifications)) {
        setNotifications(
          data.notifications.map((n) => ({
            ...n,
            createdAt: typeof n.createdAt === "string" ? n.createdAt : new Date(n.createdAt as Date).toISOString(),
          })),
        );
      }
    } finally {
      setNotifLoading(false);
    }
  }, []);

  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

  useEffect(() => {
    if (notifOpen) loadNotifications();
  }, [notifOpen, loadNotifications]);

  useEffect(() => {
    const client = pusherClient;
    const uid = user?.id as string | undefined;
    if (!client || !uid) return;
    const channel = client.subscribe(`user-${uid}`);
    const push = (title: string, message: string) => {
      setNotifications((prev) => [
        {
          id: crypto.randomUUID(),
          type: "live",
          title,
          message,
          read: false,
          createdAt: new Date().toISOString(),
          data: null,
        },
        ...prev,
      ]);
    };
    const onGeneric = (data: { title?: string; message?: string }) => {
      push(data.title || "Update", data.message || "");
    };
    channel.bind("notification", onGeneric);
    channel.bind("approved", (data: { message?: string }) =>
      push("Application update", data.message || "Approved"),
    );
    channel.bind("rejected", (data: { reason?: string }) =>
      push("Application update", data.reason || "Not selected"),
    );
    return () => {
      channel.unbind("notification", onGeneric);
      channel.unbind("approved");
      channel.unbind("rejected");
      client.unsubscribe(`user-${uid}`);
    };
  }, [user?.id]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const t = event.target as Node;
      if (profileRef.current && !profileRef.current.contains(t)) setIsProfileOpen(false);
      if (notifRef.current && !notifRef.current.contains(t)) setNotifOpen(false);
      if (categoryRef.current && !categoryRef.current.contains(t)) setCategoryOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (!notifOpen && !categoryOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setNotifOpen(false);
        setCategoryOpen(false);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [notifOpen, categoryOpen]);

  const markOneRead = async (id: string) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
    await fetch("/api/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ id }),
    });
  };

  const markAllRead = async () => {
    await fetch("/api/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ markAllRead: true }),
    });
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const onNotificationRowClick = async (n: HeaderNotification) => {
    await markOneRead(n.id);
    setNotifOpen(false);
    const href = hrefFromNotificationData(n.data);
    router.push(href ?? "/notifications");
  };

  return (
    <motion.header 
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex shrink-0 items-center justify-between px-6 py-4 bg-white/80 backdrop-blur-xl z-40 w-full border-b border-black/5 sticky top-0"
    >
      <div className="min-w-0 flex-1 flex items-center gap-4 pr-4">
        <Suspense fallback={null}>
          <ExploreNavSearch />
        </Suspense>
      </div>

      <div className="flex items-center gap-4">
        <div className="hidden lg:flex items-center gap-3 bg-black/[0.02] p-1.5 rounded-2xl border border-black/5 mr-2">
          <div className="relative" ref={notifRef}>
            <button
              type="button"
              aria-expanded={notifOpen}
              aria-haspopup="dialog"
              aria-label="Notifications"
              onClick={() => {
                setNotifOpen((v) => !v);
                setCategoryOpen(false);
              }}
              className="relative p-2.5 rounded-xl bg-white border border-black/5 text-slate-600 hover:text-[#5227FF] hover:border-[#5227FF]/20 transition-all group overflow-hidden"
            >
              <Bell className="h-5 w-5" strokeWidth={2.5} />
              {unreadCount > 0 ? (
                <span
                  className="absolute top-2.5 right-2.5 flex h-2 w-2 rounded-full bg-[#5227FF] ring-2 ring-white"
                  aria-hidden
                />
              ) : null}
            </button>

            <AnimatePresence>
              {notifOpen ? (
                <motion.div
                  role="dialog"
                  aria-label="Notifications"
                  initial={{ opacity: 0, y: 10, scale: 0.98 }}
                  animate={{ opacity: 1, y: 8, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.98 }}
                  transition={{ duration: 0.15 }}
                  className="absolute right-0 top-full z-50 mt-2 w-[min(100vw-2rem,380px)] rounded-[20px] border border-black/5 bg-white shadow-[0_20px_50px_rgba(0,0,0,0.12)] overflow-hidden"
                >
                  <div className="flex items-center justify-between border-b border-black/5 px-4 py-3">
                    <p className="text-sm font-bold text-slate-900">Notifications</p>
                    {unreadCount > 0 ? (
                      <button
                        type="button"
                        onClick={() => markAllRead()}
                        className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-[11px] font-semibold text-[#5227FF] hover:bg-[#5227FF]/5"
                      >
                        <CheckCheck className="h-3.5 w-3.5" />
                        Mark all read
                      </button>
                    ) : null}
                  </div>
                  <div className="max-h-[min(60vh,320px)] overflow-y-auto">
                    {notifLoading && notifications.length === 0 ? (
                      <p className="px-4 py-8 text-center text-sm text-slate-400">Loading…</p>
                    ) : notifications.length === 0 ? (
                      <p className="px-4 py-8 text-center text-sm text-slate-500">
                        No notifications yet. Activity from clubs, gigs, and approvals will show up here.
                      </p>
                    ) : (
                      <ul className="py-1">
                        {notifications.slice(0, 12).map((n) => {
                          const link = hrefFromNotificationData(n.data);
                          return (
                            <li key={n.id} className="border-b border-black/[0.04] last:border-0">
                              <button
                                type="button"
                                onClick={() => onNotificationRowClick(n)}
                                className={`flex w-full items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-slate-50 ${
                                  n.read ? "bg-white" : "bg-[#5227FF]/[0.04]"
                                }`}
                              >
                                {!n.read ? (
                                  <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-[#5227FF]" aria-hidden />
                                ) : (
                                  <span className="mt-1.5 h-2 w-2 shrink-0" aria-hidden />
                                )}
                                <span className="min-w-0 flex-1">
                                  <span className="flex items-center gap-1">
                                    <span className="text-[13px] font-semibold text-slate-900 line-clamp-1">
                                      {n.title}
                                    </span>
                                    {link ? (
                                      <ExternalLink className="h-3 w-3 shrink-0 text-slate-300" aria-hidden />
                                    ) : null}
                                  </span>
                                  <span className="mt-0.5 block text-[12px] text-slate-600 line-clamp-2">
                                    {n.message}
                                  </span>
                                  <span className="mt-1 block text-[10px] uppercase tracking-wider text-slate-400">
                                    {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true })}
                                  </span>
                                </span>
                              </button>
                            </li>
                          );
                        })}
                      </ul>
                    )}
                  </div>
                  <div className="border-t border-black/5 px-3 py-2">
                    <Link
                      href="/notifications"
                      onClick={() => setNotifOpen(false)}
                      className="flex w-full items-center justify-center rounded-xl py-2.5 text-xs font-bold text-[#5227FF] hover:bg-[#5227FF]/5"
                    >
                      View all notifications
                    </Link>
                  </div>
                </motion.div>
              ) : null}
            </AnimatePresence>
          </div>

          <div className="relative" ref={categoryRef}>
            <button
              type="button"
              aria-expanded={categoryOpen}
              aria-haspopup="menu"
              aria-label="Club categories"
              onClick={() => {
                setCategoryOpen((v) => !v);
                setNotifOpen(false);
              }}
              className={`p-2.5 rounded-xl transition-all ${
                categoryOpen
                  ? "bg-[#5227FF]/10 text-[#5227FF]"
                  : "text-slate-400 hover:bg-black/5 hover:text-slate-900"
              }`}
            >
              <LayoutGrid className="h-5 w-5" strokeWidth={2.5} />
            </button>

            <AnimatePresence>
              {categoryOpen ? (
                <motion.div
                  role="menu"
                  aria-label="Browse clubs by category"
                  initial={{ opacity: 0, y: 10, scale: 0.98 }}
                  animate={{ opacity: 1, y: 8, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.98 }}
                  transition={{ duration: 0.15 }}
                  className="absolute right-0 top-full z-50 mt-2 w-56 rounded-[20px] border border-black/5 bg-white py-2 shadow-[0_20px_50px_rgba(0,0,0,0.12)]"
                >
                  <p className="px-4 pb-2 pt-1 text-[10px] font-bold uppercase tracking-widest text-slate-400">
                    Club hub
                  </p>
                  {CLUB_HUB_CATEGORIES.map((cat) => (
                    <Link
                      key={cat.key}
                      role="menuitem"
                      href={cat.key === "all" ? "/clubs" : `/clubs?cat=${cat.key}`}
                      onClick={() => setCategoryOpen(false)}
                      className="block px-4 py-2.5 text-sm font-semibold text-slate-800 hover:bg-slate-50 hover:text-[#5227FF]"
                    >
                      {cat.label}
                    </Link>
                  ))}
                </motion.div>
              ) : null}
            </AnimatePresence>
          </div>
        </div>
      </div>

      <div className="relative" ref={profileRef}>
        <motion.button 
          whileHover={{ scale: 1.02 }}
          onClick={() => setIsProfileOpen(!isProfileOpen)}
          className={`flex items-center gap-3 pl-4 p-1.5 pr-2 rounded-full border transition-all group shrink-0 ${isProfileOpen ? 'bg-black/5 border-black/10' : 'bg-black/[0.02] border-black/5'}`}
        >
          <div className="hidden sm:flex flex-col items-end leading-tight mr-1">
            <span className="text-[13px] font-bold tracking-tight text-slate-900">
              {user.fullName || "User"}
            </span>
            <span className="text-[9px] font-bold uppercase tracking-[0.1em] text-slate-400">
              ELITE MEMBER
            </span>
          </div>
          <div className="relative">
            <div className={`h-9 w-9 overflow-hidden rounded-full ring-2 transition-all ${isProfileOpen ? 'ring-[#5227FF]/40' : 'ring-black/5 group-hover:ring-[#5227FF]/20'}`}>
              <img
                alt="Profile"
                src={avatarSrc(user.avatar)}
                className="h-full w-full object-cover"
              />
            </div>
            <div className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full bg-[#00E87A] border-2 border-white shadow-sm" />
          </div>
          <ChevronDown className={`h-3.5 w-3.5 transition-all hidden sm:block ${isProfileOpen ? 'text-[#5227FF] rotate-180' : 'text-slate-300 group-hover:text-slate-500'}`} strokeWidth={3} />
        </motion.button>

        <AnimatePresence>
          {isProfileOpen && (
            <motion.div
              initial={{ opacity: 0, y: 12, scale: 0.98 }}
              animate={{ opacity: 1, y: 8, scale: 1 }}
              exit={{ opacity: 0, y: 12, scale: 0.98 }}
              className="absolute top-full right-0 w-64 p-2 rounded-[24px] bg-white border border-black/5 shadow-[0_20px_50px_rgba(0,0,0,0.1)] z-50 overflow-hidden"
            >
              <div className="p-4 border-b border-black/5 mb-1 sm:hidden">
                <p className="text-sm font-bold text-slate-900">{user.fullName}</p>
                <p className="text-[11px] font-medium text-slate-400 mt-0.5">{user.email}</p>
              </div>
              <Link
                href="/profile"
                className="flex items-center gap-3 w-full p-3.5 rounded-2xl hover:bg-slate-50 text-slate-700 transition-all font-bold text-sm group"
                onClick={() => setIsProfileOpen(false)}
              >
                <div className="h-9 w-9 flex items-center justify-center rounded-xl bg-slate-100 group-hover:bg-[#5227FF]/10 group-hover:text-[#5227FF] transition-all">
                   <User className="h-4 w-4" />
                </div>
                Manage Profile
              </Link>
              
              <button
                onClick={logout}
                className="flex items-center gap-3 w-full p-3.5 rounded-2xl hover:bg-red-50 text-red-500 transition-all font-bold text-sm group"
              >
                <div className="h-9 w-9 flex items-center justify-center rounded-xl bg-red-50 group-hover:bg-red-100 transition-all">
                  <LogOut className="h-4 w-4" />
                </div>
                Sign Out
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.header>
  );
}
