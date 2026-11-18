import type { NextConfig } from "next";

// Safety headers on every page and API answer. Pulse is never shown inside
// another site's frame. Permissions are opened per feature when one needs
// them (e.g. camera=(self) for photos). noindex until the app goes live.
const SECURITY_HEADERS = [
  {
    key: "Content-Security-Policy",
    value: "frame-ancestors 'none'; base-uri 'self'; form-action 'self'; object-src 'none'",
  },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=(), usb=()" },
  { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
  { key: "X-Robots-Tag", value: "noindex, nofollow" },
];

const nextConfig: NextConfig = {
  /* config options here */
  experimental: {
    agentFeedback: true,
  },
  cacheComponents: true,
  partialPrefetching: true,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
  // Don't announce "Next.js" in every answer.
  poweredByHeader: false,
  headers() {
    return [
      { source: "/:path*", headers: SECURITY_HEADERS },
      // Email links carry a token in ?token=: no referrer at all from these
      // pages. Listed last, so this value overrides the one above.
      ...["/verify-email", "/set-password"].map((source) => ({
        source,
        headers: [{ key: "Referrer-Policy", value: "no-referrer" }],
      })),
    ];
  },
  // The old standalone sign-up page: new accounts now start with the
  // onboarding questions, and the account is made at the end ("Save your plan").
  redirects() {
    return [
      { source: "/register", destination: "/start/goal", permanent: false },
      { source: "/start", destination: "/start/goal", permanent: false },
    ];
  },
  // No rewrites: /api/* is forwarded by the Route Handler in
  // app/api/[...path]/route.ts, which adds the proxy secret (a rewrite cannot
  // add request headers).
};

export default nextConfig;
