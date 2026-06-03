const CACHE_NAME = 'sheariq-shear-tracker-v6';
const APP_SHELL = [
  './',
  './index.html',
  './connection.html',
  './script.js',
  './styles.css',
  './vendor/jspdf.umd.min.js',
  './vendor/jspdf.plugin.autotable.min.js',
  './manifest.json',
  './icons/icon-192.png',
  './icons/icon-512.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE_NAME);
    await Promise.all(APP_SHELL.map(async (asset) => {
      try {
        const response = await fetch(asset, { cache: 'no-store' });
        if (response.ok) {
          await cache.put(asset, response.clone());
        }
      } catch (error) {
        // Ignore optional assets (like icons) that are not present.
      }
    }));
  })());
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key)));
    await self.clients.claim();
  })());
});

function shouldRefreshFromNetwork(requestUrl, request) {
  if (request.mode === 'navigate') return true;
  return requestUrl.pathname.endsWith('/')
    || requestUrl.pathname.endsWith('/index.html')
    || requestUrl.pathname.endsWith('/connection.html')
    || requestUrl.pathname.endsWith('/script.js');
}

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  const requestUrl = new URL(event.request.url);
  if (requestUrl.origin !== self.location.origin) {
    return;
  }

  event.respondWith((async () => {
    const cache = await caches.open(CACHE_NAME);

    if (shouldRefreshFromNetwork(requestUrl, event.request)) {
      try {
        const networkResponse = await fetch(event.request, { cache: 'no-store' });
        if (networkResponse.ok) {
          cache.put(event.request, networkResponse.clone());
        }
        return networkResponse;
      } catch (error) {
        const cached = await cache.match(event.request);
        if (cached) return cached;
        const fallback = await cache.match('./index.html');
        if (fallback) return fallback;
        throw error;
      }
    }

    const cached = await cache.match(event.request);
    if (cached) {
      return cached;
    }

    try {
      const networkResponse = await fetch(event.request);
      if (networkResponse.ok) {
        cache.put(event.request, networkResponse.clone());
      }
      return networkResponse;
    } catch (error) {
      const fallback = await cache.match('./index.html');
      if (fallback) return fallback;
      throw error;
    }
  })());
});
