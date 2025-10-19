const CACHE_NAME = 'e-koperasi-cache-v6'; // Incremented version for PWA update
const urlsToCache = [
  // App Shell
  '/',
  '/index.html',
  '/index.tsx', // Crucial: Cache the main application script
  '/manifest.json',
  '/vite.svg',
  '/icon-192x192.png',
  '/icon-512x512.png',
];

// Install the service worker and cache all critical assets
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Service Worker: Caching app shell');
        return cache.addAll(urlsToCache);
      })
      .then(() => self.skipWaiting())
  );
});

// Clean up old caches on activation
self.addEventListener('activate', event => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (!cacheWhitelist.includes(cacheName)) {
            console.log('Service Worker: Deleting old cache', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});


self.addEventListener('fetch', event => {
  // Always go to the network for Firestore requests. Do not cache them.
  if (event.request.url.includes('firestore.googleapis.com')) {
    event.respondWith(fetch(event.request));
    return;
  }

  // Handle navigation requests (e.g., loading a page) for our SPA.
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request).catch(() => {
        // If the network fails (offline) or returns an error (like a 404 for an SPA route),
        // serve the main app shell from the cache.
        return caches.match('/');
      })
    );
    return;
  }

  // For all other requests (assets like JS, CSS, images, fonts),
  // use a "cache-first, then network" strategy.
  event.respondWith(
    caches.match(event.request).then(cachedResponse => {
      // If we have a match in the cache, return it.
      if (cachedResponse) {
        return cachedResponse;
      }
      
      // If not in cache, fetch from the network.
      return fetch(event.request).then(networkResponse => {
        // Don't cache opaque responses (from third-party CDNs without CORS) or errors.
        if (!networkResponse || networkResponse.status !== 200 || networkResponse.type === 'opaque') {
          return networkResponse;
        }

        // Clone the response and add it to the cache for next time.
        const responseToCache = networkResponse.clone();
        caches.open(CACHE_NAME).then(cache => {
          cache.put(event.request, responseToCache);
        });
        
        return networkResponse;
      });
    })
  );
});