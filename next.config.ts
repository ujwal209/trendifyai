import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "**.google.com" },
      { protocol: "https", hostname: "**.gstatic.com" },
      { protocol: "https", hostname: "**.googleusercontent.com" },
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "**.shopping.gstatic.com" },
      { protocol: "https", hostname: "**.media-amazon.com" },
    ],
  },
  // Allow all image sources via regular img tag (not Next/Image)
  // Note: Next/Image will use above patterns; <img> tags work freely
};

export default nextConfig;
