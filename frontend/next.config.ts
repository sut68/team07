import type { NextConfig } from "next";
import path from "path";
import { loadEnvConfig } from "@next/env";

const projectDir = process.cwd();
const { combinedEnv } = loadEnvConfig(path.join(projectDir, ".."));

const backendUrl = combinedEnv.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8080/team07api";

const nextConfig: NextConfig = {
  experimental: {
    // Your ngrok allowed origins
    // allowedDevOrigins: ["localhost:3000", "postaxillary-jaida-spinnable.ngrok-free.dev","http://26.177.218.219:5173"],
  },
  

  async rewrites() {
    return [
      {
        source: '/api/:path*',     
        destination: `${backendUrl}/:path*`, 
      },
    ];
  },
};

export default nextConfig;