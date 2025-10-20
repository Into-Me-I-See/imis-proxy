const CACHE_NAME = 'into-me-i-see-v1';
const urlsToCache = ['/', '/manifest.json'];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE_NAME)
    .then(c => c.addAll(urlsToCache))
    .then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys()
    .then(n => Promise.all(n.map(x => x !== CACHE_NAME ? caches.delete(x) : undefined)))
    .then(() => self.clients.claim()));
});

self.addEventListener('fetch', (e) => {
  e.respondWith(fetch(e.request)
    .then(r => { const c = r.clone(); caches.open(CACHE_NAME).then(x => x.put(e.request, c)); return r; })
    .catch(() => caches.match(e.request)));
});

self.addEventListener('push', (e) => {
  let d = { title: 'Into-Me-I-See', body: 'You have a new notification', icon: '/icon-192x192.png', badge: '/icon-192x192.png' };
  try { if (e.data) d = e.data.json(); } catch { d.body = e.data?.text() || d.body; }
  e.waitUntil(self.registration.showNotification(d.title, { body: d.body, icon: d.icon, badge: d.badge, data: d.data || {} }));
});

self.addEventListener('notificationclick', (e) => {
  e.notification.close();
  e.waitUntil(clients.openWindow(e.notification.data?.url || '/'));
});
