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
    return [
      {
        source: "/",
        destination: "/en",
        permanent: true,
      },
      {
        source: "/:lang/word-counter",
        destination: "/:lang/tools/word-counter",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
