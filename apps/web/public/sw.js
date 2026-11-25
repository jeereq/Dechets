/* Service worker de My BENIME : l'application s'ouvre même avec une mauvaise connexion.
   - pages de l'espace : réseau d'abord, dernière version gardée en secours
   - fichiers de l'application et images : version gardée d'abord, mise à jour en arrière-plan
   Les appels à l'API ne sont jamais gardés : un solde ou un paiement doit toujours être à jour. */
const VERSION = 'benime-v1';

self.addEventListener('install', () => self.skipWaiting());

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((cles) => Promise.all(cles.filter((c) => c !== VERSION).map((c) => caches.delete(c))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (event) => {
  const requete = event.request;
  if (requete.method !== 'GET') return;
  const url = new URL(requete.url);
  if (url.origin !== self.location.origin) return;

  if (requete.mode === 'navigate' && /^\/(fr|en)\/espace\/?$/.test(url.pathname)) {
    event.respondWith(
      fetch(requete)
        .then((reponse) => {
          const copie = reponse.clone();
          caches.open(VERSION).then((cache) => cache.put(requete, copie));
          return reponse;
        })
        .catch(() => caches.match(requete)),
    );
    return;
  }

  if (url.pathname.startsWith('/_next/static/') || /\.(png|jpe?g|svg|webp|woff2?)$/.test(url.pathname)) {
    event.respondWith(
      caches.match(requete).then((gardee) => {
        const reseau = fetch(requete)
          .then((reponse) => {
            if (reponse.ok) {
              const copie = reponse.clone();
              caches.open(VERSION).then((cache) => cache.put(requete, copie));
            }
            return reponse;
          })
          .catch(() => gardee);
        return gardee || reseau;
      }),
    );
  }
});
