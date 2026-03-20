import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  outputFileTracingExcludes: {
    "*": [
      "public/Real-View Products 101/**/*",
      "public/ProductsReal/**/*",
      "public/Real-View-WebP/**/*",
      "public/products/**/*",
      "public/Real-View Products 101/**/*"
    ],
  },


  serverExternalPackages: ["@prisma/client"],

  typescript: {
    ignoreBuildErrors: true,
  },

  reactStrictMode: true,

  experimental: {
    optimizePackageImports: ["lucide-react", "@radix-ui/react-icons", "date-fns", "recharts", "react-day-picker", "@dnd-kit/core", "@dnd-kit/sortable", "@dnd-kit/utilities"],
  },

  images: {
    formats: ["image/avif", "image/webp"],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "i.ibb.co.com",
      },
      {
        protocol: "https",
        hostname: "**.i.ibb.co.com",
      },
      {
        protocol: "https",
        hostname: "i.ibb.co",
      },
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
      },
      {
        protocol: "https",
        hostname: "maps.googleapis.com",
      },
      {
        protocol: "https",
        hostname: "uxukdfbqynnlkcykqozu.supabase.co",
      }
    ],
  },
  compress: true,
  async rewrites() {
    return [
      {
        source: "/sitemap",
        destination: "/website-sitemap",
      },
    ];
  },
};

export default nextConfig;
