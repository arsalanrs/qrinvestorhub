import type { NextConfig } from 'next';
import path from 'path';

const config: NextConfig = {
  outputFileTracingRoot: path.join(__dirname),
  experimental: {
    serverActions: {
      bodySizeLimit: '10mb',
    },
  },
};

export default config;
