import { NextRequest } from "next/server";

type Bucket = { count: number; resetAt: number };

declare global {
  // eslint-disable-next-line no-var
  var __occAdminRateLimitBuckets: Map<string, Bucket> | undefined;
}

const buckets = globalThis.__occAdminRateLimitBuckets ?? new Map<string, Bucket>();
globalThis.__occAdminRateLimitBuckets = buckets;

function clientIp(req: NextRequest): string {
  const forwarded = req.headers.get("x-forwarded-for") || "";
  return forwarded.split(",")[0]?.trim() || "unknown";
}

export function checkAdminMutationRateLimit(params: {
  req: NextRequest;
  adminId: string;
  action: string;
  limit?: number;
  windowMs?: number;
}): { ok: true } | { ok: false; retryAfterSec: number } {
  const { req, adminId, action, limit = 30, windowMs = 60_000 } = params;
  const key = `${adminId}:${clientIp(req)}:${action}`;
  const now = Date.now();
  const current = buckets.get(key);

  if (!current || current.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true };
  }
  if (current.count >= limit) {
    return { ok: false, retryAfterSec: Math.max(1, Math.ceil((current.resetAt - now) / 1000)) };
  }

  current.count += 1;
  buckets.set(key, current);
  return { ok: true };
}
