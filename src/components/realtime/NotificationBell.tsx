"use client";

import { useEffect, useMemo, useState } from "react";
import { Bell } from "lucide-react";
import { motion } from "motion/react";
import { pusherClient } from "@/lib/pusher";

type NotificationItem = {
  id: string;
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
};

export function NotificationBell({
  userId,
  initialNotifications,
}: {
  userId: string;
  initialNotifications: NotificationItem[];
}) {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<NotificationItem[]>(initialNotifications);
  const unread = useMemo(() => items.filter((n) => !n.read).length, [items]);

  useEffect(() => {
    if (!pusherClient || !userId) return;
    const client = pusherClient;
    const channelName = `user-${userId}`;
    const channel = client.subscribe(channelName);
    channel.bind("approved", (data: { message: string }) => {
      setItems((prev) => [
        {
          id: crypto.randomUUID(),
          title: "Application update",
          message: data.message,
          read: false,
          createdAt: new Date().toISOString(),
        },
        ...prev,
      ]);
    });
    channel.bind("rejected", (data: { reason: string }) => {
      setItems((prev) => [
        {
          id: crypto.randomUUID(),
          title: "Application update",
          message: data.reason,
          read: false,
          createdAt: new Date().toISOString(),
        },
        ...prev,
      ]);
    });
    return () => {
      channel.unbind_all();
      client.unsubscribe(channelName);
    };
  }, [userId]);

  useEffect(() => {
    if (!pusherClient) return;
    const client = pusherClient;
    const adminChannelName = "admin-global";
    const adminChannel = client.subscribe(adminChannelName);
    adminChannel.bind(
      "intel-report",
      (data: { title?: string; message?: string; createdAt?: string }) => {
        setItems((prev) => [
          {
            id: crypto.randomUUID(),
            title: data.title || "Intel report",
            message: data.message || "A new comment report was submitted.",
            read: false,
            createdAt: data.createdAt || new Date().toISOString(),
          },
          ...prev,
        ]);
      },
    );
    return () => {
      adminChannel.unbind("intel-report");
      client.unsubscribe(adminChannelName);
    };
  }, []);

  return (
    <div className="relative">
      <button onClick={() => setOpen((v) => !v)} className="relative rounded-full border border-[#C9A96E]/40 p-2">
        <motion.div animate={unread ? { rotate: [0, -12, 12, -8, 8, 0] } : { rotate: 0 }}>
          <Bell className="h-5 w-5 text-[#C9A96E]" />
        </motion.div>
        {unread > 0 ? (
          <span className="absolute -right-1 -top-1 rounded-full bg-[#C9A96E] px-1.5 text-[10px] text-black">{unread}</span>
        ) : null}
      </button>
      {open ? (
        <div className="absolute right-0 mt-2 w-80 rounded-xl border border-[#C9A96E]/30 bg-[#151513] p-3 shadow-xl">
          <div className="mb-2 text-xs uppercase tracking-widest text-[#C9A96E]">Notifications</div>
          <div className="max-h-72 space-y-2 overflow-auto">
            {items.slice(0, 10).map((n) => (
              <div key={n.id} className="rounded-lg bg-white/5 p-2">
                <p className="text-sm text-white">{n.title}</p>
                <p className="text-xs text-white/70">{n.message}</p>
              </div>
            ))}
          </div>
          <button
            className="mt-3 w-full rounded-md border border-[#C9A96E]/40 py-1 text-xs text-[#C9A96E]"
            onClick={() => setItems((prev) => prev.map((n) => ({ ...n, read: true })))}
          >
            Mark all read
          </button>
        </div>
      ) : null}
    </div>
  );
}
