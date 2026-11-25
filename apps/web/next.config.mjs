/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@benime/shared'],
  async redirects() {
    // La racine n'a pas de page : elle renvoie vers la langue par defaut.
    return [
      { source: '/', destination: '/fr', permanent: false },
      // L'ancienne adresse « formules » devient « tarification ».
      { source: '/:locale(fr|en)/formules', destination: '/:locale/tarification', permanent: true },
    ];
  },
  experimental: {
    typedRoutes: false,
  },
};

export default nextConfig;
