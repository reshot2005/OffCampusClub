import { withSentryConfig } from "@sentry/nextjs";
import { fileURLToPath } from "node:url";
import bundleAnalyzer from "@next/bundle-analyzer";

// Keep this in sync with middleware matcher to avoid auth bypass from prefix drift.
const staffPrefix = "/k9xm2p7qv4nw8-stf";
const adminCpPrefix = (process.env.NEXT_PUBLIC_OCC_ADMIN_CP_PREFIX || "/k9xm2p7qv4nw8-admin-control-panel").replace(
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

  async redirects() {
    return [
      { source: "/sports", destination: "/football", permanent: false },
      { source: "/sports/", destination: "/football", permanent: false },
    ];
  },

  async rewrites() {
    return [
      { source: `${staffPrefix}/gate`, destination: "/staff-gate-internal" },
      { source: `${staffPrefix}/gate/`, destination: "/staff-gate-internal" },
      { source: `${staffPrefix}/:path+`, destination: "/staff-panel-internal/:path+" },
      { source: `${staffPrefix}`, destination: "/staff-panel-internal" },
      // Admin Control Panel rewrites (with + without trailing slash)
      { source: `${adminCpPrefix}/`, destination: "/admin-control-panel-internal" },
      { source: `${adminCpPrefix}/:path+/`, destination: "/admin-control-panel-internal/:path+" },
      { source: `${adminCpPrefix}/:path+`, destination: "/admin-control-panel-internal/:path+" },
      { source: `${adminCpPrefix}`, destination: "/admin-control-panel-internal" },
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
    instrumentationHook: true,
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
    ignoreBuildErrors: false,
  },
  webpack: (config, { dev }) => {
    config.resolve.alias = {
      ...(config.resolve.alias ?? {}),
      "react-router": fileURLToPath(new URL("./src/lib/router-compat.tsx", import.meta.url)),
    };
    // Windows: memory webpack cache can break dev (404 on main-app.js / layout.css). Opt in only if needed:
    //   set OCC_NEXT_WEBPACK_MEMORY_CACHE=true
    if (dev && process.platform === "win32" && process.env.OCC_NEXT_WEBPACK_MEMORY_CACHE === "true") {
      config.cache = { type: "memory" };
    }
    return config;
  },
};

export default withSentryConfig(withBundleAnalyzer(nextConfig), {
  // For all available options, see:
  // https://www.npmjs.com/package/@sentry/webpack-plugin#options

  org: "akshara-enterprises",

  project: "javascript-nextjs",

  // Only print logs for uploading source maps in CI
  silent: !process.env.CI,

  // For all available options, see:
  // https://docs.sentry.io/platforms/javascript/guides/nextjs/manual-setup/

  // Upload a larger set of source maps for prettier stack traces (increases build time)
  widenClientFileUpload: true,

  // Uncomment to route browser requests to Sentry through a Next.js rewrite to circumvent ad-blockers.
  // This can increase your server load as well as your hosting bill.
  // Note: Check that the configured route will not match with your Next.js middleware, otherwise reporting of client-
  // side errors will fail.
  // tunnelRoute: "/monitoring",

  webpack: {
    // Enables automatic instrumentation of Vercel Cron Monitors. (Does not yet work with App Router route handlers.)
    // See the following for more information:
    // https://docs.sentry.io/product/crons/
    // https://vercel.com/docs/cron-jobs
    automaticVercelMonitors: true,

    // Tree-shaking options for reducing bundle size
    treeshake: {
      // Automatically tree-shake Sentry logger statements to reduce bundle size
      removeDebugLogging: true,
    },
  },
});
