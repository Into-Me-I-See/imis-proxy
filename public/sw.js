const CACHE_NAME = 'imis-cache-v2';
const URLs_TO_PRECACHE = ['/', '/manifest.json'];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(URLs_TO_PRECACHE))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((names) =>
      Promise.all(names.map((n) => (n !== CACHE_NAME ? caches.delete(n) : undefined)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== self.location.origin) return;
  if (req.url.includes('/api/') || req.url.endsWith('/sw.js')) return;

  event.respondWith(
    caches.match(req).then((cached) => {
      const fetchPromise = fetch(req)
        .then((netRes) => {
          const okToCache =
            netRes.ok &&
            ['basic', 'default'].includes(netRes.type) &&
            ((netRes.headers.get('content-type') || '').includes('text/') ||
              (netRes.headers.get('content-type') || '').includes('javascript') ||
              (netRes.headers.get('content-type') || '').includes('css') ||
              (netRes.headers.get('content-type') || '').includes('image'));

          if (okToCache) {
            const clone = netRes.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(req, clone)).catch(() => {});
          }
          return netRes;
        })
        .catch(() => cached || Promise.reject());
      return cached || fetchPromise;
    })
  );
});

self.addEventListener('push', (event) => {
  let d = { title: 'Into-Me-I-See', body: 'You have a new notification', data: {} };
  try {
    if (event.data) d = event.data.json();
  } catch (_) {}
  event.waitUntil(
    self.registration.showNotification(d.title, {
      body: d.body,
      icon: '/icon-192x192.png',
      badge: '/icon-192x192.png',
      data: d.data || {},
    })
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(clients.openWindow(event.notification.data?.url || '/'));
});
