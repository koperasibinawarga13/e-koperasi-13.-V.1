
const CACHE_NAME = 'e-koperasi-cache-v41';

const STATIC_ASSETS = [
  '/',                // app shell
  '/index.html',
  '/manifest.json',
  '/assets/icon-192x192.png',
  '/assets/icon-512x512.png'
];

// Install & Cache Shell
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(STATIC_ASSETS);
    })
  );
  self.skipWaiting();
});

// Activate & Remove old caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

// Fetch handler
self.addEventListener('fetch', event => {
  const req = event.request;
  const url = new URL(req.url);

  // Always bypass Firestore & API calls
  if (url.hostname.includes('firestore.googleapis.com')) {
    return event.respondWith(fetch(req));
  }

  // SPA route handler (React Router)
  if (req.mode === 'navigate') {
    return event.respondWith(
      fetch(req).catch(() => caches.match('/index.html'))
    );
  }

  // Cache-first strategy for static & CDN
  event.respondWith(
    caches.match(req).then(cacheRes => {
      return (
        cacheRes ||
        fetch(req)
          .then(networkRes => {
            // cache only successful or opaque responses
            if (networkRes.ok || networkRes.type === 'opaque') {
              caches.open(CACHE_NAME).then(cache => cache.put(req, networkRes.clone()));
            }
            return networkRes;
          })
          .catch(() => {
            // Optional: Offline fallback image
            if (req.destination === 'image') {
              return caches.match('/assets/icon-192x192.png');
            }
          })
      );
    })
  );
});

// Allow client app to update SW immediately
self.addEventListener('message', event => {
  if (event.data?.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
