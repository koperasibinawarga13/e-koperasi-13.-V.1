const CACHE_NAME = 'e-koperasi-cache-v13'; // Incremented version
const urlsToCache = [
  // App Shell
  '/',
  '/index.html',
  '/manifest.json?v=3',
  '/icon-192x192.png?v=3',
  '/icon-512x512.png?v=3',
  // Main script
  '/index.tsx',
  // Styles & Fonts
  'https://cdn.tailwindcss.com',
  'https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&display=swap',
  // JS Dependencies from importmap
  'https://aistudiocdn.com/react@^19.2.0',
  'https://aistudiocdn.com/react-dom@^19.2.0/client',
  'https://aistudiocdn.com/react-router-dom@^7.9.4',
  'https://aistudiocdn.com/recharts@^3.2.1',
  'https://aistudiocdn.com/firebase@^12.4.0/app',
  'https://aistudiocdn.com/firebase@^12.4.0/firestore',
  'https://aistudiocdn.com/react-dropzone@^14.3.8',
  'https://aistudiocdn.com/xlsx@^0.18.5'
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

  // Handle navigation requests for our SPA using a network-first, falling back to cache strategy.
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request).catch(() => {
        // If the network fails (offline), serve the main app shell from the cache.
        return caches.match('/index.html');
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
        // We only want to cache successful responses.
        // For 'basic' responses (same-origin), we can check the status.
        // For 'opaque' responses (cross-origin no-cors), we can't see the status,
        // but we cache it anyway to enable offline functionality.
        if (networkResponse && (networkResponse.status === 200 || networkResponse.type === 'opaque')) {
            const responseToCache = networkResponse.clone();
            caches.open(CACHE_NAME).then(cache => {
                cache.put(event.request, responseToCache);
            });
        }
        return networkResponse;
      });
    })
  );
});