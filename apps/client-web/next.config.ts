import type { NextConfig } from 'next';
import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts');

const nextConfig: NextConfig = {
  output: 'standalone',
  transpilePackages: ['@vpower777/ui', '@vpower777/config', '@vpower777/types'],
  reactStrictMode: true,
  devIndicators: false,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'www.vpower777.com',
        pathname: '/wp-content/uploads/**',
      },
    ],
  },
};

export default withNextIntl(nextConfig);
