import type { NextConfig } from "next";

const nextConfig: NextConfig = {
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
    // Note: "/" is handled by src/proxy.ts (geo/language-aware redirect).
    return [
      {
        source: "/:lang(en|tr|de|fr|es|it|pt|ru)/word-counter",
        destination: "/:lang/tools/word-counter",
        permanent: true,
      },
      {
        source: "/tr/tools/arz-rica",
        destination: "/tr/tools/belgenet-hazirlik?tab=kurum",
        permanent: true,
      },
      {
        source: "/tr/tools/sdp-arama",
        destination: "/tr/tools/belgenet-hazirlik?tab=sdp",
        permanent: true,
      },
      {
        source: "/tr/tools/detsis",
        destination: "/tr/tools/belgenet-hazirlik?tab=kurum",
        permanent: true,
      },
      {
        source: "/tr/tools/belgenet-html",
        destination: "/tr/tools/belgenet-hazirlik?tab=yazi",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
