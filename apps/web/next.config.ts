import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    const apiUrl = process.env.INTERNAL_API_URL ?? process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

    return [
      {
        source: "/api/:path*",
        destination: `${apiUrl}/api/:path*`
      },
      {
        source: "/covers/:path*",
        destination: `${apiUrl}/covers/:path*`
      }
    ];
  }
};

export default nextConfig;
