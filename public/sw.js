const CACHE_NAME = 'imis-v1';

self.addEventListener('install', (e) => {
  e.waitUntil(self.skipWaiting());
});

self.addEventListener('activate', (e) => {
  e.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  const url = new URL(req.url);
  const origin = self.location.origin;
  if (url.origin !== origin) return;
  const local = ['/sw.js', '/manifest.json', '/favicon.ico', '/icon-192x192.png', '/icon-512x512.png'];
  if (local.includes(url.pathname) || url.pathname.startsWith('/api/')) return;
  event.respondWith(fetch(req));
});

self.addEventListener('push', (e) => {
  let d = {};
  try { d = e.data.json(); } catch {}
  const title = d.title || 'Into-Me-I-See';
  const body = d.body || 'You have a new notification';
  const icon = d.icon || '/icons/icon-192.png';
  const image = d.image || '/icons/icon-512.png';
  const data = d.data || {};
  e.waitUntil(
    self.registration.showNotification(title, {
      body: body,
      icon: icon,
      image: image,
      badge: icon,
      data: data,
    })
  );
});

self.addEventListener('notificationclick', (e) => {
  e.notification.close();
  const url = e.notification.data.url || '/';
  e.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((list) => {
      const client = list.find((w) => w.url.includes(url));
      return client ? client.focus() : clients.openWindow(url);
    })
  );
});

