/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@benime/shared'],
  experimental: {
    typedRoutes: false,
  },
};

export default nextConfig;
