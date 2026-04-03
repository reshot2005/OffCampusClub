"use client";

import { 
  Heart, 
  MessageCircle, 
  Share2, 
  Bookmark, 
  MoreHorizontal,
  BadgeCheck,
  Zap,
  Trash2,
  Flag
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useRef, useEffect } from "react";
import { avatarSrc } from "@/lib/avatar";
import { pusherClient } from "@/lib/pusher";

export type OCCPost = {
  id: string;
  username: string;
  userAvatarUrl: string;
  timestamp: string;
  caption: string;
  imageUrl: string;
  likeCount: number;
  sharesCount?: number;
  clubId?: string;
  clubName?: string;
  commentsCount?: number;
};

export function OCCPostCard({ post }: { post: OCCPost }) {
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(post.likeCount);
  const [sharesCount, setSharesCount] = useState(post.sharesCount || 0);
  const [saved, setSaved] = useState(false);
  
  const [isLandscape, setIsLandscape] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [imgError, setImgError] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  // Comments state
  const [isCommentsOpen, setIsCommentsOpen] = useState(false);
  const [comments, setComments] = useState<any[]>([]);
  const [commentText, setCommentText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // REALTIME - Listening for likes, shares, AND comments
  useEffect(() => {
    if (!pusherClient || !post.clubId) return;

    const channel = pusherClient.subscribe(`club-${post.clubId}`);
    if (channel) {
      channel.bind("new-like", (data: { postId: string; likesCount: number }) => {
        if (data.postId === post.id) setLikeCount(data.likesCount);
      });

      channel.bind("new-share", (data: { postId: string; sharesCount: number }) => {
        if (data.postId === post.id) setSharesCount(data.sharesCount);
      });

      channel.bind("new-comment", (data: { postId: string; comment: any }) => {
        if (data.postId === post.id) {
          setComments(prev => [...prev, data.comment]);
        }
      });
    }

    return () => {
      pusherClient?.unsubscribe(`club-${post.clubId}`);
    };
  }, [post.id, post.clubId]);

  const handleImageLoad = () => {
    if (imgRef.current) {
      const { naturalWidth, naturalHeight } = imgRef.current;
      setIsLandscape(naturalWidth > naturalHeight * 1.15);
      setIsLoaded(true);
    }
  };

  const handleImageError = () => {
    setIsLoaded(true);
    setIsLandscape(true);
    setImgError(true);
  };

  const toggleLike = async () => {
    const prevLiked = liked;
    const prevCount = likeCount;
    setLiked(!liked);
    setLikeCount(liked ? likeCount - 1 : likeCount + 1);

    try {
      const res = await fetch(`/api/posts/${post.id}/like`, { method: "POST" });
      const data = await res.json();
      if (data.likesCount !== undefined) setLikeCount(data.likesCount);
    } catch (e) {
      setLiked(prevLiked);
      setLikeCount(prevCount);
    }
  };

  const handleShare = async () => {
    setSharesCount(prev => prev + 1);
    try {
      const res = await fetch(`/api/posts/${post.id}/share`, { method: "POST" });
      const data = await res.json();
      if (data.sharesCount !== undefined) setSharesCount(data.sharesCount);
    } catch (e) {}
  };

  const fetchComments = async () => {
    try {
      const res = await fetch(`/api/posts/${post.id}/comment`);
      const data = await res.json();
      if (Array.isArray(data)) setComments(data);
    } catch (e) {
      console.error("Failed to fetch comments");
    }
  };

  useEffect(() => {
    if (isCommentsOpen) fetchComments();
  }, [isCommentsOpen]);

  const handleAddComment = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!commentText.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/posts/${post.id}/comment`, {
        method: "POST",
        body: JSON.stringify({ content: commentText.trim() })
      });
      if (res.ok) {
        setCommentText("");
        if (!isCommentsOpen) setIsCommentsOpen(true);
      }
    } catch (e) {
      console.error("Failed to post comment");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!confirm("Remove this intellectual block? This action is permanent and logged for Admin review.")) return;
    try {
      const res = await fetch(`/api/comments/${commentId}`, { method: "DELETE" });
      if (res.ok) {
        setComments(prev => prev.filter(c => c.id !== commentId));
      }
    } catch (e) {}
  };

  const handleReportComment = async (commentId: string) => {
    const reason = prompt("Enter the reason for flag (Harassment, Profanity, Spam):");
    if (!reason) return;
    try {
      await fetch(`/api/comments/${commentId}/report`, {
        method: "POST",
        body: JSON.stringify({ reason })
      });
      alert("Comment flagged. Our Elite Safety team will review the intel shortly.");
    } catch (e) {}
  };

  return (
    <motion.article 
      layout
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      className="group relative overflow-hidden sm:rounded-[2rem] border-y sm:border border-black/[0.04] bg-white shadow-[0_30px_70px_-20px_rgba(0,0,0,0.08)] mb-4 sm:mb-10 max-w-full sm:max-w-[950px] mx-auto w-full transition-all duration-700"
    >
      <div className={`flex flex-col ${isLandscape ? 'flex-col' : 'lg:flex-row'} transition-all duration-700`}>
        
        {/* MEDIA SEGMENT - CINEMATIC FOCUS */}
        <div className={`relative flex-1 bg-[#121212] flex items-center justify-center overflow-hidden transition-all duration-700 ${isLandscape ? 'h-auto max-h-[400px] sm:max-h-[500px]' : 'lg:max-w-[500px] min-h-[250px] sm:min-h-[300px]'}`}>
          {!imgError && (
            <div 
              className="absolute inset-0 opacity-25 blur-[60px] scale-150 pointer-events-none transition-opacity duration-1000"
              style={{ 
                backgroundImage: `url(${post.imageUrl})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                opacity: isLoaded ? 0.15 : 0
              }}
            />
          )}
          
          {imgError ? (
            <div
              className="relative z-10 flex h-[200px] sm:h-[280px] w-full items-center justify-center bg-gradient-to-br from-[#5227FF]/20 via-[#121212] to-[#D4AF37]/20"
              onDoubleClick={toggleLike}
            >
              <span className="text-[11px] sm:text-[13px] font-medium uppercase tracking-[0.2em] text-white/20">
                {post.clubName || "OCC"}
              </span>
            </div>
          ) : (
            <motion.img 
              ref={imgRef}
              src={post.imageUrl} 
              alt="" 
              onLoad={handleImageLoad}
              onError={handleImageError}
              className={`relative z-10 transition-all duration-1000 ease-out ${isLoaded ? 'scale-100 opacity-100' : 'opacity-100'} ${isLandscape ? 'w-full h-auto object-cover max-h-[400px] sm:max-h-[500px]' : 'w-full h-full object-cover max-h-[500px] sm:max-h-[600px] lg:max-h-[650px]'}`}
              onDoubleClick={toggleLike}
            />
          )}

          <AnimatePresence>
            {liked && (
              <motion.div 
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1.1, opacity: 1 }}
                exit={{ scale: 0, opacity: 0 }}
                className="absolute inset-0 flex items-center justify-center pointer-events-none z-30"
              >
                <Heart className="h-16 w-16 text-white/50 fill-white/50 drop-shadow-2xl" />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* INTELLECTUAL SEGMENT - TEXT & COMMENTS */}
        <div className={`flex flex-col bg-white p-5 sm:p-8 lg:p-10 transition-all duration-700 ${isLandscape ? 'w-full' : 'lg:w-[420px] shrink-0 border-l border-black/[0.03]'}`}>
          
          {/* Identity Header */}
          <div className="flex items-center justify-between mb-4 sm:mb-6 pb-4 sm:pb-6 border-b border-black/[0.04]">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="h-8 w-8 sm:h-10 sm:w-10 overflow-hidden rounded-full ring-1 ring-black/5">
                <img src={post.userAvatarUrl} className="h-full w-full object-cover" />
              </div>
              <div className="flex flex-col gap-0.5">
                <div className="flex items-center gap-1.5">
                  <span className="text-[13px] sm:text-[14px] font-semibold text-black tracking-tight font-sans">{post.username}</span>
                  <BadgeCheck className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-[#5227FF]" fill="#5227FF" />
                </div>
                <span className="text-[9px] sm:text-[10px] font-semibold text-black/30 uppercase tracking-[0.1em] font-sans">{post.timestamp} • {post.clubName || "OCC"}</span>
              </div>
            </div>
            <button className="p-2 rounded-xl hover:bg-black/[0.03] text-black/20 transition-all">
              <MoreHorizontal className="h-4 w-4" />
            </button>
          </div>

          {/* Animated Transition between Caption and Comments */}
          <div className="flex-1 space-y-4 sm:space-y-6 overflow-y-auto scrollbar-hide max-h-[350px] sm:max-h-[450px]">
             <AnimatePresence mode="wait">
              {!isCommentsOpen ? (
                <motion.div 
                  key="caption"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                  className="space-y-3 sm:space-y-4"
                >
                  <h4 className="font-serif italic text-[1.5rem] sm:text-[1.75rem] text-black/90 leading-[1.2] tracking-normal mb-1 sm:mb-2 text-balance">
                    {post.caption ? post.caption.split('.')[0] + '.' : "Editorial Statement."}
                  </h4>
                  <p className="text-[13.5px] sm:text-[14.5px] font-medium leading-relaxed text-black/50 font-sans whitespace-pre-wrap">
                    {post.caption || "No description provided."}
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {['Elite', 'Direct', 'Intel'].map(tag => (
                      <span key={tag} className="px-2.5 py-1 rounded-full border border-black/[0.04] bg-black/[0.01] text-[8px] sm:text-[9px] font-medium uppercase tracking-[0.15em] text-black/30 font-sans">
                        #{tag}
                      </span>
                    ))}
                  </div>
                </motion.div>
              ) : (
                <motion.div 
                  key="comments"
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  className="space-y-5 sm:space-y-6"
                >
                  <div className="flex items-center justify-between sticky top-0 bg-white/95 backdrop-blur-md py-2 z-10">
                    <h5 className="text-[10px] sm:text-[11px] font-medium uppercase tracking-[0.2em] text-black/30">Community Intel • {comments.length}</h5>
                    <button onClick={() => setIsCommentsOpen(false)} className="text-[9px] sm:text-[10px] font-medium text-[#5227FF] uppercase tracking-widest hover:underline p-1">Close x</button>
                  </div>
                  
                  {comments.length === 0 ? (
                    <div className="py-12 sm:py-20 text-center">
                      <p className="text-[12px] sm:text-[13px] font-medium text-black/10">No perspectives shared yet.</p>
                    </div>
                  ) : (
                    <div className="space-y-5 sm:space-y-6">
                      {comments.map((comment) => (
                        <div key={comment.id} className="group/comment">
                          <div className="flex gap-3 sm:gap-4">
                            <img src={avatarSrc(comment.user.avatar)} alt="" className="h-8 w-8 sm:h-10 sm:w-10 rounded-full object-cover shrink-0 ring-1 ring-black/5" />
                            <div className="flex-1 flex flex-col gap-1 sm:gap-1.5">
                              <div className="flex items-center justify-between">
                                <span className="text-[11px] sm:text-[12px] font-semibold text-black">{comment.user.fullName}</span>
                                <div className="flex items-center gap-1 opacity-0 group-hover/comment:opacity-100 transition-all">
                                  <button onClick={() => handleDeleteComment(comment.id)} className="p-1 px-1.5 rounded-lg text-red-500 hover:bg-red-50 transition-colors">
                                    <Trash2 className="h-3 w-3" />
                                  </button>
                                  <button onClick={() => handleReportComment(comment.id)} className="p-1 px-1.5 rounded-lg text-black/20 hover:text-black hover:bg-black/5 transition-colors">
                                    <Flag className="h-3 w-3" />
                                  </button>
                                </div>
                              </div>
                              
                              {(comment.user.email || comment.user.phoneNumber) && (
                                <div className="bg-[#5227FF]/[0.03] p-2.5 sm:p-3 rounded-xl border border-[#5227FF]/10 shadow-sm animate-in fade-in zoom-in-95 duration-500">
                                  <div className="flex items-center gap-2 mb-0.5 sm:mb-1">
                                    <Zap className="h-2.5 w-2.5 sm:h-3 sm:w-3 text-[#5227FF]" fill="currentColor" />
                                    <span className="text-[8px] sm:text-[9px] font-semibold uppercase tracking-[0.2em] text-[#5227FF]">Moderator Intel</span>
                                  </div>
                                  {comment.user.email && <div className="text-[10px] sm:text-[11px] font-medium text-black/80">{comment.user.email}</div>}
                                  {comment.user.phoneNumber && <div className="text-[10px] sm:text-[11px] font-medium text-black/40 mt-0.5">{comment.user.phoneNumber}</div>}
                                </div>
                              )}

                              <p className="text-[12.5px] sm:text-[13.5px] font-medium leading-relaxed text-black/60 font-sans">
                                {comment.content}
                              </p>
                              <span className="text-[9px] sm:text-[10px] font-medium text-black/20 uppercase tracking-tighter">
                                {new Date(comment.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </motion.div>
              )}
             </AnimatePresence>
          </div>

          {/* Interaction Hub */}
          <div className="mt-6 sm:mt-8 pt-6 sm:pt-8 border-t border-black/[0.05]">
            <div className="flex items-center justify-between mb-5 sm:mb-6">
              <div className="flex items-center gap-4 sm:gap-6">
                <button onClick={toggleLike} className="flex items-center gap-1.5 sm:gap-2 group">
                  <Heart className={`h-5 w-5 sm:h-6 sm:w-6 transition-all ${liked ? 'text-[#FF3040] fill-[#FF3040]' : 'text-black/20 group-hover:text-[#FF3040]'}`} strokeWidth={2.4} />
                  <span className="text-[12px] sm:text-[13px] font-semibold text-black/80 font-sans">{likeCount}</span>
                </button>
                <button 
                  onClick={() => setIsCommentsOpen(!isCommentsOpen)} 
                  className={`flex items-center gap-1.5 sm:gap-2 group transition-all ${isCommentsOpen ? 'scale-110' : 'scale-100'}`}
                >
                  <MessageCircle className={`h-5 w-5 sm:h-6 sm:w-6 transition-all ${isCommentsOpen ? 'text-[#5227FF] fill-[#5227FF]/10' : 'text-black/20 group-hover:text-[#5227FF]'}`} strokeWidth={2.4} />
                  <span className="text-[12px] sm:text-[13px] font-semibold text-black/80 font-sans">{comments.length || post.commentsCount || 0}</span>
                </button>
              </div>
              <div className="flex items-center gap-1.5 sm:gap-2">
                <button onClick={handleShare} className="p-2 sm:p-2.5 rounded-xl text-black/10 hover:text-black bg-black/[0.02] transition-all flex items-center gap-2 border border-black/[0.03]">
                  <Share2 className="h-4 w-4 sm:h-5 sm:w-5" />
                  {sharesCount > 0 && <span className="text-[10px] sm:text-[11px] font-semibold">{sharesCount}</span>}
                </button>
                <button onClick={() => setSaved(!saved)} className="p-2 sm:p-2.5 rounded-xl text-black/10 transition-all bg-black/[0.02] border border-black/[0.03]">
                  <Bookmark className={`h-4 w-4 sm:h-5 sm:w-5 ${saved ? 'text-black fill-black' : 'text-black/10'}`} />
                </button>
              </div>
            </div>

            <form onSubmit={handleAddComment} className="relative group/input">
              <input 
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                type="text" 
                placeholder={isSubmitting ? "Broadcasting..." : "Share perspective..."}
                disabled={isSubmitting}
                className="w-full h-12 sm:h-14 rounded-[1.25rem] bg-black/[0.03] border-2 border-transparent px-5 sm:px-6 pr-20 text-[13px] sm:text-[14px] font-normal text-black outline-none placeholder:text-black/20 focus:bg-white focus:border-[#5227FF]/20 transition-all shadow-inner focus:shadow-none"
              />
              <button 
                type="submit"
                disabled={!commentText.trim() || isSubmitting}
                className="absolute right-2 top-1/2 -translate-y-1/2 h-8 sm:h-10 px-4 sm:px-6 rounded-xl bg-[#5227FF] !text-white text-[10px] sm:text-[11px] font-semibold uppercase tracking-widest opacity-0 group-focus-within:opacity-100 disabled:opacity-0 transition-all shadow-lg active:scale-95"
              >
                Post
              </button>
            </form>
          </div>
        </div>
      </div>
    </motion.article>

  );
}
