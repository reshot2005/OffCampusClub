"use client";

import * as React from "react";
import { Heart, MessageCircle, Share2, MoreHorizontal, Bookmark } from "lucide-react";
import { resolveClubAvatar } from "@/lib/postImageUrl";
import { formatSocialCount } from "@/lib/socialDisplay";
import { cn } from "@/app/components/ui/utils";

type FeedCardProps = {
  post: {
    imageUrl: string;
    imageUrls?: string[];
    caption?: string | null;
    likes: number;
    club: { name: string; icon: string };
    user: { fullName: string; avatar?: string };
    createdAt?: string;
  };
};

export function FeedCard({ post }: FeedCardProps) {
  const [liked, setLiked] = React.useState(false);
  const [activeImage, setActiveImage] = React.useState(0);
  const displayLikes = (post.likes || 1240) + (liked ? 1 : 0);
  const media = React.useMemo(() => {
    const list = (post.imageUrls || []).filter(Boolean);
    if (list.length > 0) return list;
    return [post.imageUrl];
  }, [post.imageUrl, post.imageUrls]);

  React.useEffect(() => {
    setActiveImage(0);
  }, [post.imageUrl, post.imageUrls]);
  
  return (
    <div className="mx-auto w-full max-w-[850px] overflow-hidden rounded-[32px] bg-white border border-black/5 shadow-[0_10px_40px_rgb(0,0,0,0.04)] transition-all hover:shadow-[0_20px_60px_rgb(0,0,0,0.07)] group mb-10">
      <div className="flex flex-col md:flex-row min-h-[460px]">
        
        {/* Left: Media Column */}
        <div className="w-full md:w-[55%] relative aspect-square md:aspect-auto overflow-hidden bg-slate-100">
          <img
            src={media[activeImage] || "https://images.unsplash.com/photo-1549490349-86ecf13d8650?w=800&q=80"}
            className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
            alt="Club Post"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          {media.length > 1 ? (
            <>
              <button
                type="button"
                onClick={() => setActiveImage((prev) => (prev === 0 ? media.length - 1 : prev - 1))}
                className="absolute left-3 top-1/2 -translate-y-1/2 rounded-full bg-black/55 px-2 py-1.5 text-xs font-bold text-white/90"
                aria-label="Previous image"
              >
                ‹
              </button>
              <button
                type="button"
                onClick={() => setActiveImage((prev) => (prev + 1) % media.length)}
                className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full bg-black/55 px-2 py-1.5 text-xs font-bold text-white/90"
                aria-label="Next image"
              >
                ›
              </button>
              <div className="absolute bottom-3 left-1/2 z-10 flex -translate-x-1/2 items-center gap-1.5 rounded-full bg-black/45 px-2 py-1">
                {media.map((_, idx) => (
                  <button
                    key={`dot-${idx}`}
                    type="button"
                    onClick={() => setActiveImage(idx)}
                    className={cn(
                      "h-1.5 w-1.5 rounded-full",
                      idx === activeImage ? "bg-white" : "bg-white/45",
                    )}
                    aria-label={`Open image ${idx + 1}`}
                  />
                ))}
              </div>
            </>
          ) : null}
        </div>

        {/* Right: Content & Engagement Column */}
        <div className="w-full md:w-[45%] flex flex-col p-6 lg:p-8">
          
          {/* Top: Header */}
          <div className="flex items-center justify-between pb-6 mb-6 border-b border-black/5">
            <div className="flex items-center gap-4">
              <div className="h-11 w-11 overflow-hidden rounded-2xl ring-2 ring-[#5227FF]/10 ring-offset-2 transition-transform hover:scale-110">
                <img 
                  src={resolveClubAvatar(post.user.avatar || post.club.icon, post.club.name)} 
                  className="h-full w-full object-cover" 
                  alt={post.club.name}
                />
              </div>
              <div>
                <p className="text-[14px] font-black text-slate-900 tracking-tight leading-none mb-1">
                  {post.user.fullName}
                  {post.club.name.toLowerCase().includes("fashion") && <span className="ml-1 text-[#5227FF]">●</span>}
                </p>
                <div className="flex items-center gap-2">
                   <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                     {post.club.name}
                   </p>
                   <span className="text-[10px] text-slate-300">•</span>
                   <p className="text-[10px] font-medium text-slate-400 capitalize">1h ago</p>
                </div>
              </div>
            </div>
            <button className="p-2 text-slate-400 hover:text-slate-900 transition-colors">
              <MoreHorizontal className="h-4 w-4" />
            </button>
          </div>

          {/* Middle: Caption Area */}
          <div className="flex-1 space-y-4">
            <p className="text-[15px] font-medium text-slate-800 leading-[1.7]">
              {post.caption || "Discover the essence of our community through this exclusive showcase."}
            </p>
            
            {post.club.name.toLowerCase().includes("fashion") && (
              <div className="flex flex-wrap gap-2 pt-2">
                {["#ELITE", "#DIRECT", "#FASHION"].map(tag => (
                  <span key={tag} className="px-2.5 py-1 rounded-lg bg-indigo-50 text-[10px] font-bold text-[#5227FF] tracking-wider uppercase">
                    {tag}
                  </span>
                ))}
              </div>
            )}
            
            <button className="text-[13px] font-bold text-slate-300 hover:text-[#5227FF] transition-colors pt-4">
              Read more
            </button>
          </div>

          {/* Bottom: Actions & Stats */}
          <div className="mt-auto pt-8 border-t border-black/5">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-6">
                <button 
                  onClick={() => setLiked(!liked)}
                  className="flex items-center gap-2 group active:scale-95 transition-transform"
                >
                  <Heart 
                    className={cn(
                      "h-6 w-6 transition-colors stroke-[2px]",
                      liked ? "fill-[#FF3040] text-[#FF3040]" : "text-slate-400 group-hover:text-[#FF3040]"
                    )} 
                  />
                  <span className={cn("text-[14px] font-black tracking-tight", liked ? "text-[#FF3040]" : "text-slate-900")}>
                    {formatSocialCount(displayLikes)}
                  </span>
                </button>

                <div className="flex items-center gap-2 group cursor-pointer">
                  <MessageCircle className="h-6 w-6 text-slate-400 group-hover:text-[#5227FF] transition-colors stroke-[2px]" />
                  <span className="text-[14px] font-black text-slate-900 tracking-tight">0</span>
                </div>
              </div>

              <div className="flex items-center gap-3">
                 <button className="p-2 hover:bg-slate-50 rounded-full transition-colors group">
                    <Share2 className="h-5 w-5 text-slate-400 group-hover:text-[#5227FF] transition-colors stroke-[2px]" />
                 </button>
                 <button className="p-2 hover:bg-slate-50 rounded-full transition-colors group">
                    <Bookmark className="h-5 w-5 text-slate-400 group-hover:text-amber-500 transition-colors stroke-[2px]" />
                 </button>
              </div>
            </div>
            
            <button className="mt-2 text-[11px] font-bold text-slate-400 hover:text-slate-600 transition-colors uppercase tracking-widest">
               View all 12 comments
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}
