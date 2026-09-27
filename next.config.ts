import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  images: {
    remotePatterns: [
      {
        protocol: "http",
        hostname: "localhost",
        port: "9000",
        pathname: "/station-images/**",
      },
      {
        protocol: "http",
        hostname: "minio",
        port: "9000",
        pathname: "/station-images/**",
      },
      // Add your server IP/domain here for production
      {
        protocol: "https",
        hostname: "*.saraburidev.org",
        pathname: "/station-images/**",
      },
    ],
  },
  // Allow packages that use Node.js APIs in server components
  serverExternalPackages: ["bcryptjs", "@prisma/client", "minio"],
};

export default nextConfig;
