import type { NextConfig } from 'next';
import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts');

const nextConfig: NextConfig = {
  transpilePackages: ['@vpower777/ui', '@vpower777/config', '@vpower777/types'],
  reactStrictMode: true,
  devIndicators: false,
};

export default withNextIntl(nextConfig);
