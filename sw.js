const CACHE_NAME = 'e-koperasi-cache-v2'; // Incremented version
const urlsToCache = [
  // App Shell
  '/',
  '/index.html',
  '/manifest.json',
  '/vite.svg',
  '/icon-192x192.png',
  '/icon-512x512.png',

  // Local Modules - All tsx/ts files provided
  '/index.tsx',
  '/App.tsx',
  '/types.ts',
  '/firebaseConfig.ts',
  '/context/AuthContext.tsx',
  '/services/anggotaService.ts',
  '/services/keuanganService.ts',
  '/services/pinjamanService.ts',
  
  // Components
  '/components/Sidebar.tsx',
  '/components/Header.tsx',
  '/components/StatCard.tsx',
  '/components/ProgressBar.tsx',
  '/components/Modal.tsx',
  '/components/AnggotaForm.tsx',
  '/components/icons/Icons.tsx',
  '/components/icons/LogoKoperasi.tsx',
  '/components/icons/LoginIllustration.tsx',

  // Pages
  '/pages/LoginPage.tsx',
  '/pages/admin/AdminLayout.tsx',
  '/pages/admin/AdminDashboard.tsx',
  '/pages/admin/AdminAnggota.tsx',
  '/pages/admin/AdminUpload.tsx',
  '/pages/admin/AdminLaporan.tsx',
  '/pages/admin/AdminKeuanganDetail.tsx',
  '/pages/admin/AdminPinjaman.tsx',
  '/pages/admin/AdminPinjamanDetail.tsx',
  '/pages/anggota/AnggotaLayout.tsx',
  '/pages/anggota/AnggotaDashboard.tsx',
  '/pages/anggota/AnggotaKeuangan.tsx',
  '/pages/anggota/AnggotaProfil.tsx',
  '/pages/anggota/SlipRincian.tsx',
  '/pages/anggota/AnggotaPinjaman.tsx',

  // External CDN Resources from index.html
  'https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&display=swap',
  'https://cdn.tailwindcss.com',
  'https://unpkg.com/react@18/umd/react.production.min.js',
  'https://unpkg.com/react-dom@18/umd/react-dom.production.min.js',
  'https://unpkg.com/react-router-dom@6/umd/react-router-dom.production.min.js',
  'https://unpkg.com/recharts@2/umd/Recharts.min.js',
  'https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js',

  // Resources from importmap
  'https://aistudiocdn.com/react@^19.2.0',
  'https://aistudiocdn.com/react-dom@^19.2.0/client', // Specific import from client
  'https://aistudiocdn.com/react-router-dom@^7.9.4',
  'https://aistudiocdn.com/recharts@^3.2.1',
  'https://aistudiocdn.com/firebase@^12.4.0/app', // Specific import
  'https://aistudiocdn.com/firebase@^12.4.0/firestore', // Specific import
  'https://aistudiocdn.com/react-dropzone@^14.3.8',
  'https://aistudiocdn.com/xlsx@^0.18.5'
];

// Install the service worker and cache all critical assets
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Service Worker: Caching all critical assets');
        return cache.addAll(urlsToCache);
      })
      .then(() => self.skipWaiting()) // Force the waiting service worker to become the active one.
      .catch(error => {
        console.error('Service Worker: Failed to cache all assets during install', error);
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
    }).then(() => self.clients.claim()) // Take control of clients without waiting for reload.
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
