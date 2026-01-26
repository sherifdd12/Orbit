import type { NextConfig } from "next";


const nextConfig: NextConfig = {
  webpack: (config, { isServer, webpack }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        "string_decoder": false,
      };
    }
    return config;
  },
};

export default nextConfig;
