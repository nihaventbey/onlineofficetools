import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {},
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
    ],
  },
  async redirects() {
    // Note: "/" is handled by src/middleware.ts (geo/language-aware redirect).
    return [
      // Collapse www → apex so Google does not treat them as duplicate hosts.
      {
        source: "/:path*",
        has: [{ type: "host", value: "www.onlineofficetools.com" }],
        destination: "https://onlineofficetools.com/:path*",
        permanent: true,
      },
      {
        source: "/:lang(en|tr|de|fr|es|it|pt|ru)/word-counter",
        destination: "/:lang/tools/word-counter",
        permanent: true,
      },
      {
        source: "/tr/tools/arz-rica",
        destination: "/tr",
        permanent: true,
      },
      {
        source: "/tr/tools/sdp-arama",
        destination: "/tr",
        permanent: true,
      },
      {
        source: "/tr/tools/detsis",
        destination: "/tr",
        permanent: true,
      },
      {
        source: "/tr/tools/belgenet-html",
        destination: "/tr",
        permanent: true,
      },
      {
        source: "/tr/tools/belgenet-hazirlik",
        destination: "/tr",
        permanent: true,
      },
      {
        source: "/tr/categories/ebys",
        destination: "/tr",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
