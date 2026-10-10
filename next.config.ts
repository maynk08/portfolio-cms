import type { NextConfig } from 'next';

// Uploaded files are served from S3, or from a CDN set with MEDIA_PUBLIC_BASE_URL (the same value as the backend's).
function mediaHostPattern(): NonNullable<NonNullable<NextConfig['images']>['remotePatterns']>[number][] {
  const baseUrl = process.env.MEDIA_PUBLIC_BASE_URL;
  if (baseUrl === undefined || baseUrl === '') {
    return [];
  }
  const url = new URL(baseUrl);
  return [{ protocol: url.protocol === 'http:' ? 'http' : 'https', hostname: url.hostname, port: url.port, pathname: '/**' }];
}

const nextConfig: NextConfig = {
  reactCompiler: true,
  // Stops `next dev` from writing its own instruction files into the repository.
  agentRules: false,
  poweredByHeader: false,
  images: {
    remotePatterns: [{ protocol: 'https', hostname: '**.amazonaws.com', pathname: '/**' }, ...mediaHostPattern()],
    // Only the end-to-end build sets this, so its local test image server can be used; never enable it otherwise.
    dangerouslyAllowLocalIP: process.env.MEDIA_ALLOW_LOCAL_IMAGES === 'true',
  },
};

export default nextConfig;
