import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    // Your ngrok allowed origins
    // @ts-expect-error valid option
    allowedDevOrigins: ["localhost:3000", "postaxillary-jaida-spinnable.ngrok-free.dev"],
  },
  

  async rewrites() {
    return [
      {
        source: '/api/:path*',     
        destination: 'http://localhost:8080/:path*', 
      },
    ];
  },
};

export default nextConfig;