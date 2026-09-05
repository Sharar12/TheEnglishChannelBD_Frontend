const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000';

const backendUrlObj = new URL(backendUrl);

/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
      {
        protocol: backendUrlObj.protocol.replace(':', ''),
        hostname: backendUrlObj.hostname,
        port: backendUrlObj.port,
      },
    ],
  },
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: `${backendUrl}/api/:path*`,
      },
    ];
  },
};

module.exports = nextConfig;