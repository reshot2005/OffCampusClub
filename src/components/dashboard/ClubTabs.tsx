"use client";

import * as React from "react";
import { ApplyGigButton } from "@/components/dashboard/ApplyGigButton";
import { EventCard } from "@/components/dashboard/EventCard";
import { FeedCard } from "@/components/dashboard/FeedCard";
import { GigCard } from "@/components/dashboard/GigCard";
import { RegisterEventButton } from "@/components/dashboard/RegisterEventButton";
import { cn } from "@/app/components/ui/utils";
import { motion } from "framer-motion";

const tabs = ["Feed", "Events", "Gigs"] as const;
type TabKey = (typeof tabs)[number];

type ClubTabsProps = {
  posts: Array<{
    id: string;
    imageUrl: string;
    imageUrls?: string[];
    caption?: string | null;
    likes: number;
    club: { name: string; icon: string };
    user: { fullName: string };
  }>;
  events: Array<{
    id: string;
    title: string;
    description: string;
    venue: string;
    date: Date | string;
    imageUrl?: string | null;
    club?: { name: string; icon: string } | null;
    price?: number;
    registered?: boolean;
  }>;
  gigs: Array<{
    id: string;
    title: string;
    description: string;
    payMin: number;
    payMax: number;
    deadline?: Date | string | null;
    applied?: boolean;
  }>;
};

export function ClubTabs({ posts, events, gigs }: ClubTabsProps) {
  const [active, setActive] = React.useState<TabKey>("Feed");

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-8 border-b border-black/5 pb-0">
        {tabs.map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setActive(tab)}
            className={cn(
              "pb-4 text-[12px] font-black uppercase tracking-[0.3em] transition-all relative",
              active === tab 
                ? "text-[#5227FF]" 
                : "text-slate-400 hover:text-slate-600"
            )}
          >
            {tab}
            {active === tab && (
              <motion.div 
                layoutId="club-nav-underline"
                className="absolute bottom-0 left-0 right-0 h-[3px] bg-[#5227FF] rounded-t-full"
              />
            )}
          </button>
        ))}
      </div>

      <div className="pt-8">
        {active === "Feed" ? (
          <div className="flex flex-col gap-8 max-w-4xl mx-auto">
            {posts.map((post) => (
              <FeedCard key={post.id} post={post} />
            ))}
          </div>
        ) : null}

        {active === "Events" ? (
          <div className="grid gap-6 lg:grid-cols-2">
            {events.map((event) => (
              <div key={event.id} className="relative group">
                <EventCard
                  event={event}
                  action={<RegisterEventButton eventId={event.id} registered={!!event.registered} />}
                />
              </div>
            ))}
          </div>
        ) : null}

        {active === "Gigs" ? (
          <div className="grid gap-6 lg:grid-cols-2">
            {gigs.map((gig) => (
              <GigCard
                key={gig.id}
                gig={gig}
                action={<ApplyGigButton gigId={gig.id} applied={!!gig.applied} />}
              />
            ))}
          </div>
        ) : null}
      </div>
    </div>
  );
}
