const CACHE_NAME = 'imis-cache-v2';
const URLs_TO_PRECACHE = ['/', '/manifest.json'];

/* install */
self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(URLs_TO_PRECACHE)));
  self.skipWaiting();
});

/* activate */
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((names) =>
      Promise.all(names.map((n) => (n !== CACHE_NAME ? caches.delete(n) : undefined)))
    )
  );
  self.clients.claim();
});

/* fetch (cache-first with background update for same-origin GET, skip API + SW) */
self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== self.location.origin) return;
  if (req.url.includes('/api/') || req.url.endsWith('/sw.js')) return;

  event.respondWith(
    caches.match(req).then((cached) => {
      const fetchPromise = fetch(req)
        .then((netRes) => {
          const ct = netRes.headers.get('content-type') || '';
          const okToCache =
            netRes.ok &&
            ['basic', 'default'].includes(netRes.type) &&
            (ct.includes('text/') || ct.includes('javascript') || ct.includes('css') || ct.includes('image'));

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

/* push: rich payload support */
self.addEventListener('push', (e) => {
  const fallback = {
    title: 'Into-Me-I-See',
    body: 'You have a new notification',
    url: '/',
    icon: '/icon-192x192.png',     // uses your existing asset name
    badge: '/icon-192x192.png',    // use a badge if you add one later (e.g. /badge-72.png)
    image: undefined,
    tag: undefined,
    silent: false,
    actions: [{ action: 'open', title: 'Open' }],
    meta: null,
  };

  let data = {};
  try { data = e.data?.json() || {}; } catch (_) {}

  const opts = {
    body: data.body ?? fallback.body,
    icon: data.icon ?? fallback.icon,
    badge: data.badge ?? fallback.badge,
    image: data.image ?? fallback.image,
    tag: data.tag ?? fallback.tag,
    renotify: !!data.tag,
    silent: !!data.silent,
    actions: Array.isArray(data.actions) && data.actions.length ? data.actions.slice(0, 2) : fallback.actions,
    data: { url: data.url ?? fallback.url, meta: data.meta ?? fallback.meta },
  };

  e.waitUntil(self.registration.showNotification(data.title ?? fallback.title, opts));
});

/* notification click: focus existing tab for URL or open new */
self.addEventListener('notificationclick', (e) => {
  e.notification.close();
  const targetUrl = e.notification?.data?.url || '/';

  e.waitUntil((async () => {
    const absolute = new URL(targetUrl, self.location.origin).href;
    const clientsList = await clients.matchAll({ type: 'window', includeUncontrolled: true });

    for (const client of clientsList) {
      if (client.url === absolute && 'focus' in client) {
        client.postMessage({ type: 'notification-click', data: e.notification.data, action: e.action });
        return client.focus();
      }
    }
    return clients.openWindow(absolute);
  })());
});

