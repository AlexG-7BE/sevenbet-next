const PROGRAMME_MICROPHONE_ROUTES = [
  "/program",
  "/de/program",
  "/es/program",
  "/se/program",
  "/dk/program",
  "/gr/program",
  "/it/program",
  "/pt/program",
  "/nl/program",
  "/fi/program",
  "/no/program",
];

const deniedBrowserCapabilities = "camera=(), microphone=(), geolocation=(), payment=(), usb=()";
const programmeBrowserCapabilities = "camera=(), microphone=(self), geolocation=(), payment=(), usb=()";
const partnerHostedFrameRoutes = [
  "/partner-creatives/:creativeId/frame",
  "/api/admin/media-operations/hosted-creatives/:creativeId/preview",
];

/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {},
  // Middleware owns canonical trailing-slash normalization for language,
  // protected and internal routes.
  skipTrailingSlashRedirect: true,
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: deniedBrowserCapabilities },
        ],
      },
      ...PROGRAMME_MICROPHONE_ROUTES.map((source) => ({
        // The default stays deny-all. Only the Programme recorder may ask the
        // browser for same-origin microphone permission; the user still owns
        // browser prompt. Keep this as an explicit canonical route list rather
        // than granting microphone authority to a broad localized wildcard.
        source,
        headers: [
          { key: "Permissions-Policy", value: programmeBrowserCapabilities },
        ],
      })),
      ...partnerHostedFrameRoutes.map((source) => ({
        // These exact same-origin documents own a narrower provider-specific
        // CSP in their route handlers and must remain embeddable only by B4.
        source,
        headers: [
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
        ],
      })),
    ];
  },
};

export default nextConfig;
