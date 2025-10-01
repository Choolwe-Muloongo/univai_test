import type {NextConfig} from 'next';

const nextConfig: NextConfig = {
  /* config options here */
  typescript: {
    ignoreBuildErrors: false,
  },
  eslint: {
    ignoreDuringBuilds: false,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'picsum.photos',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'i.pravatar.cc',
        port: '',
        pathname: '/**',
      },
       {
        protocol: 'https',
        hostname: 'api.qrserver.com',
        port: '',
        pathname: '/**',
      }
    ]
  },
  experimental: {
    serverActions: {
      bodySizeLimit: '2mb',
      // Increase timeout for slow video generation
      // Type error: Object literal may only specify known properties, and 'timeout' does not exist
      // in type '{ bodySizeLimit?: SizeLimit | undefined; allowedOrigins?: string[] | undefined; }'.
      //timeout: 120,
    },
  },
  allowedDevOrigins: ['local-origin.dev', '*.local-origin.dev', '172.23.128.1'],
};

export default nextConfig;
