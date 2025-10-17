const CACHE_NAME = 'e-koperasi-cache-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/manifest.json',
  '/vite.svg',
  '/icon-192x192.png',
  '/icon-512x512.png',
  'https://cdn.tailwindcss.com',
  // Other assets will be cached on the fly by the fetch handler
];

// Install the service worker and cache the app shell
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Service Worker: Caching App Shell');
        return cache.addAll(urlsToCache);
      })
      .catch(error => {
        console.error('Service Worker: Failed to cache app shell', error);
      })
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
    })
  );
});

// Intercept network requests and serve from cache if available (Cache-first, network fallback strategy)
self.addEventListener('fetch', event => {
  // Don't cache API calls to Firestore
  if (event.request.url.includes('firestore.googleapis.com')) {
    event.respondWith(fetch(event.request));
    return;
  }

  event.respondWith(
    caches.match(event.request)
      .then(cachedResponse => {
        // Return the cached response if it exists
        if (cachedResponse) {
          return cachedResponse;
        }

        // If not in cache, fetch from the network
        return fetch(event.request).then(networkResponse => {
            // Check for a valid response
            if (!networkResponse || networkResponse.status !== 200) {
                 return networkResponse;
            }
          
            // Clone the response and add it to the cache for next time
            const responseToCache = networkResponse.clone();
            caches.open(CACHE_NAME)
              .then(cache => {
                cache.put(event.request, responseToCache);
              });
            return networkResponse;
          }
        ).catch(error => {
          console.error('Service Worker: Fetch failed', error);
          // If a navigation request fails (e.g., offline), return the cached index.html.
          if (event.request.mode === 'navigate') {
            return caches.match('/index.html');
          }
        });
      })
  );
});
