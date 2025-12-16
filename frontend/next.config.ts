import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    // Your ngrok allowed origins
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