import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      {
        source: '/admin',
        destination: '/vendors',
        permanent: false,
      },
      {
        source: '/admin/overview',
        destination: '/vendors',
        permanent: false,
      },
      {
        source: '/overview',
        destination: '/vendors',
        permanent: false,
      },
      {
        source: '/admin/:path*',
        destination: '/:path*',
        permanent: false,
      },
    ];
  },
};

export default nextConfig;
