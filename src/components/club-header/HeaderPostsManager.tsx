"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { Pencil, Trash2, Loader2, RefreshCw } from "lucide-react";

type Row = {
  id: string;
  caption: string | null;
  content: string | null;
  imageUrl: string | null;
  type: string;
  createdAt: string;
};

export function HeaderPostsManager() {
  const [posts, setPosts] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [caption, setCaption] = useState("");
  const [content, setContent] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/posts/manage", { credentials: "include" });
      if (!res.ok) throw new Error("load");
      const data = (await res.json()) as { posts: Row[] };
      setPosts(data.posts);
    } catch {
      toast.error("Could not load your posts");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const openEdit = (p: Row) => {
    setEditingId(p.id);
    setCaption(p.caption || "");
    setContent(p.content || "");
    setImageUrl(p.imageUrl || "");
  };

  const closeEdit = () => {
    setEditingId(null);
  };

  const saveEdit = async () => {
    if (!editingId) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/posts/${editingId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          caption: caption || null,
          content: content || null,
          imageUrl: imageUrl.trim() || "",
        }),
      });
      if (!res.ok) {
        const err = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(err.error || `Save failed (${res.status})`);
      }
      toast.success("Post updated");
      closeEdit();
      await load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not save changes");
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id: string) => {
    if (!confirm("Delete this post permanently?")) return;
    try {
      const res = await fetch(`/api/posts/${id}`, { method: "DELETE", credentials: "include" });
      if (!res.ok) throw new Error();
      toast.success("Post deleted");
      setPosts((prev) => prev.filter((x) => x.id !== id));
      if (editingId === id) closeEdit();
    } catch {
      toast.error("Delete failed");
    }
  };

  return (
    <div className="rounded-[2rem] border border-white/[0.06] bg-white/[0.02] p-6 md:p-8">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-white/40">Library</p>
          <h2 className="mt-1 text-xl font-semibold text-white">Your published posts</h2>
          <p className="mt-1 text-sm text-white/45">Edit copy or image URL, or delete. New uploads use R2 from the composer above.</p>
        </div>
        <button
          type="button"
          onClick={() => void load()}
          disabled={loading}
          className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/80 transition hover:bg-white/10 disabled:opacity-50"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-[#8C6DFD]" />
        </div>
      ) : posts.length === 0 ? (
        <p className="py-12 text-center text-sm text-white/40">No posts yet. Create one above.</p>
      ) : (
        <ul className="space-y-3">
          {posts.map((p) => (
            <li
              key={p.id}
              className="flex flex-col gap-3 rounded-2xl border border-white/[0.06] bg-black/20 p-4 sm:flex-row sm:items-stretch"
            >
              <div className="h-24 w-full shrink-0 overflow-hidden rounded-xl bg-black/40 sm:h-20 sm:w-20">
                {p.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={p.imageUrl} alt="" className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full items-center justify-center text-[10px] text-white/30">No image</div>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="line-clamp-2 text-sm text-white/85">{p.caption || p.content || "—"}</p>
                <p className="mt-1 text-[10px] font-medium uppercase tracking-wider text-white/35">
                  {p.type} · {formatDistanceToNow(new Date(p.createdAt), { addSuffix: true })}
                </p>
              </div>
              <div className="flex shrink-0 gap-2 sm:flex-col">
                <button
                  type="button"
                  onClick={() => openEdit(p)}
                  className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl border border-[#5227FF]/40 bg-[#5227FF]/10 px-3 py-2 text-xs font-semibold text-[#C4B5FD] transition hover:bg-[#5227FF]/20 sm:flex-none"
                >
                  <Pencil className="h-3.5 w-3.5" />
                  Edit
                </button>
                <button
                  type="button"
                  onClick={() => remove(p.id)}
                  className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs font-semibold text-red-300 transition hover:bg-red-500/20 sm:flex-none"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Delete
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      {editingId ? (
        <div className="fixed inset-0 z-[300] flex items-end justify-center bg-black/70 p-4 sm:items-center">
          <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-white/10 bg-[#0d1024] p-6 shadow-2xl">
            <h3 className="text-lg font-semibold text-white">Edit post</h3>
            <p className="mt-1 text-xs text-white/45">
            Image: full https URL (e.g. Cloudinary) or a path starting with / (e.g. /uploads/… from local dev).
          </p>
            <label className="mt-4 block text-[10px] font-semibold uppercase tracking-wider text-white/40">Caption</label>
            <textarea
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              rows={3}
              className="mt-1 w-full rounded-xl border border-white/10 bg-black/40 p-3 text-sm text-white outline-none focus:border-[#5227FF]/50"
            />
            <label className="mt-3 block text-[10px] font-semibold uppercase tracking-wider text-white/40">Content</label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={4}
              className="mt-1 w-full rounded-xl border border-white/10 bg-black/40 p-3 text-sm text-white outline-none focus:border-[#5227FF]/50"
            />
            <label className="mt-3 block text-[10px] font-semibold uppercase tracking-wider text-white/40">Image URL</label>
            <input
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              placeholder="https://..."
              className="mt-1 w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2.5 text-sm text-white outline-none focus:border-[#5227FF]/50"
            />
            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                onClick={closeEdit}
                className="rounded-xl px-4 py-2 text-sm text-white/60 hover:bg-white/5"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={saving}
                onClick={() => void saveEdit()}
                className="rounded-xl bg-gradient-to-r from-[#5227FF] to-[#2B4BFF] px-6 py-2 text-sm font-semibold text-white disabled:opacity-50"
              >
                {saving ? "Saving…" : "Save"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
