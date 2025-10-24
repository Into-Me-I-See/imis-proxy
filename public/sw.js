const CACHE_NAME = 'imis-cache-v2';
const URLs_TO_PRECACHE = ['/', '/manifest.json'];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE_NAME).then((c) => c.addAll(URLs_TO_PRECACHE)));
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((names) =>
      Promise.all(names.map((n) => (n !== CACHE_NAME ? caches.delete(n) : undefined)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  const url = new URL(req.url);

  if (req.method !== 'GET') return;
  if (url.origin !== self.location.origin) return;
  if (url.pathname.startsWith('/api/') || url.pathname === '/sw.js') return;

  e.respondWith(
    caches.match(req).then((cached) => {
      const fetched = fetch(req)
        .then((res) => {
          const ct = res.headers.get('content-type') || '';
          const okToCache =
            res.ok &&
            ['basic', 'default'].includes(res.type) &&
            (ct.includes('text/') || ct.includes('javascript') || ct.includes('css') || ct.includes('image'));
          if (okToCache) caches.open(CACHE_NAME).then((c) => c.put(req, res.clone())).catch(() => {});
          return res;
        })
        .catch(() => cached || Promise.reject());
      return cached || fetched;
    })
  );
});

self.addEventListener('push', (e) => {
  let d = { title: 'Into-Me-I-See', body: 'You have a new notification', data: {} };
  try { if (e.data) d = e.data.json(); } catch (_) {}
  e.waitUntil(
    self.registration.showNotification(d.title, {
      body: d.body,
      icon: '/icon-192x192.png',
      badge: '/icon-192x192.png',
      data: d.data || {},
    })
  );
});

self.addEventListener('notificationclick', (e) => {
  e.notification.close();
  e.waitUntil(clients.openWindow(e.notification.data?.url || '/'));
});

