import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  poweredByHeader: false,
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
    // Tree-shake large icon/utility libraries — reduces initial JS payload
    optimizePackageImports: [
      "lucide-react",
      "@radix-ui/react-icons",
      "date-fns",
      "recharts",
      "react-day-picker",
      "@dnd-kit/core",
      "@dnd-kit/sortable",
      "@dnd-kit/utilities",
      "framer-motion",
      "clsx",
      "tailwind-merge",
      "@tanstack/react-query",
      "@tanstack/react-table",
    ],
    // 'true' uses internal heuristics for balancing chunk count
    cssChunking: true,
    optimizeCss: true,
  },

  images: {
    formats: ["image/avif", "image/webp"],
    // Tighter breakpoints — fewer image variants generated, faster CDN
    deviceSizes: [640, 828, 1080, 1200, 1920],
    imageSizes: [16, 32, 64, 128, 256],
    qualities: [45, 50, 60, 75, 80],
    remotePatterns: [
      { protocol: "https", hostname: "i.ibb.co.com" },
      { protocol: "https", hostname: "**.i.ibb.co.com" },
      { protocol: "https", hostname: "i.ibb.co" },
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "lh3.googleusercontent.com" },
      { protocol: "https", hostname: "maps.googleapis.com" },
      { protocol: "https", hostname: "uxukdfbqynnlkcykqozu.supabase.co" },
    ],
  },

  compress: true,

  // Aggressive caching for immutable static assets
  async headers() {
    return [
      {
        // Static assets with extensions - use simpler path matching without capturing groups
        source: "/:path*.(js|css|woff2|woff|ttf|eot)",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
      {
        // Next.js hashed chunk assets — permanently immutable
        source: "/_next/static/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },

      {
        // All images — long cache, publicly cacheable
        source: "/images/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=86400, stale-while-revalidate=3600",
          },
        ],
      },
      {
        // Homepage — short revalidation for fresh product data
        source: "/",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=60, stale-while-revalidate=300",
          },
          {
            // Early hints: preconnect Supabase before full HTML parse
            key: "Link",
            value: "<https://uxukdfbqynnlkcykqozu.supabase.co>; rel=preconnect; crossorigin",
          },
        ],
      },
    ];
  },

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
