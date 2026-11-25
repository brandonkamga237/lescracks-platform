// The installed app's service worker. It caches the offline page and its icon, and answers only page
// navigations that fail. Every other request goes to the network as if it were not there, so a
// deployment is never hidden behind an old cached bundle.
const CACHE = 'lescracks-offline-v1';
const OFFLINE_URL = '/offline.html';
const OFFLINE_ICON = '/icon-192.png';

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll([new Request(OFFLINE_URL, { cache: 'reload' }), OFFLINE_ICON])));
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== CACHE).map((key) => caches.delete(key))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (event) => {
  if (event.request.mode === 'navigate') {
    event.respondWith(fetch(event.request).catch(() => caches.match(OFFLINE_URL)));
  } else if (new URL(event.request.url).pathname === OFFLINE_ICON) {
    // The offline page shows the app's icon: it must load without the network too.
    event.respondWith(fetch(event.request).catch(() => caches.match(OFFLINE_ICON)));
  }
});
