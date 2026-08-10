/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {},
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=(), usb=()" },
        ],
      },
      {
        // The default stays deny-all. Only the Programme recorder may ask the
        // browser for same-origin microphone permission; the user still owns
        // the browser prompt and no audio is uploaded by this foundation.
        source: "/program",
        headers: [
          { key: "Permissions-Policy", value: "camera=(), microphone=(self), geolocation=(), payment=(), usb=()" },
        ],
      },
    ];
  },
};

export default nextConfig;
