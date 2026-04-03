import { v2 as cloudinary } from "cloudinary";

function trimEnv(v: string | undefined): string {
  if (!v) return "";
  return v.trim().replace(/^["']|["']$/g, "");
}

export function isCloudinaryConfigured(): boolean {
  return !!(
    trimEnv(process.env.CLOUDINARY_CLOUD_NAME) &&
    trimEnv(process.env.CLOUDINARY_API_KEY) &&
    trimEnv(process.env.CLOUDINARY_API_SECRET)
  );
}

function configure(): void {
  cloudinary.config({
    cloud_name: trimEnv(process.env.CLOUDINARY_CLOUD_NAME),
    api_key: trimEnv(process.env.CLOUDINARY_API_KEY),
    api_secret: trimEnv(process.env.CLOUDINARY_API_SECRET),
    secure: true,
  });
}

/**
 * Upload image bytes; returns `secure_url` for storing in DB.
 * Uses base64 upload (reliable on Windows vs stream + avoids common stream edge cases).
 */
export async function uploadImageBuffer(opts: {
  buffer: Buffer;
  folder: string;
  contentType?: string;
}): Promise<string> {
  if (!isCloudinaryConfigured()) {
    throw new Error("Cloudinary is not configured");
  }
  configure();
  const mime =
    opts.contentType && opts.contentType.startsWith("image/") ? opts.contentType : "image/jpeg";
  const dataUri = `data:${mime};base64,${opts.buffer.toString("base64")}`;

  return new Promise((resolve, reject) => {
    cloudinary.uploader.upload(
      dataUri,
      {
        folder: opts.folder,
        resource_type: "image",
        overwrite: false,
      },
      (error, result) => {
        if (error) {
          reject(error);
          return;
        }
        if (result?.secure_url) {
          resolve(result.secure_url);
        } else {
          reject(new Error("Cloudinary: missing secure_url in response"));
        }
      },
    );
  });
}

/** Derive public_id from a Cloudinary delivery URL for delete API. */
export function publicIdFromCloudinaryUrl(url: string): string | null {
  try {
    const u = new URL(url);
    if (!u.hostname.includes("res.cloudinary.com")) return null;
    const parts = u.pathname.split("/").filter(Boolean);
    const uploadIdx = parts.indexOf("upload");
    if (uploadIdx === -1 || uploadIdx >= parts.length - 1) return null;
    let rest = parts.slice(uploadIdx + 1);
    while (rest.length && rest[0].includes(",")) {
      rest = rest.slice(1);
    }
    if (rest.length && /^v\d+$/i.test(rest[0])) {
      rest = rest.slice(1);
    }
    if (rest.length === 0) return null;
    const last = rest[rest.length - 1];
    if (last.includes(".")) {
      rest = [...rest.slice(0, -1), last.replace(/\.[^.]+$/, "")];
    }
    return rest.join("/");
  } catch {
    return null;
  }
}

/** Best-effort delete when the stored URL is from this Cloudinary account. */
export async function deleteCloudinaryByUrl(url: string | null | undefined): Promise<void> {
  if (!url?.trim() || !isCloudinaryConfigured()) return;
  const publicId = publicIdFromCloudinaryUrl(url);
  if (!publicId) return;
  configure();
  // SDK returns a rejecting Promise on error even when using a callback — that unhandled
  // rejection surfaced as 500 on DELETE /api/posts/[id]. disable_promises uses callback only.
  await new Promise<void>((resolve) => {
    cloudinary.uploader.destroy(
      publicId,
      (result) => {
        if (result?.error) {
          console.warn("[cloudinary] destroy failed:", result.error);
        }
        resolve();
      },
      { disable_promises: true },
    );
  });
}
