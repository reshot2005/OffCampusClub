"use client";

import { useState, useRef } from "react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { ImagePlus, Send, FileText, Megaphone, Camera, Calendar, X, Upload } from "lucide-react";

const postTypes = [
  { value: "post", label: "Update", icon: FileText },
  { value: "announcement", label: "Announcement", icon: Megaphone },
  { value: "photo", label: "Photo", icon: Camera },
  { value: "event", label: "Event", icon: Calendar },
];

export function PostComposer({ clubId }: { clubId: string }) {
  const [content, setContent] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [type, setType] = useState("post");
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files ? Array.from(e.target.files) : [];
    if (files.length === 0) return;
    if (files.length > 4) {
      toast.error("You can upload up to 4 photos per post");
      return;
    }

    for (const file of files) {
      if (!file.type.startsWith("image/")) {
        toast.error("Please select only image files");
        return;
      }
      if (file.size > 8 * 1024 * 1024) {
        toast.error("Each image must be under 8MB");
        return;
      }
    }

    const previews = await Promise.all(
      files.map(
        (file) =>
          new Promise<string>((resolve) => {
            const reader = new FileReader();
            reader.onload = (ev) => resolve((ev.target?.result as string) || "");
            reader.readAsDataURL(file);
          }),
      ),
    );
    setImagePreviews(previews.filter(Boolean));
    setImagePreview(previews[0] || null);

    setUploading(true);
    try {
      const uploaded: string[] = [];
      for (const file of files) {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("purpose", "posts");
        const res = await fetch("/api/upload", { method: "POST", body: formData });
        const data = (await res.json()) as { url?: string; error?: string; detail?: string; warning?: string };
        if (!res.ok) throw new Error(data.detail || data.error || "Upload failed");
        if (!data.url || typeof data.url !== "string") {
          throw new Error("Upload did not return an image URL");
        }
        uploaded.push(data.url);
        if (data.warning) toast.warning(data.warning, { duration: 8000 });
      }
      setImageUrls(uploaded);
      setImageUrl(uploaded[0] || "");
      toast.success(`${uploaded.length} photo${uploaded.length > 1 ? "s" : ""} uploaded!`);
    } catch {
      toast.error("Failed to upload photos");
      setImagePreview(null);
      setImagePreviews([]);
      setImageUrls([]);
      setImageUrl("");
    } finally {
      setUploading(false);
    }
  };

  const removeImage = () => {
    setImageUrl("");
    setImageUrls([]);
    setImagePreview(null);
    setImagePreviews([]);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const submit = async () => {
    if (!content.trim() && !imageUrl) {
      toast.error("Add some content or a photo");
      return;
    }
    if (imagePreview && !imageUrl.trim()) {
      toast.error("Wait for the image to finish uploading, or remove it");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clubId,
          content,
          caption: content,
          imageUrl: imageUrl || undefined,
          imageUrls: imageUrls.length > 0 ? imageUrls : undefined,
          type,
        }),
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => null);
        throw new Error(errData?.error || "Failed to post");
      }
      setContent("");
      removeImage();
      toast.success("Posted successfully! 🎉");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to post");
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="rounded-[2rem] border border-white/[0.05] bg-white/[0.02] backdrop-blur-xl p-8 relative overflow-hidden"
    >
      <div className="absolute top-0 right-0 h-40 w-40 rounded-full bg-[#5227FF]/10 blur-[80px] pointer-events-none" />

      <h3 className="text-lg font-semibold text-white mb-6 relative z-10">Create Post</h3>

      <div className="relative z-10 space-y-5">
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={4}
          placeholder="What's happening in your club?"
          className="w-full rounded-2xl border border-white/[0.08] bg-black/30 p-5 text-sm text-white outline-none placeholder:text-white/30 focus:border-[#5227FF]/50 transition-colors resize-none"
        />

        {/* Image Preview */}
        <AnimatePresence>
          {imagePreview && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="relative rounded-2xl overflow-hidden border border-white/[0.08]"
            >
              <img
                src={imagePreview}
                alt="Preview"
                className="w-full max-h-[400px] object-cover"
              />
              {uploading && (
                <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                  <div className="flex items-center gap-3 text-white">
                    <div className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span className="text-sm font-semibold">Uploading...</span>
                  </div>
                </div>
              )}
              <button
                onClick={removeImage}
                className="absolute top-3 right-3 h-8 w-8 rounded-full bg-black/70 flex items-center justify-center hover:bg-red-500 transition-colors"
              >
                <X className="h-4 w-4 text-white" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Post type selector */}
        <div className="flex flex-wrap gap-2">
          {postTypes.map((pt) => {
            const active = type === pt.value;
            return (
              <button
                key={pt.value}
                onClick={() => setType(pt.value)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  active
                    ? "bg-[#5227FF] text-white shadow-[0_0_15px_rgba(82,39,255,0.4)]"
                    : "bg-white/5 text-white/50 hover:bg-white/10 hover:text-white/80 border border-white/[0.06]"
                }`}
              >
                <pt.icon className="h-4 w-4" />
                {pt.label}
              </button>
            );
          })}
        </div>

        {/* Upload + URL + Submit row */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          {/* Upload Button */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={handleFileUpload}
            className="hidden"
          />
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="flex items-center justify-center gap-2 rounded-xl border border-dashed border-[#5227FF]/30 bg-[#5227FF]/5 px-6 py-3 text-sm font-semibold text-[#8C6DFD] hover:bg-[#5227FF]/10 hover:border-[#5227FF]/50 transition-all disabled:opacity-40"
          >
            <Upload className="h-4 w-4" />
            {uploading ? "Uploading..." : "Upload Photos"}
          </motion.button>

          {/* OR paste URL */}
          <div className="flex-1 relative">
            <ImagePlus className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-white/30" />
            <input
              value={imageUrl}
              onChange={(e) => {
                setImageUrl(e.target.value);
                if (e.target.value) setImagePreview(e.target.value);
              if (e.target.value) {
                setImageUrls([e.target.value]);
                setImagePreviews([e.target.value]);
              }
              }}
              placeholder="Or paste image URL"
              className="w-full rounded-xl border border-white/[0.08] bg-black/30 py-3 pl-11 pr-4 text-sm text-white outline-none placeholder:text-white/30 focus:border-[#5227FF]/50 transition-colors"
            />
          </div>

          {/* Publish */}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={submit}
            disabled={
              loading ||
              uploading ||
              (!content.trim() && !imageUrl) ||
              (Boolean(imagePreview) && imageUrls.length === 0 && !imageUrl.trim())
            }
            className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#5227FF] to-[#2B4BFF] px-8 py-3 text-sm font-semibold text-white shadow-[0_0_20px_rgba(82,39,255,0.4)] hover:shadow-[0_0_30px_rgba(82,39,255,0.6)] transition-shadow disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Send className="h-4 w-4" />
            {loading ? "Posting..." : "Publish"}
          </motion.button>
        </div>
        {imagePreviews.length > 1 ? (
          <p className="text-xs text-white/45">{imagePreviews.length} photos selected (carousel post)</p>
        ) : null}
      </div>
    </motion.div>
  );
}
