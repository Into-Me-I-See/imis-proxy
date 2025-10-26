const CACHE = 'imis-v1';
const PRECACHE = [
  '/',
  '/api/proxy?path=/static/js/vendors.4784dbb1.js',
  '/api/proxy?path=/static/js/main.71ddac5b.js',
  '/api/proxy?path=/static/css/main.728988d8.css',
  '/api/proxy?path=/static/css/vendors.77bf307e.css'
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(PRECACHE)));
  self.skipWaiting();
});
self.addEventListener('activate', e => {
  e.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);
  if (url.origin === location.origin) {
    e.respondWith(
      caches.match(e.request).then(hit => hit || fetch(e.request).then(r => {
        const copy = r.clone();
        caches.open(CACHE).then(c => c.put(e.request, copy));
        return r;
      }))
    );
  }
});

self.addEventListener('push', e => {
  let d = { title: 'Into-Me-I-See', body: 'You have a new notification', data: {} };
  try { if (e.data) d = e.data.json(); } catch {}
  e.waitUntil(self.registration.showNotification(d.title, {
    body: d.body, icon: '/icon-192x192.png', badge: '/icon-192x192.png', data: d.data || {}
  }));
});

self.addEventListener('notificationclick', e => {
  e.notification.close();
  const url = e.notification?.data?.url || '/';
  e.waitUntil(clients.openWindow(url));
});
