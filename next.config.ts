import type { NextConfig } from "next";
import createNextIntlPlugin from 'next-intl/plugin';
import { PrismaPlugin } from '@prisma/nextjs-monorepo-workaround-plugin';

const withNextIntl = createNextIntlPlugin('./i18n/request.ts');

const nextConfig: NextConfig = {
  /* config options here */
  typescript: {
    ignoreBuildErrors: true,
  },
  webpack: (config, { isServer }) => {
    if (isServer) {
      config.plugins = [...config.plugins, new PrismaPlugin()];
    }
    return config;
  },
};

export default withNextIntl(nextConfig);