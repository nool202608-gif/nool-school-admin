import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Traces the minimal set of files/deps into .next/standalone - the
  // Docker image only needs to copy that output, not node_modules.
  output: 'standalone',
};

export default nextConfig;
