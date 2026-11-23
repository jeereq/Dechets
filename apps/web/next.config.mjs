/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@benime/shared'],
  async redirects() {
    // La racine n'a pas de page : elle renvoie vers la langue par defaut.
    return [{ source: '/', destination: '/fr', permanent: false }];
  },
  experimental: {
    typedRoutes: false,
  },
};

export default nextConfig;
