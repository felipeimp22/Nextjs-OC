import type { NextConfig } from "next";
import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./i18n/request.ts');

const nextConfig: NextConfig = {
  /* config options here */
    typescript: {
    ignoreBuildErrors: true,
  },
};

export default withNextIntl(nextConfig);