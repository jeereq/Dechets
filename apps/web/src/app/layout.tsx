import type { Metadata } from 'next';
import { Atkinson_Hyperlegible } from 'next/font/google';
import './globals.css';

const police = Atkinson_Hyperlegible({
  weight: ['400', '700'],
  subsets: ['latin'],
  display: 'swap',
  variable: '--police',
});

export const metadata: Metadata = {
  title: 'BENIME CONGO Assainissement',
  description:
    'Collecte des déchets des ménages à Kinshasa. Vous êtes prévenu avant chaque passage et vous payez comme vous voulez.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" className={police.variable}>
      <body style={{ fontFamily: 'var(--police), system-ui, sans-serif' }}>{children}</body>
    </html>
  );
}
