import type { NextConfig } from "next";

/**
 * Low-risk browser hardening.
 *
 * Deliberately no blocking CSP here: a CSP must be developed in Report-Only
 * mode first to accommodate Next.js, Firebase Auth and Firestore endpoints.
 * Do not disable geolocation: the practice may use it for attendance.
 */
const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), payment=()" },
  { key: "Strict-Transport-Security", value: "max-age=31536000" },
];

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: "/:path*",
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
