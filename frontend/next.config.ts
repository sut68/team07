import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    // Your ngrok allowed origins
    // allowedDevOrigins: ["localhost:3000", "postaxillary-jaida-spinnable.ngrok-free.dev","http://26.177.218.219:5173"],
  },
  

  async rewrites() {
    return [
      {
        source: '/api/:path*',     
        destination: `${process.env.NEXT_PUBLIC_API_URL || 'http://backend:8080'}/:path*`, 
      },
    ];
  },
};

export default nextConfig;