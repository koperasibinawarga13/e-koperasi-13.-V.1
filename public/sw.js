const CACHE_NAME = 'e-koperasi-cache-v9'; // Increment version to force updates
const urlsToCache = [
  '/',               // App root
  '/index.html',     // Main shell
  '/manifest.json',  // Manifest
  '/icon-192x192.png',
  '/icon-512x512.png'
];

// Install event
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      console.log('[SW] Caching app shell');
      return cache.addAll(urlsToCache);
    }).then(() => self.skipWaiting())
  );
});

// Activate event - remove old caches
self.addEventListener('activate', event => {
  const whitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then(keys => 
      Promise.all(keys.map(key => {
        if (!whitelist.includes(key)) {
          console.log('[SW] Deleting old cache:', key);
          return caches.delete(key);
        }
      }))
    ).then(() => self.clients.claim())
  );
});

// Fetch event
self.addEventListener('fetch', event => {
  const { request } = event;

  // Ignore non-GET or cross-origin requests
  if (request.method !== 'GET' || !request.url.startsWith(self.location.origin)) return;

  // Skip Firestore requests
  if (request.url.includes('firestore.googleapis.com')) {
    event.respondWith(fetch(request));
    return;
  }

  // Navigation requests (React Router SPA)
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request).catch(() => caches.match('/index.html'))
    );
    return;
  }

  // Cache-first for other requests
  event.respondWith(
    caches.match(request).then(cached => {
      if (cached) return cached;
      return fetch(request).then(networkResponse => {
        if (!networkResponse || networkResponse.status !== 200 || networkResponse.type === 'opaque') {
          return networkResponse;
        }
        const cloned = networkResponse.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(request, cloned));
        return networkResponse;
      });
    })
  );
});

// Listen for skipWaiting message (force SW update)
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
