import type { NextConfig } from "next";
import path from "path";
import { loadEnvConfig } from "@next/env";

// Load environment variables from the root directory (../.env)
const projectDir = process.cwd();
loadEnvConfig(path.join(projectDir, ".."));

const nextConfig: NextConfig = {
  experimental: {
    // Your ngrok allowed origins
    // allowedDevOrigins: ["localhost:3000", "postaxillary-jaida-spinnable.ngrok-free.dev","http://26.177.218.219:5173"],
  },
  

  async rewrites() {
    return [
      {
        source: '/api/:path*',     
        destination: `${process.env.NEXT_PUBLIC_BACKEND_URL}/:path*`, 
      },
    ];
  },
};

export default nextConfig;