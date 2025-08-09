import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Enable experimental features for better performance
  experimental: {
    optimizePackageImports: [
      'lucide-react',
      'zustand',
      'clsx',
      'tailwind-merge',
      '@tanstack/react-query',
      'recharts'
    ],
    // Enable server actions
    serverActions: {
      bodySizeLimit: '2mb',
    },
    // Enable React optimizations
    optimizeServerReact: true,
  },

  // Image optimization
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
      {
        protocol: 'http',
        hostname: 'localhost',
      },
    ],
    formats: ['image/webp', 'image/avif'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 60,
    dangerouslyAllowSVG: true,
    contentDispositionType: 'attachment',
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },

  // Compression and optimization
  compress: true,
  poweredByHeader: false,

  // Security headers
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on',
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=(self)',
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=31536000; includeSubDomains; preload',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
        ],
      },
    ];
  },

  // Build optimization
  webpack: (config, { dev, isServer }) => {
    // Production optimizations
    if (!dev && !isServer) {
      config.optimization = {
        ...config.optimization,
        splitChunks: {
          chunks: 'all',
          cacheGroups: {
            vendor: {
              test: /[\\/]node_modules[\\/]/,
              name: 'vendors',
              chunks: 'all',
              priority: 10,
            },
            commons: {
              name: 'commons',
              minChunks: 2,
              chunks: 'all',
              priority: 5,
            },
            react: {
              test: /[\\/]node_modules[\\/](react|react-dom)[\\/]/,
              name: 'react',
              chunks: 'all',
              priority: 20,
            },
            admin: {
              test: /[\\/]node_modules[\\/](zustand|@tanstack|recharts)[\\/]/,
              name: 'admin',
              chunks: 'all',
              priority: 15,
            },
          },
        },
        runtimeChunk: {
          name: 'runtime',
        },
      };
    }

    // SVG handling
    config.module.rules.push({
      test: /\.svg$/,
      use: ['@svgr/webpack'],
    });

    // Add source maps in development
    if (dev && process.env.NEXT_PUBLIC_ENABLE_SOURCE_MAPS === 'true') {
      config.devtool = 'eval-source-map';
    }

    return config;
  },

  // Environment variables validation
  env: {
    NEXT_PUBLIC_API_BASE_URL: process.env.NEXT_PUBLIC_API_BASE_URL,
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
    NEXT_PUBLIC_SITE_NAME: process.env.NEXT_PUBLIC_SITE_NAME || 'Vikareta Admin',
    NEXT_PUBLIC_MAIN_APP_URL: process.env.NEXT_PUBLIC_MAIN_APP_URL || 'https://vikareta.com',
  },

  // Output configuration for production
  output: process.env.NODE_ENV === 'production' ? 'standalone' : undefined,

  // TypeScript configuration
  typescript: {
    ignoreBuildErrors: false,
    tsconfigPath: './tsconfig.json',
  },

  // ESLint configuration
  eslint: {
    ignoreDuringBuilds: false,
    dirs: ['src'],
  },

  // Redirects
  async redirects() {
    return [
      {
        source: '/home',
        destination: '/admin',
        permanent: true,
      },
      {
        source: '/',
        destination: '/admin',
        permanent: false,
      },
    ];
  },

  // Rewrites
  async rewrites() {
    return {
      beforeFiles: [
        // Health check endpoint
        {
          source: '/health',
          destination: '/api/health',
        },
      ],
      afterFiles: [],
      fallback: [],
    };
  },
};

export default nextConfig;
