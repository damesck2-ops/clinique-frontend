/* Service worker : rend l'application installable et garde l'interface disponible hors connexion.
   Seules les ressources de l'application (même origine) sont mises en cache, jamais les appels à l'API. */
const CACHE = 'eclinique-v4';

// Réponse de secours quand le réseau est coupé et que rien n'est en cache
const horsLigne = () => new Response('Hors connexion', { status: 503, headers: { 'Content-Type': 'text/plain; charset=utf-8' } });

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(['/', '/index.html'])));
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((cles) => Promise.all(cles.filter((cle) => cle !== CACHE).map((cle) => caches.delete(cle))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const requete = event.request;
  const url = new URL(requete.url);
  if (requete.method !== 'GET' || url.origin !== self.location.origin) return;

  // Pages : réseau d'abord pour toujours servir la dernière version, cache en secours.
  if (requete.mode === 'navigate') {
    event.respondWith(
      fetch(requete)
        .then((reponse) => {
          const copie = reponse.clone();
          caches.open(CACHE).then((cache) => cache.put('/index.html', copie));
          return reponse;
        })
        .catch(() => caches.match('/index.html')
          .then((enCache) => enCache || caches.match('/'))
          .then((enCache) => enCache || horsLigne()))
    );
    return;
  }

  // Scripts, styles, images, polices : cache d'abord (les fichiers générés sont hachés).
  event.respondWith(
    caches.match(requete).then((enCache) => enCache || fetch(requete).then((reponse) => {
      // Un fichier supprimé par un déploiement renvoie index.html : ne jamais le garder à la place du JS
      const html = (reponse.headers.get('content-type') || '').includes('text/html');
      if (reponse.ok && !html) {
        const copie = reponse.clone();
        caches.open(CACHE).then((cache) => cache.put(requete, copie));
      }
      return reponse;
    }).catch(() => horsLigne()))
  );
});
