"use client";

import { Bell, Search, ChevronDown, Sparkles, LayoutGrid, User, LogOut } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { avatarSrc } from "@/lib/avatar";
import { useLogout } from "@/hooks/useLogout";

export function OCCHeader({ user }: { user: any }) {
  const [isFocused, setIsFocused] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const router = useRouter();
  const logout = useLogout();
  const profileRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setIsProfileOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSearch = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && searchQuery.trim()) {
      router.push(`/explore?q=${encodeURIComponent(searchQuery)}`);
    }
  };

  return (
    <motion.header 
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex shrink-0 items-center justify-between px-4 sm:px-5 lg:px-6 py-4 sm:py-5 bg-white/80 backdrop-blur-3xl z-40 w-full border-b border-black/[0.03] sticky top-0 shadow-sm"
    >
      {/* Premium Search Section */}
      <div className="mr-2 flex max-w-md flex-1 items-center sm:mr-3 lg:max-w-lg xl:max-w-xl">
        <div className={`relative w-full transition-all duration-500 ease-out ${isFocused ? 'scale-[1.02]' : 'scale-100'}`}>
          <div className={`absolute -inset-0.5 rounded-2xl bg-gradient-to-r from-[#5227FF] via-[#D4AF37] to-[#8C6DFD] opacity-0 blur transition-all duration-500 ${isFocused ? 'opacity-20' : 'opacity-0'}`} />
          <div className="relative flex items-center">
            <Search className={`pointer-events-none absolute left-4 sm:left-6 h-4 sm:h-5 w-4 sm:w-5 transition-colors duration-300 ${isFocused ? 'text-[#D4AF37]' : 'text-black/40'}`} strokeWidth={3} />
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={handleSearch}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              placeholder="Search..."
              className="h-10 sm:h-14 w-full rounded-2xl bg-black/[0.03] border border-black/5 px-10 sm:px-15 text-[13px] sm:text-[15px] font-normal text-black outline-none placeholder:text-black/30 focus:bg-white focus:shadow-[0_20px_50px_rgba(0,0,0,0.05)] transition-all duration-500"
            />
            <div className="absolute right-5 hidden sm:flex items-center gap-2 pointer-events-none">
              <kbd className="inline-flex h-6 items-center gap-1 rounded-lg border border-black/10 bg-white px-2 font-mono text-[11px] font-medium text-black/30 shadow-sm">
                <span className="text-sm">⌘</span>K
              </kbd>
            </div>
          </div>
        </div>
      </div>

      {/* Action Items - High-End Layout */}
      <div className="flex items-center gap-2 sm:gap-4">
        <div className="hidden lg:flex items-center gap-2 bg-black/[0.02] p-1.5 rounded-3xl border border-black/5 mr-4 shadow-inner">
          <button className="relative p-3 rounded-2xl bg-white shadow-sm border border-black/5 text-black hover:scale-105 active:scale-95 transition-all group overflow-hidden">
            <Bell className="h-5 w-5" strokeWidth={2.5} />
            <span className="absolute top-3 right-3 flex h-2.5 w-2.5 rounded-full bg-[#5227FF] ring-4 ring-white shadow-lg"></span>
          </button>
          
          <button className="p-3 rounded-2xl hover:bg-black/10 text-black/40 hover:text-black transition-all">
            <LayoutGrid className="h-5 w-5" strokeWidth={2.5} />
          </button>
        </div>

      {/* Profile Section */}
      <div className="relative" ref={profileRef}>
        <motion.button 
          whileHover={{ scale: 1.02 }}
          onClick={() => setIsProfileOpen(!isProfileOpen)}
          className={`flex items-center gap-2 sm:gap-4 pl-2 sm:pl-6 p-1 sm:p-2 pr-2 rounded-[2rem] border transition-all group shrink-0 ${isProfileOpen ? 'bg-black/[0.03] border-[#5227FF]/20 shadow-inner' : 'bg-white border-black/5 shadow-sm'}`}
        >
          <div className="hidden sm:flex flex-col items-end leading-none">
            <div className="flex items-center gap-1.5">
              <span className="text-[14px] sm:text-[15px] font-semibold tracking-tight text-slate-900">
                {user.fullName || "User"}
              </span>
              <Sparkles className="h-3 w-3 shrink-0 text-[#5227FF]" fill="currentColor" />
            </div>
            <span className="mt-0.5 text-[9px] sm:text-[10px] font-medium uppercase tracking-[0.2em] text-slate-500">
              Elite Member
            </span>
          </div>
          <div className="relative">
            <div className={`h-8 w-8 sm:h-12 sm:w-12 overflow-hidden rounded-full ring-2 shadow-lg transition-all ${isProfileOpen ? 'ring-[#5227FF]/50' : 'ring-white group-hover:ring-[#5227FF]/20'}`}>
              <img
                alt="Profile"
                src={avatarSrc(user.avatar)}
                className="h-full w-full object-cover"
              />
            </div>
            <div className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full bg-[#00E87A] border-2 border-white shadow-lg" />
          </div>
          <ChevronDown className={`h-4 w-4 transition-all hidden sm:block ${isProfileOpen ? 'text-[#5227FF] rotate-180' : 'text-black/10 group-hover:text-black/30'}`} strokeWidth={3} />
        </motion.button>

        {/* PROFILE DROPDOWN */}
        <AnimatePresence>
          {isProfileOpen && (
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 5, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              className="absolute top-full right-0 mt-3 w-56 p-2 rounded-2xl bg-white/95 backdrop-blur-3xl border border-black/5 shadow-[0_20px_50px_rgba(0,0,0,0.1)] z-50"
            >
              <div className="p-3 border-b border-black/5 mb-1 sm:hidden">
                <p className="text-sm font-semibold text-black">{user.fullName}</p>
                <p className="text-[10px] font-medium text-black/40 uppercase tracking-wider">{user.email}</p>
              </div>
              <Link
                href="/profile"
                className="flex items-center gap-3 w-full p-3 rounded-xl hover:bg-black/[0.04] text-black transition-all font-medium text-sm"
                onClick={() => setIsProfileOpen(false)}
              >
                <User className="h-4 w-4" />
                Edit profile
              </Link>
              <button
                onClick={logout}
                className="flex items-center gap-3 w-full p-3 rounded-xl hover:bg-red-50 text-red-500 transition-all font-medium text-sm"
              >
                <LogOut className="h-4 w-4" />
                Sign Out
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      </div>
    </motion.header>
  );
}

