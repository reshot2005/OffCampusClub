import { put } from "@vercel/blob";
import { randomUUID } from "crypto";
import { mkdir, writeFile } from "fs/promises";
import { join } from "path";
import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { isCloudinaryConfigured, uploadImageBuffer } from "@/lib/cloudinary";

async function saveToLocalDisk(userId: string, ext: string, bytes: Buffer): Promise<string> {
  const shortName = `${randomUUID()}.${ext}`;
  const uploadDir = join(process.cwd(), "public", "uploads", userId);
  await mkdir(uploadDir, { recursive: true });
  await writeFile(join(uploadDir, shortName), bytes);
  return `/uploads/${userId}/${shortName}`;
}

export async function POST(req: NextRequest) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  const purpose = String(formData.get("purpose") || "posts").toLowerCase();

  const isGigSubmission = purpose === "gig_submission";
  const allowedGigMime = new Set([
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/vnd.ms-powerpoint",
    "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  ]);

  if (!file) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }

  if (isGigSubmission) {
    if (!allowedGigMime.has(file.type)) {
      return NextResponse.json(
        { error: "Invalid file type. Allowed: PDF, DOC, DOCX, PPT, PPTX." },
        { status: 400 },
      );
    }
    if (file.size > 30 * 1024 * 1024) {
      return NextResponse.json({ error: "File too large (max 30MB)" }, { status: 400 });
    }
  } else {
    if (!file.type.startsWith("image/")) {
      return NextResponse.json({ error: "No valid image file provided" }, { status: 400 });
    }
    if (file.size > 8 * 1024 * 1024) {
      return NextResponse.json({ error: "File too large (max 8MB)" }, { status: 400 });
    }
  }

  const ext = file.name.split(".").pop()?.replace(/[^a-z0-9]/gi, "") || "jpg";
  const bytes = Buffer.from(await file.arrayBuffer());
  const isDev = process.env.NODE_ENV === "development";

  const folder =
    purpose === "avatar" || purpose === "profile"
      ? "occ/avatars"
      : purpose === "gig_submission"
        ? "occ/gig-submissions"
      : purpose === "post" || purpose === "posts"
        ? "occ/posts"
        : `occ/${purpose.replace(/[^a-z0-9/_-]/gi, "_").slice(0, 32) || "uploads"}`;

  async function tryVercelBlob(): Promise<string | null> {
    if (!process.env.BLOB_READ_WRITE_TOKEN) return null;
    const fileName = `uploads/${user.id}/${randomUUID()}.${ext}`;
    const blob = await put(fileName, file, {
      access: "public",
      contentType: file.type || "application/octet-stream",
    });
    return blob.url;
  }

  // 1) Cloudinary (recommended for production)
  if (isCloudinaryConfigured()) {
    try {
      const url = await uploadImageBuffer({
        buffer: bytes,
        folder,
        contentType: file.type || "application/octet-stream",
      });
      return NextResponse.json({ success: true, url });
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      console.error("[upload] Cloudinary failed:", e);
      try {
        const blobUrl = await tryVercelBlob();
        if (blobUrl) {
          console.warn("[upload] Used Vercel Blob after Cloudinary error");
          return NextResponse.json({ success: true, url: blobUrl });
        }
      } catch (blobErr) {
        console.error("[upload] Blob fallback after Cloudinary failed:", blobErr);
      }
      if (isDev) {
        try {
          const url = await saveToLocalDisk(user.id, ext, bytes);
          console.warn("[upload] Dev fallback: saved to disk. Cloudinary error:", msg);
          return NextResponse.json({ success: true, url });
        } catch (localErr) {
          console.error("[upload] Local fallback failed:", localErr);
        }
      }
      return NextResponse.json(
        {
          error: "We couldn’t upload that image. Please try again in a moment.",
          detail: isDev ? msg : undefined,
        },
        { status: 500 },
      );
    }
  }

  // 2) Vercel Blob
  if (process.env.BLOB_READ_WRITE_TOKEN) {
    try {
      const url = await tryVercelBlob();
      if (url) return NextResponse.json({ success: true, url });
    } catch (e) {
      console.error("[upload] Blob failed:", e);
      if (isDev) {
        try {
          const url = await saveToLocalDisk(user.id, ext, bytes);
          return NextResponse.json({
            success: true,
            url,
            warning: "Uploaded locally (cloud storage failed).",
          });
        } catch {
          /* fall through */
        }
      }
      return NextResponse.json(
        { error: "We couldn’t upload that image. Please try again in a moment." },
        { status: 500 },
      );
    }
  }

  // 3) Local disk — development without cloud
  if (isDev) {
    try {
      const url = await saveToLocalDisk(user.id, ext, bytes);
      return NextResponse.json({ success: true, url });
    } catch (e) {
      console.error("[upload] Local write failed:", e);
      return NextResponse.json(
        { error: "Could not write to public/uploads.", detail: e instanceof Error ? e.message : String(e) },
        { status: 500 },
      );
    }
  }

  return NextResponse.json(
    {
      error: "Photo uploads aren’t available right now. Please try again later.",
    },
    { status: 503 },
  );
}
