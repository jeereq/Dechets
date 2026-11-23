import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { ImageResponse } from 'next/og';
import { LOCALES, estLocale, getDictionnaire } from '@/lib/i18n';

export const dynamic = 'force-static';

export function generateStaticParams() {
  return LOCALES.map((locale) => ({ locale }));
}

/** Image de partage 1200 x 630 : fond vert de la marque, nom et accroche. */
export async function GET(_requete: Request, { params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!estLocale(locale)) return new Response('Not found', { status: 404 });
  const t = getDictionnaire(locale);

  const marque = await readFile(path.join(process.cwd(), 'public', 'logo-benime-mark.png'));
  const source = `data:image/png;base64,${marque.toString('base64')}`;

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          gap: 64,
          padding: '0 80px',
          background: '#0B3C22',
          color: '#FFFFFF',
        }}
      >
        <div
          style={{
            width: 300,
            height: 420,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: '#FFFFFF',
            borderRadius: 36,
            flex: 'none',
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={source} width={200} height={275} alt="" />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20, flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 30, color: '#F5A800', fontWeight: 700 }}>BENIME CONGO SARL</div>
          <div style={{ fontSize: 64, fontWeight: 700, lineHeight: 1.1, display: 'flex', flexWrap: 'wrap' }}>{t.meta.nomSite}</div>
          <div style={{ fontSize: 32, color: '#CFE3D5', lineHeight: 1.3 }}>
            {t.accueil.surtitre}
          </div>
        </div>
      </div>
    ),
    { width: 1200, height: 630 },
  );
}
