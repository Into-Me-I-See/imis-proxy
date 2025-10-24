const CACHE_NAME = 'imis-cache-v2';
const PRECACHE = ['/'];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE_NAME).then((c) => c.addAll(PRECACHE)));
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.map((k) => (k !== CACHE_NAME ? caches.delete(k) : undefined)))
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
          const type = res.headers.get('content-type') || '';
          const ok =
            res.ok &&
            ['basic', 'default'].includes(res.type) &&
            (type.includes('text/') ||
              type.includes('javascript') ||
              type.includes('css') ||
              type.includes('image') ||
              type.includes('json'));
          if (ok) {
            const clone = res.clone();
            caches.open(CACHE_NAME).then((c) => c.put(req, clone)).catch(() => {});
          }
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
  const target = e.notification.data?.url || '/';
  e.waitUntil(
    (async () => {
      const absolute = new URL(target, self.location.origin).href;
      const clientsList = await clients.matchAll({ type: 'window', includeUncontrolled: true });
      for (const client of clientsList) {
        if (client.url === absolute && 'focus' in client) return client.focus();
      }
      return clients.openWindow(absolute);
    })()
  );
});
