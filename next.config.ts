import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactCompiler: true,
  // Stops `next dev` from writing its own instruction files into the repository.
  agentRules: false,
  poweredByHeader: false,
};

export default nextConfig;
