import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'My BENIME · BENIME CONGO Assainissement',
    short_name: 'My BENIME',
    description: 'Collecte des déchets des ménages à Kinshasa.',
    lang: 'fr',
    start_url: '/fr/espace',
    scope: '/',
    display: 'standalone',
    background_color: '#FFFFFF',
    theme_color: '#0F6B37',
    icons: [
      { src: '/icon-192.png', sizes: '192x192', type: 'image/png' },
      { src: '/icon-512.png', sizes: '512x512', type: 'image/png' },
      { src: '/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  };
}
