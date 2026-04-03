"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";

function useDebouncedValue<T>(value: T, ms: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = window.setTimeout(() => setDebounced(value), ms);
    return () => window.clearTimeout(t);
  }, [value, ms]);
  return debounced;
}
import { OCCPostCard, type OCCPost } from "@/components/occ-dashboard/OCCPostCard";
import { resolvePostImageUrlForFeed } from "@/lib/postImageUrl";

function getTimeAgo(iso: string): string {
  const seconds = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d`;
  return `${Math.floor(days / 7)}w`;
}

type ApiPost = {
  id: string;
  caption: string | null;
  content: string | null;
  imageUrl: string | null;
  likesCount: number;
  sharesCount: number;
  createdAt: string;
  clubId: string;
  user: { id: string; fullName: string; avatar: string | null };
  club: { id: string; name: string; slug: string } | null;
};

function toCards(posts: ApiPost[]): OCCPost[] {
  return posts.map((p) => {
    const postImg = resolvePostImageUrlForFeed(p.imageUrl, p.club?.name || "");
    return {
      id: p.id,
      username: p.user.fullName,
      userAvatarUrl: p.user.avatar || "https://i.pravatar.cc/150?u=" + p.user.id,
      timestamp: getTimeAgo(p.createdAt),
      caption: p.caption || p.content || "",
      imageUrl: postImg,
      likeCount: p.likesCount,
      sharesCount: p.sharesCount,
      clubId: p.clubId,
      clubName: p.club?.name || "OCC Club",
      commentsCount: 0,
    };
  });
}

export function ExploreClient() {
  const searchParams = useSearchParams();
  const q = (searchParams.get("q") ?? "").trim();
  const debouncedQ = useDebouncedValue(q, 300);
  const [posts, setPosts] = useState<ApiPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const ac = new AbortController();
    setLoading(true);
    setError(null);
    (async () => {
      try {
        const res = await fetch(
          `/api/explore/posts?q=${encodeURIComponent(debouncedQ)}&limit=30`,
          {
            credentials: "include",
            signal: ac.signal,
          },
        );
        if (!res.ok) throw new Error("Failed to load");
        const data = (await res.json()) as { posts: ApiPost[] };
        if (!ac.signal.aborted) setPosts(data.posts);
      } catch (e) {
        if ((e as Error).name === "AbortError") return;
        setError("Could not load posts.");
        setPosts([]);
      } finally {
        if (!ac.signal.aborted) setLoading(false);
      }
    })();
    return () => ac.abort();
  }, [debouncedQ]);

  const cards = useMemo(() => toCards(posts), [posts]);

  return (
    <div className="flex flex-col gap-6 pb-28 lg:pb-10">
      <div className="px-4 sm:px-0">
        <h1 className="text-xl font-semibold tracking-tight text-slate-900 sm:text-2xl">Explore</h1>
        <p className="mt-1 max-w-xl text-xs text-slate-500">
          Results update as you type. Matches caption, post text, and club name or slug.
        </p>
      </div>

      <div className="flex flex-col gap-6 px-0">
        {error ? (
          <div className="rounded-2xl border border-red-100 bg-red-50 px-6 py-8 text-center text-sm text-red-700">{error}</div>
        ) : null}
        {loading && cards.length === 0 && !error ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-64 animate-pulse rounded-2xl bg-slate-200/60" />
            ))}
          </div>
        ) : null}
        {!loading && !error && cards.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-black/10 bg-white px-6 py-16 text-center text-sm text-slate-500">
            No posts match “{q || "your search"}”. Try another keyword or club name.
          </div>
        ) : null}
        {cards.map((p) => (
          <OCCPostCard key={p.id} post={p} />
        ))}
      </div>
    </div>
  );
}
