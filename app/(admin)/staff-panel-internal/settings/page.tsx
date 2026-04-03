import Link from "next/link";
import { AdminSettingsClient } from "@/components/admin/AdminSettingsClient";
import { staffHref } from "@/lib/staff-paths";

export default function AdminSettingsPage() {
  const env = {
    database: !!process.env.DATABASE_URL,
    pusher:
      !!process.env.PUSHER_APP_ID &&
      !!process.env.PUSHER_KEY &&
      !!process.env.NEXT_PUBLIC_PUSHER_KEY,
    email: !!(process.env.RESEND_API_KEY || process.env.SMTP_HOST),
    uploadthing: !!process.env.UPLOADTHING_SECRET,
    cloudinary:
      !!process.env.CLOUDINARY_CLOUD_NAME &&
      !!process.env.CLOUDINARY_API_KEY &&
      !!process.env.CLOUDINARY_API_SECRET,
    vercelBlob: !!process.env.BLOB_READ_WRITE_TOKEN,
  };

  const rows: { label: string; ok: boolean; detail: string }[] = [
    { label: "Database", ok: env.database, detail: "DATABASE_URL" },
    { label: "Realtime (Pusher)", ok: env.pusher, detail: "PUSHER_* + NEXT_PUBLIC_PUSHER_*" },
    { label: "Email (Resend / SMTP)", ok: env.email, detail: "RESEND_API_KEY or SMTP_*" },
    { label: "Uploadthing", ok: env.uploadthing, detail: "UPLOADTHING_SECRET" },
    {
      label: "Images (Cloudinary)",
      ok: env.cloudinary,
      detail: "CLOUDINARY_CLOUD_NAME + CLOUDINARY_API_KEY + CLOUDINARY_API_SECRET",
    },
    { label: "Images (Vercel Blob fallback)", ok: env.vercelBlob, detail: "BLOB_READ_WRITE_TOKEN" },
  ];

  return (
    <div className="space-y-10">
      <div>
        <p className="font-mono text-[10px] uppercase tracking-[0.45em] text-[#C9A96E]">Platform</p>
        <h1 className="font-serif text-3xl italic text-[#F5F1EB] md:text-4xl">Settings</h1>
        <p className="mt-2 max-w-xl text-sm text-white/55">
          Read-only integration status. Values are not exposed; only whether required variables appear set.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {rows.map((r) => (
          <div
            key={r.label}
            className={`rounded-2xl border p-5 ${
              r.ok ? "border-[#00E87A]/25 bg-[rgba(0,232,122,0.06)]" : "border-[#FF4D4D]/25 bg-[rgba(255,77,77,0.06)]"
            }`}
          >
            <div className="flex items-center justify-between gap-2">
              <p className="font-medium text-[#F5F1EB]">{r.label}</p>
              <span
                className={`rounded-full px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider ${
                  r.ok ? "bg-[#00E87A]/20 text-[#00E87A]" : "bg-[#FF4D4D]/20 text-[#FF4D4D]"
                }`}
              >
                {r.ok ? "Ready" : "Missing"}
              </span>
            </div>
            <p className="mt-2 font-mono text-[10px] text-white/45">{r.detail}</p>
          </div>
        ))}
      </div>

      <AdminSettingsClient />

      <div className="rounded-2xl border border-white/10 bg-[rgba(255,248,235,0.03)] p-6">
        <h2 className="font-serif text-xl italic text-[#F5F1EB]">Navigation</h2>
        <p className="mt-2 text-sm text-white/55">Return to moderation or sign out from the main app header when available.</p>
        <div className="mt-4 flex flex-wrap gap-3">
          <Link
            href={staffHref()}
            className="rounded-full border border-[#C9A96E]/35 px-4 py-2 text-sm text-[#C9A96E] hover:bg-[#C9A96E]/10"
          >
            Overview
          </Link>
          <Link href="/dashboard" className="rounded-full border border-white/15 px-4 py-2 text-sm text-white/75 hover:bg-white/5">
            Student dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
