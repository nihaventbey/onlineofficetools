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
        source: "/:lang/tr/tools/arz-rica",
        destination: "/:lang/tools/belgenet-hazirlik?tab=kurum",
        permanent: true,
      },
      {
        source: "/:lang/tr/tools/sdp-arama",
        destination: "/:lang/tools/belgenet-hazirlik?tab=sdp",
        permanent: true,
      },
      {
        source: "/:lang/tr/tools/detsis",
        destination: "/:lang/tools/belgenet-hazirlik?tab=kurum",
        permanent: true,
      },
      {
        source: "/:lang/tr/tools/belgenet-html",
        destination: "/:lang/tools/belgenet-hazirlik?tab=yazi",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
