import { fileURLToPath } from "node:url";
import bundleAnalyzer from "@next/bundle-analyzer";

const staffPrefix = (process.env.NEXT_PUBLIC_OCC_STAFF_PREFIX || "/k9xm2p7qv4nw8-stf").replace(
  /\/$/,
  "",
);

const withBundleAnalyzer = bundleAnalyzer({
  enabled: process.env.ANALYZE === "true",
  /** Set ANALYZE_OPEN=true to auto-open the treemap in a browser after build. */
  openAnalyzer: process.env.ANALYZE_OPEN === "true",
});

/** Optional: resolve legacy DB paths `/uploads/...` to a public CDN base (set in Vercel if needed). */
const uploadsCdnBase = process.env.NEXT_PUBLIC_UPLOADS_CDN_BASE?.trim() || "";

/** @type {import("next").NextConfig} */
const nextConfig = {
  compress: true,
  productionBrowserSourceMaps: false,
  // Note: do not use compiler.removeConsole here — it breaks `next dev --turbo` (Next.js 14).

  env: {
    ...(uploadsCdnBase
      ? {
          NEXT_PUBLIC_UPLOADS_CDN_BASE: uploadsCdnBase.replace(/\/$/, ""),
        }
      : {}),
  },

  async rewrites() {
    return [
      { source: `${staffPrefix}/gate`, destination: "/staff-gate-internal" },
      { source: `${staffPrefix}/gate/`, destination: "/staff-gate-internal" },
      { source: `${staffPrefix}/:path+`, destination: "/staff-panel-internal/:path+" },
      { source: `${staffPrefix}`, destination: "/staff-panel-internal" },
      // Admin Control Panel rewrites (with + without trailing slash)
      { source: "/k9xm2p7qv4nw8-admin-control-panel/", destination: "/admin-control-panel-internal" },
      { source: "/k9xm2p7qv4nw8-admin-control-panel/:path+/", destination: "/admin-control-panel-internal/:path+" },
      { source: "/k9xm2p7qv4nw8-admin-control-panel/:path+", destination: "/admin-control-panel-internal/:path+" },
      { source: "/k9xm2p7qv4nw8-admin-control-panel", destination: "/admin-control-panel-internal" },
    ];
  },

  images: {
    formats: ["image/avif", "image/webp"],
    minimumCacheTTL: 60,
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    remotePatterns: [
      { protocol: "https", hostname: "res.cloudinary.com" },
      { protocol: "https", hostname: "pub-bfaeaa580da54d41ac88fa17561fb6c9.r2.dev" },
      { protocol: "https", hostname: "i.pravatar.cc" },
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "d8j0ntlcm91z4.cloudfront.net" },
    ],
  },

  experimental: {
    typedRoutes: false,
    optimizePackageImports: ["framer-motion", "lucide-react", "date-fns"],
  },

  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-DNS-Prefetch-Control", value: "on" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-Frame-Options", value: "DENY" },
          {
            key: "Permissions-Policy",
            value:
              "accelerometer=(), autoplay=(), camera=(), clipboard-read=(), clipboard-write=(), geolocation=(), gyroscope=(), magnetometer=(), microphone=(), midi=(), payment=(), usb=()",
          },
        ],
      },
      {
        source: "/static/(.*)",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
    ];
  },

  typescript: {
    ignoreBuildErrors: true,
  },
  webpack: (config, { dev }) => {
    config.resolve.alias = {
      ...(config.resolve.alias ?? {}),
      "react-router": fileURLToPath(new URL("./src/lib/router-compat.tsx", import.meta.url)),
    };
    // Windows dev: avoid intermittent ENOENT on .next/cache/webpack pack rename (PackFileCacheStrategy).
    if (dev && process.platform === "win32") {
      config.cache = { type: "memory" };
    }
    return config;
  },
};

export default withBundleAnalyzer(nextConfig);
