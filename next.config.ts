import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  webpack: (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      "@firebase/firestore": path.resolve(__dirname, "node_modules/@firebase/firestore"),
      "@firebase/app": path.resolve(__dirname, "node_modules/@firebase/app"),
      "@firebase/auth": path.resolve(__dirname, "node_modules/@firebase/auth"),
      "@firebase/storage": path.resolve(__dirname, "node_modules/@firebase/storage"),
    };
    return config;
  },
};

export default nextConfig;
